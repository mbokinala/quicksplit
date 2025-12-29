import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    phoneLast4: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  groups: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    inviteCode: v.string(),
    currency: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_inviteCode", ["inviteCode"]),
  groupMembers: defineTable({
    groupId: v.id("groups"),
    displayName: v.string(),
    userId: v.optional(v.id("users")),
    invitedBy: v.id("users"),
    claimedAt: v.optional(v.number()),
    isArchived: v.boolean(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_userId", ["groupId", "userId"])
    .index("by_userId_and_groupId", ["userId", "groupId"]),
  expenses: defineTable({
    groupId: v.id("groups"),
    description: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    paidByMemberId: v.id("groupMembers"),
    createdByUserId: v.id("users"),
    splitType: v.union(v.literal("equal"), v.literal("custom")),
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_paidByMemberId", ["groupId", "paidByMemberId"]),
  expenseShares: defineTable({
    groupId: v.id("groups"),
    expenseId: v.id("expenses"),
    memberId: v.id("groupMembers"),
    amountCents: v.number(),
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_expenseId", ["expenseId"])
    .index("by_groupId_and_memberId", ["groupId", "memberId"]),
  payments: defineTable({
    groupId: v.id("groups"),
    fromMemberId: v.id("groupMembers"),
    toMemberId: v.id("groupMembers"),
    amountCents: v.number(),
    note: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_fromMemberId", ["groupId", "fromMemberId"])
    .index("by_groupId_and_toMemberId", ["groupId", "toMemberId"]),
  memberBalances: defineTable({
    groupId: v.id("groups"),
    fromMemberId: v.id("groupMembers"),
    toMemberId: v.id("groupMembers"),
    amountCents: v.number(),
    updatedAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_fromMemberId", ["groupId", "fromMemberId"])
    .index("by_groupId_and_toMemberId", ["groupId", "toMemberId"]),
});

export default schema;
