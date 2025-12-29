"use client";

import React, { useMemo, useState } from "react";
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

interface PaymentNewPageProps {
  params: Promise<{ groupId: string }>;
}

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

export default function PaymentNewPage({ params }: PaymentNewPageProps) {
  const router = useRouter();
  const { groupId: groupIdParam } = React.use(params);
  const groupId = groupIdParam as Id<"groups">;
  const group = useQuery(api.groups.get, { groupId });
  const members = useQuery(api.members.listByGroup, { groupId });
  const recordPayment = useMutation(api.payments.record);

  const [fromMemberId, setFromMemberId] = useState<string | undefined>();
  const [toMemberId, setToMemberId] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedMembers = useMemo(() => {
    return members ? [...members].sort((a, b) => a.displayName.localeCompare(b.displayName)) : [];
  }, [members]);

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!fromMemberId || !toMemberId) {
        throw new Error("Select both members");
      }
      if (fromMemberId === toMemberId) {
        throw new Error("Payment cannot be to the same member");
      }

      const amountCents = toCents(amount);
      if (!amountCents || amountCents <= 0) {
        throw new Error("Enter a valid amount");
      }

      await recordPayment({
        groupId,
        fromMemberId: fromMemberId as Id<"groupMembers">,
        toMemberId: toMemberId as Id<"groupMembers">,
        amountCents,
        note: note.trim() || undefined,
      });

      router.push(`/groups/${groupId}?tab=payments`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-muted-foreground">Loading group...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Record a payment</CardTitle>
            <p className="text-sm text-muted-foreground">
              Capture who paid whom in {group.currency}.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submitPayment}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={fromMemberId} onValueChange={setFromMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedMembers.map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={toMemberId} onValueChange={setToMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedMembers.map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    placeholder="e.g. Venmo"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center justify-between">
                <Button asChild variant="ghost">
                  <Link href={`/groups/${groupId}?tab=payments`}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Record payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
