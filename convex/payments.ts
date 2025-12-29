import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId, requireGroupMember } from "./helpers";

const paymentValidator = v.object({
  _id: v.id("payments"),
  _creationTime: v.number(),
  groupId: v.id("groups"),
  fromMemberId: v.id("groupMembers"),
  toMemberId: v.id("groupMembers"),
  amountCents: v.number(),
  note: v.optional(v.string()),
  createdByUserId: v.id("users"),
  createdAt: v.number(),
});

export const record = mutation({
  args: {
    groupId: v.id("groups"),
    fromMemberId: v.id("groupMembers"),
    toMemberId: v.id("groupMembers"),
    amountCents: v.number(),
    note: v.optional(v.string()),
  },
  returns: v.object({ paymentId: v.id("payments") }),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    if (args.fromMemberId === args.toMemberId) {
      throw new Error("Payment cannot be to the same member");
    }
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error("Amount must be a positive integer of cents");
    }

    const fromMember = await ctx.db.get(args.fromMemberId);
    const toMember = await ctx.db.get(args.toMemberId);
    if (
      !fromMember ||
      !toMember ||
      fromMember.groupId !== args.groupId ||
      toMember.groupId !== args.groupId ||
      fromMember.isArchived ||
      toMember.isArchived
    ) {
      throw new Error("Payment members are invalid for this group");
    }

    const paymentId = await ctx.db.insert("payments", {
      groupId: args.groupId,
      fromMemberId: args.fromMemberId,
      toMemberId: args.toMemberId,
      amountCents: args.amountCents,
      note: args.note?.trim() || undefined,
      createdByUserId: userId,
      createdAt: Date.now(),
    });

    return { paymentId };
  },
});

export const listByGroup = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.array(paymentValidator),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);

    return await ctx.db
      .query("payments")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: {
    paymentId: v.id("payments"),
  },
  returns: v.union(paymentValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const payment = await ctx.db.get(args.paymentId);

    if (!payment) {
      return null;
    }

    await requireGroupMember(ctx, payment.groupId, userId);
    return payment;
  },
});

export const update = mutation({
  args: {
    paymentId: v.id("payments"),
    fromMemberId: v.id("groupMembers"),
    toMemberId: v.id("groupMembers"),
    amountCents: v.number(),
    note: v.optional(v.string()),
  },
  returns: v.object({ paymentId: v.id("payments") }),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const existingPayment = await ctx.db.get(args.paymentId);

    if (!existingPayment) {
      throw new Error("Payment not found");
    }

    await requireGroupMember(ctx, existingPayment.groupId, userId);

    if (args.fromMemberId === args.toMemberId) {
      throw new Error("Payment cannot be to the same member");
    }
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error("Amount must be a positive integer of cents");
    }

    const fromMember = await ctx.db.get(args.fromMemberId);
    const toMember = await ctx.db.get(args.toMemberId);
    if (
      !fromMember ||
      !toMember ||
      fromMember.groupId !== existingPayment.groupId ||
      toMember.groupId !== existingPayment.groupId ||
      fromMember.isArchived ||
      toMember.isArchived
    ) {
      throw new Error("Payment members are invalid for this group");
    }

    await ctx.db.patch(args.paymentId, {
      fromMemberId: args.fromMemberId,
      toMemberId: args.toMemberId,
      amountCents: args.amountCents,
      note: args.note?.trim() || undefined,
    });

    return { paymentId: args.paymentId };
  },
});

export const remove = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const payment = await ctx.db.get(args.paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    await requireGroupMember(ctx, payment.groupId, userId);
    await ctx.db.delete(args.paymentId);

    return null;
  },
});
