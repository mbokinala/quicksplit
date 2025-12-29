"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";

export function SignOut() {
  const { signOut } = useAuthActions();
  return (
    <Button variant="outline" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}