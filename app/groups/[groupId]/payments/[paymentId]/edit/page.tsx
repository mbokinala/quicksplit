"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { AlertTriangle } from "lucide-react";

interface PaymentEditPageProps {
  params: Promise<{ groupId: string; paymentId: string }>;
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

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function PaymentEditPage({ params }: PaymentEditPageProps) {
  const router = useRouter();
  const { groupId: groupIdParam, paymentId: paymentIdParam } = React.use(params);
  const groupId = groupIdParam as Id<"groups">;
  const paymentId = paymentIdParam as Id<"payments">;
  const group = useQuery(api.groups.get, { groupId });
  const members = useQuery(api.members.listByGroup, { groupId });
  const payment = useQuery(api.payments.get, { paymentId });
  const updatePayment = useMutation(api.payments.update);
  const deletePayment = useMutation(api.payments.remove);

  const [fromMemberId, setFromMemberId] = useState<string | undefined>();
  const [toMemberId, setToMemberId] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (payment && !isInitialized) {
      setFromMemberId(payment.fromMemberId);
      setToMemberId(payment.toMemberId);
      setAmount(fromCents(payment.amountCents));
      setNote(payment.note || "");
      setIsInitialized(true);
    }
  }, [payment, isInitialized]);

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

      await updatePayment({
        paymentId,
        fromMemberId: fromMemberId as Id<"groupMembers">,
        toMemberId: toMemberId as Id<"groupMembers">,
        amountCents,
        note: note.trim() || undefined,
      });

      router.push(`/groups/${groupId}?tab=payments`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update payment";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await deletePayment({ paymentId });
      router.push(`/groups/${groupId}?tab=payments`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete payment";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!group || !payment) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-muted-foreground">Loading payment...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit payment</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update or delete this payment in {group.currency}.
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

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button asChild variant="ghost">
                    <Link href={`/groups/${groupId}?tab=payments`}>Cancel</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || isSubmitting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
                <Button type="submit" disabled={isSubmitting || isDeleting}>
                  {isSubmitting ? "Saving..." : "Update payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
