import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              EasySplit
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Split expenses with clarity, not chaos.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Create a group, add friends, and track who owes who. Simple balances,
              clean splits, and a fast path from invite to settled.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signin">Sign in with phone</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/groups/new">Create a group</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Set up in minutes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Add members before they join, then share a short invite link.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Flexible splits</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Split equally or custom, down to the cent.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Always up to date</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Balances update instantly as expenses and payments come in.
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-border/60 bg-background/60 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Ready to settle up?</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to view your groups or create a new one.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/home">Go to dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/groups/new">Start a group</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
