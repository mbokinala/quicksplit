import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Calculator, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuickSplit - Split bills easily",
  description: "Track group expenses, split bills fairly, and see who owes what.",
};

export default function Page() {
  return (
    <main className="min-h-screen px-6 py-20">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-20">
        {/* Hero Section */}
        <header className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold sm:text-6xl">QuickSplit</h1>
            <p className="mx-auto max-w-xl text-xl text-muted-foreground">
              Track group expenses, split bills fairly, and see who owes what.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/groups/new">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </header>

        {/* Features Section */}
        <section className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Set up in seconds</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Create a group, add friends, and share an invite link.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Flexible splitting</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Split equally or set custom amounts for each person.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time updates</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Balances update instantly. Everyone stays in sync.
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
