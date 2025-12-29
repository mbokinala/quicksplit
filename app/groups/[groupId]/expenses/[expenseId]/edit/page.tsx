"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseEditPageProps {
  params: Promise<{ groupId: string; expenseId: string }>;
}

type SplitType = "equal" | "custom";

function toCents(input: string): number | null {
  const normalized = input.replace(/[^0-9.]/g, "");
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.round(parsed * 100);
}

function formatAmountInput(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export default function ExpenseEditPage({ params }: ExpenseEditPageProps) {
  const router = useRouter();
  const { groupId: groupIdParam, expenseId: expenseIdParam } = React.use(params);
  const groupId = groupIdParam as Id<"groups">;
  const expenseId = expenseIdParam as Id<"expenses">;
  const group = useQuery(api.groups.get, { groupId });
  const members = useQuery(api.members.listByGroup, { groupId });
  const expenseData = useQuery(api.expenses.getForEdit, { groupId, expenseId });
  const updateExpense = useMutation(api.expenses.update);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState<string | undefined>();
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasManualSplitSelection, setHasManualSplitSelection] = useState(false);

  useEffect(() => {
    if (!expenseData || isInitialized) {
      return;
    }

    const shareMap: Record<string, string> = {};
    const memberIds: string[] = [];
    for (const share of expenseData.shares) {
      shareMap[share.memberId] = formatAmountInput(share.amountCents);
      memberIds.push(share.memberId);
    }

    setDescription(expenseData.expense.description);
    setAmount(formatAmountInput(expenseData.expense.amountCents));
    setPaidByMemberId(expenseData.expense.paidByMemberId);
    setSplitType(expenseData.expense.splitType);
    setSelectedMemberIds(memberIds);
    setCustomShares(shareMap);
    setIsInitialized(true);
  }, [expenseData, isInitialized]);

  const sortedMembers = useMemo(() => {
    return members ? [...members].sort((a, b) => a.displayName.localeCompare(b.displayName)) : [];
  }, [members]);

  const paidByOptions = useMemo(() => {
    const base = sortedMembers.map((member) => ({
      id: member._id,
      label: member.displayName,
    }));
    const payerId = expenseData?.expense?.paidByMemberId;
    if (!payerId) {
      return base;
    }
    const exists = base.some((member) => member.id === payerId);
    if (exists) {
      return base;
    }
    const paidBy = expenseData?.paidByMember;
    let label = "Former member";
    if (paidBy?.memberId === payerId) {
      label = paidBy.isArchived ? `${paidBy.displayName} (archived)` : paidBy.displayName;
    }
    return [{ id: payerId, label }, ...base];
  }, [expenseData?.expense?.paidByMemberId, expenseData?.paidByMember, sortedMembers]);

  React.useEffect(() => {
    if (splitType !== "equal" || hasManualSplitSelection || sortedMembers.length === 0) {
      return;
    }
    if (selectedMemberIds.length === 0) {
      setSelectedMemberIds(sortedMembers.map((member) => member._id));
    }
  }, [splitType, hasManualSplitSelection, selectedMemberIds.length, sortedMembers]);

  const toggleMember = (memberId: string) => {
    setHasManualSplitSelection(true);
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const updateCustomShare = (memberId: string, value: string) => {
    setCustomShares((prev) => ({ ...prev, [memberId]: value }));
  };

  const submitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!paidByMemberId) {
        throw new Error("Select who paid");
      }
      const amountCents = toCents(amount);
      if (!amountCents || amountCents <= 0) {
        throw new Error("Enter a valid amount");
      }

      if (splitType === "equal") {
        if (selectedMemberIds.length === 0) {
          throw new Error("Choose at least one member to split with");
        }

        await updateExpense({
          expenseId,
          groupId,
          description,
          amountCents,
          paidByMemberId: paidByMemberId as Id<"groupMembers">,
          splitType,
          splitMemberIds: selectedMemberIds as Id<"groupMembers">[],
        });
      } else {
        const shares = Object.entries(customShares)
          .map(([memberId, value]) => ({
            memberId: memberId as Id<"groupMembers">,
            amountCents: toCents(value) ?? 0,
          }))
          .filter((share) => share.amountCents > 0);

        if (shares.length === 0) {
          throw new Error("Enter custom amounts for at least one member");
        }

        await updateExpense({
          expenseId,
          groupId,
          description,
          amountCents,
          paidByMemberId: paidByMemberId as Id<"groupMembers">,
          splitType,
          customShares: shares,
        });
      }

      router.push(`/groups/${groupId}?tab=expenses`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update expense";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group || !expenseData || !isInitialized) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-muted-foreground">Loading expense...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit expense</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update the details and split for this expense in {group.currency}.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submitExpense}>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Dinner, groceries, lodging"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Paid by</Label>
                  <Select value={paidByMemberId} onValueChange={setPaidByMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {paidByOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Split type</Label>
                <Select value={splitType} onValueChange={(value) => setSplitType(value as SplitType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {splitType === "equal" ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Split between</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemberIds.length < sortedMembers.length && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setHasManualSplitSelection(true);
                            setSelectedMemberIds(sortedMembers.map((member) => member._id));
                          }}
                        >
                          Select all
                        </Button>
                      )}
                      {selectedMemberIds.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setHasManualSplitSelection(true);
                            setSelectedMemberIds([]);
                          }}
                        >
                          Deselect all
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sortedMembers.map((member) => (
                      <label
                        key={member._id}
                        className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(member._id)}
                          onChange={() => toggleMember(member._id)}
                        />
                        <span>{member.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Custom split</Label>
                  <div className="space-y-2">
                    {sortedMembers.map((member) => (
                      <div key={member._id} className="flex items-center gap-3">
                        <span className="w-40 text-sm">{member.displayName}</span>
                        <Input
                          placeholder="0.00"
                          value={customShares[member._id] ?? ""}
                          onChange={(event) => updateCustomShare(member._id, event.target.value)}
                          inputMode="decimal"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center justify-between">
                <Button asChild variant="ghost">
                  <Link href={`/groups/${groupId}?tab=expenses`}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
