import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfileByUserId, requireAuthUserId } from "./helpers";

const profileValidator = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  userId: v.id("users"),
  displayName: v.string(),
  phoneLast4: v.optional(v.string()),
  createdAt: v.number(),
});

export const me = query({
  args: {},
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await getProfileByUserId(ctx, userId);
  },
});

export const upsert = mutation({
  args: {
    displayName: v.string(),
  },
  returns: profileValidator,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const trimmedName = args.displayName.trim();
    if (!trimmedName) {
      throw new Error("Display name is required");
    }

    const existing = await getProfileByUserId(ctx, userId);
    const user = await ctx.db.get(userId);
    const phoneLast4 = user?.phone ? user.phone.slice(-4) : undefined;

    if (!existing) {
      const profileId = await ctx.db.insert("profiles", {
        userId,
        displayName: trimmedName,
        phoneLast4,
        createdAt: Date.now(),
      });
      const profile = await ctx.db.get(profileId);
      if (!profile) {
        throw new Error("Failed to create profile");
      }
      return profile;
    }

    await ctx.db.patch(existing._id, {
      displayName: trimmedName,
      phoneLast4,
    });

    const updated = await ctx.db.get(existing._id);
    if (!updated) {
      throw new Error("Failed to update profile");
    }
    return updated;
  },
});
