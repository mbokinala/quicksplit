"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignOut } from "@/components/sign-out";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-xl font-semibold">
          <Authenticated>
            <Link href="/home">QuickSplit</Link>
          </Authenticated>
          <Unauthenticated>
            <Link href="/">QuickSplit</Link>
          </Unauthenticated>
        </div>
        <Authenticated>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/home">
              Home
            </Link>
          </nav>
        </Authenticated>
        <div>
          <Authenticated>
            <SignOut />
          </Authenticated>
          <Unauthenticated>
            <Button asChild variant="outline">
              <Link href="/signin">Sign in</Link>
            </Button>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}
