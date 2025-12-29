import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type AuthCtx = QueryCtx | MutationCtx;

export async function requireAuthUserId(ctx: AuthCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function getProfileByUserId(
  ctx: AuthCtx,
  userId: Id<"users">,
): Promise<Doc<"profiles"> | null> {
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireGroupMember(
  ctx: AuthCtx,
  groupId: Id<"groups">,
  userId: Id<"users">,
): Promise<Doc<"groupMembers">> {
  const member = await ctx.db
    .query("groupMembers")
    .withIndex("by_groupId_and_userId", (q) =>
      q.eq("groupId", groupId).eq("userId", userId),
    )
    .unique();

  if (!member || member.isArchived) {
    throw new Error("Not a group member");
  }

  return member;
}
