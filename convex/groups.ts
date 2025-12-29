import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getProfileByUserId, requireAuthUserId, requireGroupMember } from "./helpers";

const groupValidator = v.object({
  _id: v.id("groups"),
  _creationTime: v.number(),
  name: v.string(),
  createdBy: v.id("users"),
  inviteCode: v.string(),
  currency: v.string(),
  createdAt: v.number(),
});

const groupListItemValidator = v.object({
  group: groupValidator,
  memberId: v.id("groupMembers"),
});

function generateInviteCode(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += alphabet[byte % alphabet.length];
  }
  return code;
}

async function findUniqueInviteCode(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode(6);
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", code))
      .unique();
    if (!existing) {
      return code;
    }
  }
  throw new Error("Unable to generate invite code");
}

export const create = mutation({
  args: {
    name: v.string(),
    currency: v.string(),
    memberNames: v.array(v.string()),
  },
  returns: v.object({
    groupId: v.id("groups"),
    inviteCode: v.string(),
    memberId: v.id("groupMembers"),
  }),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Group name is required");
    }

    const currency = args.currency.trim() || "USD";
    const inviteCode = await findUniqueInviteCode(ctx);
    const createdAt = Date.now();
    const groupId = await ctx.db.insert("groups", {
      name,
      createdBy: userId,
      inviteCode,
      currency,
      createdAt,
    });

    const profile = await getProfileByUserId(ctx, userId);
    const user = await ctx.db.get(userId);
    const creatorName =
      profile?.displayName ??
      user?.name ??
      (user?.phone ? `User ${user.phone.slice(-4)}` : "Member");

    const memberId = await ctx.db.insert("groupMembers", {
      groupId,
      displayName: creatorName,
      userId,
      invitedBy: userId,
      claimedAt: createdAt,
      isArchived: false,
    });

    const cleanedNames = Array.from(
      new Set(
        args.memberNames
          .map((memberName) => memberName.trim())
          .filter((memberName) => memberName.length > 0),
      ),
    );

    for (const displayName of cleanedNames) {
      await ctx.db.insert("groupMembers", {
        groupId,
        displayName,
        invitedBy: userId,
        isArchived: false,
      });
    }

    return { groupId, inviteCode, memberId };
  },
});

export const getByInviteCode = query({
  args: {
    inviteCode: v.string(),
  },
  returns: v.union(groupValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
  },
});

export const listForUser = query({
  args: {},
  returns: v.array(groupListItemValidator),
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_userId_and_groupId", (q) => q.eq("userId", userId))
      .collect();

    const activeMemberships = memberships.filter((member) => !member.isArchived);
    const results: Array<{ group: Doc<"groups">; memberId: Id<"groupMembers"> }> = [];

    for (const membership of activeMemberships) {
      const group = await ctx.db.get(membership.groupId);
      if (group) {
        results.push({ group, memberId: membership._id });
      }
    }

    results.sort((a, b) => b.group.createdAt - a.group.createdAt);
    return results;
  },
});

export const get = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: groupValidator,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    return group;
  },
});
