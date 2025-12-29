import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireAuthUserId, requireGroupMember } from "./helpers";

const balanceValidator = v.object({
  fromMemberId: v.id("groupMembers"),
  toMemberId: v.id("groupMembers"),
  fromDisplayName: v.string(),
  toDisplayName: v.string(),
  amountCents: v.number(),
});

export const getByGroup = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.array(balanceValidator),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const nameById: Record<Id<"groupMembers">, string> = {};
    for (const member of members) {
      nameById[member._id] = member.displayName;
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const expenseById: Record<Id<"expenses">, Doc<"expenses">> = {};
    for (const expense of expenses) {
      expenseById[expense._id] = expense;
    }

    const shares = await ctx.db
      .query("expenseShares")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const rawBalances: Record<string, number> = {};
    const addBalance = (
      fromId: Id<"groupMembers">,
      toId: Id<"groupMembers">,
      amount: number,
    ) => {
      const key = `${fromId}|${toId}`;
      rawBalances[key] = (rawBalances[key] ?? 0) + amount;
    };

    for (const share of shares) {
      const expense = expenseById[share.expenseId];
      if (!expense) {
        continue;
      }
      const payerId = expense.paidByMemberId;
      if (share.memberId === payerId) {
        continue;
      }
      addBalance(share.memberId, payerId, share.amountCents);
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    for (const payment of payments) {
      addBalance(payment.fromMemberId, payment.toMemberId, -payment.amountCents);
    }

    const results: Array<{
      fromMemberId: Id<"groupMembers">;
      toMemberId: Id<"groupMembers">;
      fromDisplayName: string;
      toDisplayName: string;
      amountCents: number;
    }> = [];

    const seenPairs = new Set<string>();
    for (const key of Object.keys(rawBalances)) {
      if (seenPairs.has(key)) {
        continue;
      }
      const [fromId, toId] = key.split("|") as [
        Id<"groupMembers">,
        Id<"groupMembers">
      ];
      const reverseKey = `${toId}|${fromId}`;
      seenPairs.add(key);
      seenPairs.add(reverseKey);

      const amount = rawBalances[key] ?? 0;
      const reverseAmount = rawBalances[reverseKey] ?? 0;
      const netAmount = amount - reverseAmount;
      if (netAmount === 0) {
        continue;
      }

      if (netAmount > 0) {
        results.push({
          fromMemberId: fromId,
          toMemberId: toId,
          fromDisplayName: nameById[fromId] ?? "Member",
          toDisplayName: nameById[toId] ?? "Member",
          amountCents: netAmount,
        });
      } else {
        results.push({
          fromMemberId: toId,
          toMemberId: fromId,
          fromDisplayName: nameById[toId] ?? "Member",
          toDisplayName: nameById[fromId] ?? "Member",
          amountCents: Math.abs(netAmount),
        });
      }
    }

    results.sort((a, b) => b.amountCents - a.amountCents);
    return results;
  },
});
