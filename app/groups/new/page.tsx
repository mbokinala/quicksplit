"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewGroupPage() {
  const router = useRouter();
  const createGroup = useMutation(api.groups.create);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [memberNames, setMemberNames] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMemberName = (index: number, value: string) => {
    setMemberNames((prev) =>
      prev.map((item, idx) => (idx === index ? value : item)),
    );
  };

  const addMember = () => {
    setMemberNames((prev) => [...prev, ""]);
  };

  const removeMember = (index: number) => {
    setMemberNames((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createGroup({
        name,
        currency,
        memberNames,
      });
      router.push(`/groups/${result.groupId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create group";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a group</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add friends now. They can claim their spot later with an invite link.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="group-name">Group name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g. Tahoe Cabin Trip"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                  maxLength={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Members to add</Label>
                  <Button type="button" variant="secondary" onClick={addMember}>
                    Add member
                  </Button>
                </div>
                <div className="space-y-3">
                  {memberNames.map((memberName, index) => (
                    <div key={`member-${index}`} className="flex gap-2">
                      <Input
                        placeholder="Name"
                        value={memberName}
                        onChange={(event) => updateMemberName(index, event.target.value)}
                      />
                      {memberNames.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeMember(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create group"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
