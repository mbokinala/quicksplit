"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, ChevronDown, ChevronRight, LinkIcon, PencilIcon, PlusIcon, TrendingUpIcon, BanknoteIcon, WalletIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCents, formatSignedCents } from "@/lib/money";
import { cn } from "@/lib/utils";

const formatRelativeDate = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

interface GroupDashboardPageProps {
  params: Promise<{ groupId: string }>;
}

export default function GroupDashboardPage({ params }: GroupDashboardPageProps) {
  const { groupId: groupIdParam } = React.use(params);
  const groupId = groupIdParam as Id<"groups">;
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam && ["expenses", "payments", "balances", "members", "overview"].includes(tabParam)
    ? tabParam
    : "balances";
  const group = useQuery(api.groups.get, { groupId });
  const members = useQuery(api.members.listByGroup, { groupId });
  const expenses = useQuery(api.expenses.listByGroup, { groupId });
  const payments = useQuery(api.payments.listByGroup, { groupId });
  const balances = useQuery(api.balances.getByGroup, { groupId });
  const signedInUser = useQuery(api.users.getSignedInUser);
  const createMember = useMutation(api.members.create);
  const updateMyDisplayName = useMutation(api.members.updateMyDisplayName);
  const deleteGroup = useMutation(api.groups.remove);

  const [newMemberName, setNewMemberName] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [groupDisplayName, setGroupDisplayName] = useState("");
  const [isUpdatingDisplayName, setIsUpdatingDisplayName] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [isDisplayNameDirty, setIsDisplayNameDirty] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const [balanceGrouping, setBalanceGrouping] = useState<"borrower" | "lender">(
    "borrower",
  );
  const [expandedBalances, setExpandedBalances] = useState<Set<string>>(new Set());

  const formatConvexError = (err: unknown, fallback: string) => {
    if (!(err instanceof Error)) {
      return fallback;
    }

    const match = err.message.match(/Error:\s*([^\n]+)/);
    if (match?.[1]) {
      return match[1].trim();
    }

    return err.message || fallback;
  };

  const memberId = useMemo(() => {
    if (!members || !signedInUser) {
      return null;
    }
    const match = members.find((member) => member.userId === signedInUser._id);
    return match?._id ?? null;
  }, [members, signedInUser]);

  const isGroupOwner = useMemo(() => {
    if (!group || !signedInUser) {
      return false;
    }
    return group.createdBy === signedInUser._id;
  }, [group, signedInUser]);

  const currentMember = useMemo(() => {
    if (!members || !memberId) {
      return null;
    }
    return members.find((member) => member._id === memberId) ?? null;
  }, [memberId, members]);

  const memberNameById = useMemo(() => {
    if (!members) {
      return null;
    }
    return members.reduce<Record<string, string>>((acc, member) => {
      acc[member._id] = member.displayName;
      return acc;
    }, {});
  }, [members]);

  type ExpenseWithSplits = NonNullable<typeof expenses>[number];

  const renderName = (name: string) => (
    <strong className="font-semibold text-foreground">{name}</strong>
  );

  const renderNameList = (names: Array<string>) => {
    if (names.length === 0) {
      return null;
    }
    if (names.length === 1) {
      return renderName(names[0]);
    }
    if (names.length === 2) {
      return (
        <>
          {renderName(names[0])} and {renderName(names[1])}
        </>
      );
    }
    return (
      <>
        {names.slice(0, -1).map((name, index) => (
          <React.Fragment key={`${name}-${index}`}>
            {renderName(name)},{" "}
          </React.Fragment>
        ))}
        and {renderName(names[names.length - 1])}
      </>
    );
  };

  const getPaidForLine = (expense: ExpenseWithSplits): React.ReactNode | null => {
    if (!members || !memberNameById) {
      return null;
    }

    const payerName = memberNameById[expense.paidByMemberId] ?? "Member";
    const splitMemberIds = expense.splitMemberIds ?? [];
    const splitMemberSet = new Set(splitMemberIds);
    const allMembersIncluded = members.every((member) => splitMemberSet.has(member._id));

    if (allMembersIncluded) {
      return (
        <>
          {renderName(payerName)} paid for {renderName("everyone")}
        </>
      );
    }

    const recipientNames = splitMemberIds
      .filter((memberId) => memberId !== expense.paidByMemberId)
      .map((memberId) => memberNameById[memberId] ?? "Member");

    if (recipientNames.length === 0) {
      return <>{renderName(payerName)} paid for themselves</>;
    }

    return (
      <>
        {renderName(payerName)} paid for {renderNameList(recipientNames)}
      </>
    );
  };

  useEffect(() => {
    if (!currentMember || isDisplayNameDirty) {
      return;
    }
    setGroupDisplayName(currentMember.displayName);
  }, [currentMember, isDisplayNameDirty]);

  const totals = useMemo(() => {
    const totalExpenses = expenses?.reduce((sum, item) => sum + item.amountCents, 0) ?? 0;
    const totalPayments = payments?.reduce((sum, item) => sum + item.amountCents, 0) ?? 0;

    let net = 0;
    if (balances && memberId) {
      for (const balance of balances) {
        if (balance.toMemberId === memberId) {
          net += balance.amountCents;
        }
        if (balance.fromMemberId === memberId) {
          net -= balance.amountCents;
        }
      }
    }

    return { totalExpenses, totalPayments, net };
  }, [balances, expenses, memberId, payments]);

  const groupedBalances = useMemo(() => {
    if (!balances) {
      return [];
    }

    const groups = new Map<
      string,
      {
        memberId: string;
        memberName: string;
        totalCents: number;
        items: typeof balances;
      }
    >();

    for (const balance of balances) {
      const memberId =
        balanceGrouping === "borrower" ? balance.fromMemberId : balance.toMemberId;
      const memberName =
        balanceGrouping === "borrower" ? balance.fromDisplayName : balance.toDisplayName;
      const existing = groups.get(memberId) ?? {
        memberId,
        memberName,
        totalCents: 0,
        items: [],
      };
      existing.totalCents += balance.amountCents;
      existing.items.push(balance);
      groups.set(memberId, existing);
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => b.amountCents - a.amountCents),
      }))
      .sort((a, b) => b.totalCents - a.totalCents);
  }, [balances, balanceGrouping]);

  const handleDeleteGroup = async () => {
    setDeleteGroupError(null);
    setIsDeletingGroup(true);
    try {
      await deleteGroup({ groupId });
      router.push("/home");
    } catch (err) {
      setDeleteGroupError(formatConvexError(err, "Failed to delete group"));
      setIsDeletingGroup(false);
    }
  };

  const addUnclaimedMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddMemberError(null);

    const trimmedName = newMemberName.trim();
    if (!trimmedName) {
      setAddMemberError("Enter a name to add.");
      return;
    }

    setIsAddingMember(true);
    try {
      await createMember({ groupId, displayName: trimmedName });
      setNewMemberName("");
    } catch (err) {
      const message = formatConvexError(err, "Failed to add member");
      setAddMemberError(message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const saveDisplayName = async () => {
    setDisplayNameError(null);
    setDisplayNameSaved(false);

    const trimmedName = groupDisplayName.trim();
    if (!trimmedName) {
      setDisplayNameError("Enter a display name.");
      return;
    }

    setIsUpdatingDisplayName(true);
    try {
      await updateMyDisplayName({ groupId, displayName: trimmedName });
      setIsDisplayNameDirty(false);
      setDisplayNameSaved(true);
      setIsEditingDisplayName(false);
      window.setTimeout(() => setDisplayNameSaved(false), 2000);
    } catch (err) {
      const message = formatConvexError(err, "Failed to update display name");
      setDisplayNameError(message);
    } finally {
      setIsUpdatingDisplayName(false);
    }
  };

  const copyInviteLink = async () => {
    if (!group) {
      return;
    }
    try {
      const inviteUrl = `${window.location.origin}/invite/${group.inviteCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to copy invite link";
      setAddMemberError(message);
    }
  };

  const toggleBalanceExpanded = (memberId: string) => {
    setExpandedBalances((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  if (!group) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-muted-foreground">Loading group...</p>
      </main>
    );
  }

  const overviewCards = (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUpIcon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total expenses
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold tracking-tight">
            {formatCents(totals.totalExpenses, group.currency)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {expenses?.length || 0} {expenses?.length === 1 ? 'expense' : 'expenses'}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <BanknoteIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total payments
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold tracking-tight">
            {formatCents(totals.totalPayments, group.currency)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {payments?.length || 0} {payments?.length === 1 ? 'payment' : 'payments'}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              totals.net > 0 ? "bg-emerald-500/10" : totals.net < 0 ? "bg-orange-500/10" : "bg-muted"
            )}>
              <WalletIcon className={cn(
                "h-4 w-4",
                totals.net > 0 ? "text-emerald-600 dark:text-emerald-500" :
                totals.net < 0 ? "text-orange-600 dark:text-orange-500" :
                "text-muted-foreground"
              )} />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your net
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              totals.net > 0 ? "text-emerald-600 dark:text-emerald-500" :
              totals.net < 0 ? "text-orange-600 dark:text-orange-500" :
              ""
            )}>
              {memberId ? formatSignedCents(totals.net, group.currency) : "—"}
            </div>
            {totals.net !== 0 && memberId && (
              totals.net > 0 ?
                <ArrowUpIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500" /> :
                <ArrowDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.net > 0 ? "You are owed money" : totals.net < 0 ? "You owe money" : "All settled up"}
          </p>
        </CardContent>
      </Card>
    </>
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10 md:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
                Group dashboard
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{group.name}</h1>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <Badge variant="secondary" className="font-mono">{group.currency}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Invite code:</span>
                  <Badge variant="outline" className="font-mono font-medium">
                    {group.inviteCode}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="default" className="gap-2">
                <Link href={`/groups/${groupId}/expenses/new`}>
                  <PlusIcon className="h-4 w-4" />
                  Add expense
                </Link>
              </Button>
              <Button asChild variant="secondary" size="default" className="gap-2">
                <Link href={`/groups/${groupId}/payments/new`}>
                  <PlusIcon className="h-4 w-4" />
                  Record payment
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" onClick={copyInviteLink}>
                <LinkIcon className="h-4 w-4" />
                <span>{inviteCopied ? "Copied!" : "Copy invite"}</span>
              </Button>
              {isGroupOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Delete group
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Delete this group?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes the group, members, expenses, and payments. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteGroupError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{deleteGroupError}</span>
                      </div>
                    )}
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeletingGroup}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleDeleteGroup}
                        disabled={isDeletingGroup}
                      >
                        {isDeletingGroup ? "Deleting..." : "Delete group"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </header>

        <section className="hidden gap-4 md:grid md:grid-cols-3">{overviewCards}</section>

        <section>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-5 md:grid-cols-4 border border-border/60 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="md:hidden data-[state=active]:bg-background">
                Overview
              </TabsTrigger>
              <TabsTrigger value="expenses" className="data-[state=active]:bg-background">Expenses</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-background">Payments</TabsTrigger>
              <TabsTrigger value="balances" className="data-[state=active]:bg-background">Balances</TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-background">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 md:hidden">
              <div className="grid gap-4">{overviewCards}</div>
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Expenses</CardTitle>
                  {expenses && expenses.length > 0 && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/groups/${groupId}/expenses/new`}>
                        Add
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {expenses?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 p-4 rounded-full bg-muted">
                        <TrendingUpIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No expenses yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add your first expense to start tracking
                      </p>
                      <Button asChild className="mt-4" size="sm">
                        <Link href={`/groups/${groupId}/expenses/new`}>
                          <PlusIcon className="h-4 w-4" />
                          Add expense
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenses?.map((expense) => {
                        const paidForLine = getPaidForLine(expense);
                        return (
                          <div
                            key={expense._id}
                            className="group relative flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
                          >
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {expense.description}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • {formatRelativeDate(expense._creationTime)}
                                </span>
                              </div>
                              {paidForLine && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {paidForLine}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold tabular-nums">
                                {formatCents(expense.amountCents, group.currency)}
                              </span>
                              <Button
                                asChild
                                size="icon-sm"
                                variant="ghost"
                              >
                                <Link href={`/groups/${groupId}/expenses/${expense._id}/edit`}>
                                  <PencilIcon className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Payments</CardTitle>
                  {payments && payments.length > 0 && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/groups/${groupId}/payments/new`}>
                        Add
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {payments?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 p-4 rounded-full bg-muted">
                        <BanknoteIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No payments yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Record a payment to settle balances
                      </p>
                      <Button asChild className="mt-4" size="sm">
                        <Link href={`/groups/${groupId}/payments/new`}>
                          <PlusIcon className="h-4 w-4" />
                          Record payment
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments?.map((payment) => (
                        <div
                          key={payment._id}
                          className="group relative flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                <span className="font-semibold">
                                  {memberNameById?.[payment.fromMemberId] ?? "Member"}
                                </span>
                                {" → "}
                                <span className="font-semibold">
                                  {memberNameById?.[payment.toMemberId] ?? "Member"}
                                </span>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                • {formatRelativeDate(payment._creationTime)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Payment settled
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-500">
                              {formatCents(payment.amountCents, group.currency)}
                            </span>
                            <Button
                              asChild
                              size="icon-sm"
                              variant="ghost"
                            >
                              <Link href={`/groups/${groupId}/payments/${payment._id}/edit`}>
                                <PencilIcon className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balances" className="mt-6">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Balances</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Group by
                    </span>
                    <Select
                      value={balanceGrouping}
                      onValueChange={(value) =>
                        setBalanceGrouping(value as "borrower" | "lender")
                      }
                    >
                      <SelectTrigger size="sm" className="w-[130px]">
                        <SelectValue placeholder="Group by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borrower">Borrower</SelectItem>
                        <SelectItem value="lender">Lender</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {balances === undefined && (
                    <p className="py-8 text-center text-muted-foreground">Loading balances...</p>
                  )}
                  {balances?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 p-4 rounded-full bg-muted">
                        <WalletIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">All settled up!</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No outstanding balances in this group
                      </p>
                    </div>
                  )}
                  {balances?.length ? (
                    <div className="space-y-6">
                      {groupedBalances.map((balanceGroup) => {
                        const isExpanded = expandedBalances.has(balanceGroup.memberId);
                        return (
                          <div
                            key={balanceGroup.memberId}
                            className="rounded-lg border border-border/60 bg-card p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  {balanceGroup.memberName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">
                                    {balanceGroup.memberName}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {balanceGroup.items.length} {balanceGroup.items.length === 1 ? 'balance' : 'balances'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xl font-bold tabular-nums text-orange-600 dark:text-orange-500">
                                {formatCents(balanceGroup.totalCents, group.currency)}
                              </span>
                            </div>

                            <button
                              onClick={() => toggleBalanceExpanded(balanceGroup.memberId)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span>
                                {isExpanded ? 'Hide details' : 'Show details'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-2 rounded-md bg-muted/30 p-3">
                                {balanceGroup.items.map((balance) => (
                                  <div
                                    key={`${balance.fromMemberId}-${balance.toMemberId}`}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <p className="text-muted-foreground">
                                      {balanceGrouping === "borrower" ? (
                                        <>
                                          <span className="font-medium text-foreground">
                                            {balance.fromDisplayName}
                                          </span>
                                          {" owes "}
                                          <span className="font-medium text-foreground">
                                            {balance.toDisplayName}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="font-medium text-foreground">
                                            {balance.toDisplayName}
                                          </span>
                                          {" is owed by "}
                                          <span className="font-medium text-foreground">
                                            {balance.fromDisplayName}
                                          </span>
                                        </>
                                      )}
                                    </p>
                                    <span className="font-semibold tabular-nums text-foreground">
                                      {formatCents(balance.amountCents, group.currency)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Members</CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowAddMember((prev) => !prev)}
                      aria-label={showAddMember ? "Hide add member" : "Show add member"}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {showAddMember && (
                    <form className="space-y-3" onSubmit={addUnclaimedMember}>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Add not joined member
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            className="flex-1"
                            placeholder="Name"
                            value={newMemberName}
                            onChange={(event) => setNewMemberName(event.target.value)}
                          />
                          <Button type="submit" disabled={isAddingMember}>
                            {isAddingMember ? "Adding..." : "Add"}
                          </Button>
                        </div>
                        {addMemberError && (
                          <div
                            role="alert"
                            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                          >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{addMemberError}</span>
                          </div>
                        )}
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {members?.map((member) => {
                      const isSignedInMember = signedInUser?._id === member.userId;
                      return (
                        <div
                          key={member._id}
                          className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                              {!isSignedInMember || !isEditingDisplayName ? (
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <span className="font-medium">{member.displayName}</span>
                                  {displayNameSaved && isSignedInMember && (
                                    <span className="text-xs text-emerald-600">Saved</span>
                                  )}
                                </div>
                              ) : (
                                <span className="sr-only">{member.displayName}</span>
                              )}

                              <div className="flex items-center gap-2">
                                {isSignedInMember && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                                {member.userId ? (
                                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                    Joined
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Not joined</Badge>
                                )}
                                {isSignedInMember && !isEditingDisplayName && (
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label="Edit your display name"
                                    onClick={() => {
                                      setDisplayNameError(null);
                                      setDisplayNameSaved(false);
                                      setIsDisplayNameDirty(false);
                                      setGroupDisplayName(member.displayName);
                                      setIsEditingDisplayName(true);
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {isSignedInMember && isEditingDisplayName && (
                              <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  void saveDisplayName();
                                }}
                              >
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Input
                                    className="flex-1"
                                    placeholder="Display name"
                                    value={groupDisplayName}
                                    onChange={(event) => {
                                      setIsDisplayNameDirty(true);
                                      setGroupDisplayName(event.target.value);
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <Button type="submit" disabled={isUpdatingDisplayName}>
                                      {isUpdatingDisplayName ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() => {
                                        setDisplayNameError(null);
                                        setDisplayNameSaved(false);
                                        setIsDisplayNameDirty(false);
                                        setGroupDisplayName(member.displayName);
                                        setIsEditingDisplayName(false);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                                {displayNameError && (
                                  <p className="text-xs text-destructive">{displayNameError}</p>
                                )}
                              </form>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
