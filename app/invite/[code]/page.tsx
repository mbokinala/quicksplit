"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SignIn } from "@/components/sign-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { code } = use(params);
  const inviteCode = code.toUpperCase();
  const signedInUser = useQuery(api.users.getSignedInUser);
  const group = useQuery(api.groups.getByInviteCode, { inviteCode });
  const membership = useQuery(
    api.members.getMyMembership,
    group ? { groupId: group._id } : "skip",
  );
  const unclaimedMembers = useQuery(
    api.members.listUnclaimedByInviteCode,
    group ? { inviteCode: group.inviteCode } : "skip",
  );

  const claimMember = useMutation(api.members.claim);
  const joinByInviteCode = useMutation(api.members.joinByInviteCode);
  const [claimingId, setClaimingId] = useState<Id<"groupMembers"> | null>(null);
  const [customName, setCustomName] = useState("");
  const [joiningCustom, setJoiningCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showSignIn = signedInUser === null;
  const alreadyMember = !!membership && !membership.isArchived;

  const isLoading = useMemo(() => {
    return group === undefined || signedInUser === undefined;
  }, [group, signedInUser]);

  const handleClaim = async (memberId: Id<"groupMembers">) => {
    setError(null);
    setClaimingId(memberId);
    try {
      const claimed = await claimMember({ memberId });
      window.location.href = `/groups/${claimed.groupId}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join group";
      setError(message);
    } finally {
      setClaimingId(null);
    }
  };

  const handleJoinCustom = async () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setError("Enter a name to join.");
      return;
    }
    setError(null);
    setJoiningCustom(true);
    try {
      const claimed = await joinByInviteCode({
        inviteCode,
        displayName: trimmedName,
      });
      window.location.href = `/groups/${claimed.groupId}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join group";
      setError(message);
    } finally {
      setJoiningCustom(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-muted-foreground">Loading invite...</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Invite not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Double-check the link or ask the group admin for a new invite.</p>
            <Button asChild variant="secondary">
              <Link href="/">Go back</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Group invite
            </p>
            <CardTitle className="text-2xl">Join {group.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{group.currency}</Badge>
              <span>Invite code: {group.inviteCode}</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Claim your name to start tracking expenses and balances.
          </CardContent>
        </Card>

        {showSignIn ? (
          <Card>
            <CardHeader>
              <CardTitle>Sign in to claim your spot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We’ll use your phone number to verify your account.
              </p>
              <SignIn variant="inline" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Join as</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alreadyMember && membership ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>You’re already a member of this group.</p>
                  <Button asChild>
                    <Link href={`/groups/${membership.groupId}`}>Open dashboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {unclaimedMembers === undefined && (
                    <p className="text-muted-foreground">Loading members...</p>
                  )}
                  {unclaimedMembers?.length === 0 && (
                    <p className="text-muted-foreground">
                      No not joined members yet. Ask the admin to add you.
                    </p>
                  )}
                  {unclaimedMembers?.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{member.displayName}</span>
                      <Button
                        onClick={() => handleClaim(member._id)}
                        disabled={claimingId === member._id}
                      >
                        {claimingId === member._id ? "Joining..." : "Join"}
                      </Button>
                    </div>
                  ))}
                  <form
                    className="flex flex-col gap-3 rounded-lg border border-dashed border-border/60 px-3 py-3 sm:flex-row sm:items-center"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleJoinCustom();
                    }}
                  >
                    <Input
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                      placeholder="Other name"
                      aria-label="Other name"
                      className="flex-1"
                    />
                    <Button type="submit" disabled={joiningCustom}>
                      {joiningCustom ? "Joining..." : "Join as other"}
                    </Button>
                  </form>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
