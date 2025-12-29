"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const groups = useQuery(api.groups.listForUser);
  const profile = useQuery(api.profiles.me);
  const updateProfile = useMutation(api.profiles.upsert);

  const [displayName, setDisplayName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  useEffect(() => {
    if (!profile || isProfileDirty) {
      return;
    }
    setDisplayName(profile.displayName);
  }, [profile, isProfileDirty]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSaved(false);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileError("Enter a display name.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({ displayName: trimmedName });
      setIsProfileDirty(false);
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                QuickSplit
              </p>
              <h1 className="text-3xl font-semibold">Your groups</h1>
            </div>
            <Button asChild>
              <Link href="/groups/new">Create group</Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Keep tabs on shared expenses, balances, and who owes who.
          </p>
        </header>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form className="space-y-3" onSubmit={saveProfile}>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Display name
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      className="flex-1"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(event) => {
                        setIsProfileDirty(true);
                        setDisplayName(event.target.value);
                      }}
                    />
                    <Button type="submit" disabled={isSavingProfile || profile === undefined}>
                      {isSavingProfile ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  {profileError && <p className="text-xs text-destructive">{profileError}</p>}
                  {profileSaved && <p className="text-xs text-emerald-600">Saved.</p>}
                </div>
              </form>
              <p className="text-xs text-muted-foreground">
                This name is used as your default when you create new groups.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {groups === undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Loading groups...</CardTitle>
              </CardHeader>
            </Card>
          )}
          {groups?.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No groups yet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Create your first group to start splitting expenses.
              </CardContent>
            </Card>
          )}
          {groups?.map(({ group }) => (
            <Card key={group._id} className="group">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center justify-between gap-2 text-lg">
                  <span>{group.name}</span>
                  <Badge variant="secondary">{group.currency}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/groups/${group._id}`}>Open dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
