import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId, requireGroupMember, type AuthCtx } from "./helpers";

const expenseValidator = v.object({
  _id: v.id("expenses"),
  _creationTime: v.number(),
  groupId: v.id("groups"),
  description: v.string(),
  amountCents: v.number(),
  currency: v.string(),
  paidByMemberId: v.id("groupMembers"),
  createdByUserId: v.id("users"),
  splitType: v.union(v.literal("equal"), v.literal("custom")),
  createdAt: v.number(),
});

const expenseWithSharesValidator = v.object({
  _id: v.id("expenses"),
  _creationTime: v.number(),
  groupId: v.id("groups"),
  description: v.string(),
  amountCents: v.number(),
  currency: v.string(),
  paidByMemberId: v.id("groupMembers"),
  createdByUserId: v.id("users"),
  splitType: v.union(v.literal("equal"), v.literal("custom")),
  createdAt: v.number(),
  splitMemberIds: v.array(v.id("groupMembers")),
});

const shareInputValidator = v.object({
  memberId: v.id("groupMembers"),
  amountCents: v.number(),
});

const expenseShareValidator = v.object({
  memberId: v.id("groupMembers"),
  amountCents: v.number(),
});

const buildShares = async (
  ctx: AuthCtx,
  args: {
    groupId: Id<"groups">;
    amountCents: number;
    splitType: "equal" | "custom";
    splitMemberIds?: Array<Id<"groupMembers">>;
    customShares?: Array<{ memberId: Id<"groupMembers">; amountCents: number }>;
  },
) => {
  const splitMembers: Array<{ memberId: Id<"groupMembers">; amountCents: number }> = [];

  if (args.splitType === "equal") {
    const memberIds = Array.from(new Set(args.splitMemberIds ?? []));
    if (memberIds.length === 0) {
      throw new Error("Select at least one member to split with");
    }

    for (const memberId of memberIds) {
      const member = await ctx.db.get(memberId);
      if (!member || member.groupId !== args.groupId || member.isArchived) {
        throw new Error("Split member is not valid for this group");
      }
    }

    const base = Math.floor(args.amountCents / memberIds.length);
    const remainder = args.amountCents - base * memberIds.length;

    memberIds.forEach((memberId, index) => {
      splitMembers.push({
        memberId,
        amountCents: base + (index < remainder ? 1 : 0),
      });
    });
  } else {
    const customShares = args.customShares ?? [];
    if (customShares.length === 0) {
      throw new Error("Provide custom split amounts");
    }

    let total = 0;
    const seenMembers = new Set<string>();
    for (const share of customShares) {
      if (!Number.isInteger(share.amountCents) || share.amountCents <= 0) {
        throw new Error("Custom split amounts must be positive cents");
      }
      if (seenMembers.has(share.memberId)) {
        throw new Error("Custom split members must be unique");
      }
      seenMembers.add(share.memberId);
      const member = await ctx.db.get(share.memberId);
      if (!member || member.groupId !== args.groupId || member.isArchived) {
        throw new Error("Split member is not valid for this group");
      }
      total += share.amountCents;
      splitMembers.push({
        memberId: share.memberId,
        amountCents: share.amountCents,
      });
    }

    if (total !== args.amountCents) {
      throw new Error("Custom split amounts must sum to total");
    }
  }

  return splitMembers;
};

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    description: v.string(),
    amountCents: v.number(),
    paidByMemberId: v.id("groupMembers"),
    splitType: v.union(v.literal("equal"), v.literal("custom")),
    splitMemberIds: v.optional(v.array(v.id("groupMembers"))),
    customShares: v.optional(v.array(shareInputValidator)),
  },
  returns: v.object({
    expenseId: v.id("expenses"),
  }),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    const description = args.description.trim();
    if (!description) {
      throw new Error("Description is required");
    }
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error("Amount must be a positive integer of cents");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const payer = await ctx.db.get(args.paidByMemberId);
    if (!payer || payer.groupId !== args.groupId || payer.isArchived) {
      throw new Error("Payer is not a member of this group");
    }

    const splitMembers = await buildShares(ctx, {
      groupId: args.groupId,
      amountCents: args.amountCents,
      splitType: args.splitType,
      splitMemberIds: args.splitMemberIds,
      customShares: args.customShares,
    });

    const createdAt = Date.now();
    const expenseId = await ctx.db.insert("expenses", {
      groupId: args.groupId,
      description,
      amountCents: args.amountCents,
      currency: group.currency,
      paidByMemberId: args.paidByMemberId,
      createdByUserId: userId,
      splitType: args.splitType,
      createdAt,
    });

    for (const share of splitMembers) {
      await ctx.db.insert("expenseShares", {
        groupId: args.groupId,
        expenseId,
        memberId: share.memberId,
        amountCents: share.amountCents,
        createdAt,
      });
    }

    return { expenseId };
  },
});

export const update = mutation({
  args: {
    expenseId: v.id("expenses"),
    groupId: v.id("groups"),
    description: v.string(),
    amountCents: v.number(),
    paidByMemberId: v.id("groupMembers"),
    splitType: v.union(v.literal("equal"), v.literal("custom")),
    splitMemberIds: v.optional(v.array(v.id("groupMembers"))),
    customShares: v.optional(v.array(shareInputValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    const existing = await ctx.db.get(args.expenseId);
    if (!existing || existing.groupId !== args.groupId) {
      throw new Error("Expense not found");
    }

    const description = args.description.trim();
    if (!description) {
      throw new Error("Description is required");
    }
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error("Amount must be a positive integer of cents");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const payer = await ctx.db.get(args.paidByMemberId);
    if (!payer || payer.groupId !== args.groupId || payer.isArchived) {
      throw new Error("Payer is not a member of this group");
    }

    const splitMembers = await buildShares(ctx, {
      groupId: args.groupId,
      amountCents: args.amountCents,
      splitType: args.splitType,
      splitMemberIds: args.splitMemberIds,
      customShares: args.customShares,
    });

    await ctx.db.patch("expenses", args.expenseId, {
      description,
      amountCents: args.amountCents,
      currency: group.currency,
      paidByMemberId: args.paidByMemberId,
      splitType: args.splitType,
    });

    const existingShares = await ctx.db
      .query("expenseShares")
      .withIndex("by_expenseId", (q) => q.eq("expenseId", args.expenseId))
      .collect();

    for (const share of existingShares) {
      await ctx.db.delete(share._id);
    }

    const createdAt = Date.now();
    for (const share of splitMembers) {
      await ctx.db.insert("expenseShares", {
        groupId: args.groupId,
        expenseId: args.expenseId,
        memberId: share.memberId,
        amountCents: share.amountCents,
        createdAt,
      });
    }

    return null;
  },
});

export const getForEdit = query({
  args: {
    groupId: v.id("groups"),
    expenseId: v.id("expenses"),
  },
  returns: v.object({
    expense: expenseValidator,
    shares: v.array(expenseShareValidator),
    paidByMember: v.object({
      memberId: v.id("groupMembers"),
      displayName: v.string(),
      isArchived: v.boolean(),
    }),
  }),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.groupId !== args.groupId) {
      throw new Error("Expense not found");
    }

    const shares = await ctx.db
      .query("expenseShares")
      .withIndex("by_expenseId", (q) => q.eq("expenseId", args.expenseId))
      .collect();

    const payer = await ctx.db.get(expense.paidByMemberId);
    if (!payer) {
      throw new Error("Payer not found");
    }

    return {
      expense,
      shares: shares.map((share) => ({
        memberId: share.memberId,
        amountCents: share.amountCents,
      })),
      paidByMember: {
        memberId: payer._id,
        displayName: payer.displayName,
        isArchived: payer.isArchived,
      },
    };
  },
});

export const listByGroup = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.array(expenseWithSharesValidator),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    const expensesWithShares = await Promise.all(
      expenses.map(async (expense) => {
        const shares = await ctx.db
          .query("expenseShares")
          .withIndex("by_expenseId", (q) => q.eq("expenseId", expense._id))
          .collect();

        return {
          ...expense,
          splitMemberIds: shares.map((share) => share.memberId),
        };
      }),
    );

    return expensesWithShares;
  },
});
