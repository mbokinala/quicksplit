import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId, requireGroupMember } from "./helpers";

const memberValidator = v.object({
  _id: v.id("groupMembers"),
  _creationTime: v.number(),
  groupId: v.id("groups"),
  displayName: v.string(),
  userId: v.optional(v.id("users")),
  invitedBy: v.id("users"),
  claimedAt: v.optional(v.number()),
  isArchived: v.boolean(),
});

export const listByGroup = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.array(memberValidator),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireGroupMember(ctx, args.groupId, userId);
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    return members.filter((member) => !member.isArchived);
  },
});

export const getMyMembership = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.union(memberValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", args.groupId).eq("userId", userId),
      )
      .unique();
  },
});

export const listUnclaimedByInviteCode = query({
  args: {
    inviteCode: v.string(),
  },
  returns: v.array(memberValidator),
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!group) {
      return [];
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", group._id))
      .collect();

    return members.filter((member) => !member.isArchived && !member.userId);
  },
});

export const claim = mutation({
  args: {
    memberId: v.id("groupMembers"),
  },
  returns: memberValidator,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member || member.isArchived) {
      throw new Error("Member not found");
    }
    if (member.userId) {
      throw new Error("Member already claimed");
    }

    const existingClaim = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", member.groupId).eq("userId", userId),
      )
      .unique();
    if (existingClaim) {
      if (!existingClaim.isArchived) {
        return existingClaim;
      }

      await ctx.db.patch(existingClaim._id, {
        isArchived: false,
        claimedAt: Date.now(),
        displayName: member.displayName,
      });
      await ctx.db.patch(member._id, { isArchived: true });

      const revived = await ctx.db.get(existingClaim._id);
      if (!revived) {
        throw new Error("Failed to restore membership");
      }
      return revived;
    }

    await ctx.db.patch(member._id, {
      userId,
      claimedAt: Date.now(),
    });

    const updated = await ctx.db.get(member._id);
    if (!updated) {
      throw new Error("Failed to claim member");
    }
    return updated;
  },
});

export const joinByInviteCode = mutation({
  args: {
    inviteCode: v.string(),
    displayName: v.string(),
  },
  returns: memberValidator,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
    if (!group) {
      throw new Error("Group not found");
    }

    const trimmedName = args.displayName.trim();
    if (!trimmedName) {
      throw new Error("Display name is required");
    }

    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", group._id).eq("userId", userId),
      )
      .unique();
    if (existingMembership) {
      if (!existingMembership.isArchived) {
        return existingMembership;
      }

      await ctx.db.patch(existingMembership._id, {
        isArchived: false,
        claimedAt: Date.now(),
        displayName: trimmedName,
      });
      const revived = await ctx.db.get(existingMembership._id);
      if (!revived) {
        throw new Error("Failed to restore membership");
      }
      return revived;
    }

    const existingMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", group._id))
      .collect();
    const normalizedName = trimmedName.toLowerCase();
    const activeMatches = existingMembers.filter((member) => {
      if (member.isArchived) {
        return false;
      }
      return member.displayName.trim().toLowerCase() === normalizedName;
    });
    const claimedMatch = activeMatches.find((member) => member.userId);
    if (claimedMatch) {
      throw new Error("A member with this name already exists in the group");
    }
    const unclaimedMatch = activeMatches.find((member) => !member.userId);
    if (unclaimedMatch) {
      await ctx.db.patch(unclaimedMatch._id, {
        userId,
        claimedAt: Date.now(),
      });
      const updated = await ctx.db.get(unclaimedMatch._id);
      if (!updated) {
        throw new Error("Failed to claim member");
      }
      return updated;
    }

    const memberId = await ctx.db.insert("groupMembers", {
      groupId: group._id,
      displayName: trimmedName,
      userId,
      invitedBy: userId,
      claimedAt: Date.now(),
      isArchived: false,
    });

    const member = await ctx.db.get(memberId);
    if (!member) {
      throw new Error("Failed to join group");
    }

    return member;
  },
});

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    displayName: v.string(),
  },
  returns: memberValidator,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    await requireGroupMember(ctx, args.groupId, userId);

    const trimmedName = args.displayName.trim();
    if (!trimmedName) {
      throw new Error("Display name is required");
    }

    const existingMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    const normalizedName = trimmedName.toLowerCase();
    const hasDuplicateName = existingMembers.some((member) => {
      if (member.isArchived) {
        return false;
      }
      return member.displayName.trim().toLowerCase() === normalizedName;
    });
    if (hasDuplicateName) {
      throw new Error("A member with this name already exists in the group");
    }

    const memberId = await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      displayName: trimmedName,
      invitedBy: userId,
      isArchived: false,
    });

    const member = await ctx.db.get(memberId);
    if (!member) {
      throw new Error("Failed to create member");
    }

    return member;
  },
});

export const updateMyDisplayName = mutation({
  args: {
    groupId: v.id("groups"),
    displayName: v.string(),
  },
  returns: memberValidator,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const membership = await requireGroupMember(ctx, args.groupId, userId);

    const trimmedName = args.displayName.trim();
    if (!trimmedName) {
      throw new Error("Display name is required");
    }

    const existingMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    const normalizedName = trimmedName.toLowerCase();
    const hasDuplicateName = existingMembers.some((member) => {
      if (member.isArchived || member._id === membership._id) {
        return false;
      }
      return member.displayName.trim().toLowerCase() === normalizedName;
    });
    if (hasDuplicateName) {
      throw new Error("A member with this name already exists in the group");
    }

    await ctx.db.patch(membership._id, { displayName: trimmedName });
    const updated = await ctx.db.get(membership._id);
    if (!updated) {
      throw new Error("Failed to update display name");
    }
    return updated;
  },
});
