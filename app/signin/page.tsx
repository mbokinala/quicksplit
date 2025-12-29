import { SignIn } from "@/components/sign-in";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - QuickSplit",
  description: "Sign in to manage your expense groups and track shared bills.",
};

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_55%)] px-6 py-12">
            <div className="flex min-h-[calc(100vh-6rem)] items-center">
            <div className="mx-auto flex w-full max-w-md flex-col gap-6">
                <div className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    QuickSplit
                </div>
                <SignIn />
            </div>
            </div>
        </main>
    );
}
