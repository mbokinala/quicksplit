import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Zap,
  Calculator,
  RefreshCw,
  Shield,
  Smartphone,
  ArrowRightLeft,
  Users,
  Receipt,
  CheckCircle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuickSplit - Split bills easily",
  description: "Track group expenses, split bills fairly, and see who owes what—all without the awkward conversations.",
};

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_transparent_60%)] px-6 py-12 md:py-20">
      {/* Animated Gradient Orbs */}
      <div
        className="gradient-orb -top-24 left-1/4 h-96 w-96 bg-chart-1"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="gradient-orb right-1/4 top-1/3 h-80 w-80 bg-chart-3"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="gradient-orb bottom-1/4 left-1/3 h-96 w-96 bg-chart-5"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 md:gap-24">
        {/* Hero Section */}
        <header className="flex flex-col items-center gap-8 text-center animate-fade-in">
          <div className="space-y-6">
            <h1 className="gradient-text text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              QuickSplit
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl">
              Track group expenses, split bills fairly, and see who owes what—all without the awkward conversations.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/groups/new">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </header>

        {/* Features Section */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything you need to split with confidence
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple tools for fair splits, every time.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader>
                <div className="icon-circle mb-4 bg-gradient-to-br from-chart-1 to-chart-2">
                  <Zap className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Set up in seconds</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Create a group, add your friends (even before they join), and share one simple invite link. No complex setup, no barriers.
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader>
                <div className="icon-circle mb-4 bg-gradient-to-br from-chart-2 to-chart-3">
                  <Calculator className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Flexible splitting</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Split equally across the group, or set custom amounts for each person. Handle any scenario, down to the cent.
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader>
                <div className="icon-circle mb-4 bg-gradient-to-br from-chart-3 to-chart-4">
                  <RefreshCw className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Real-time updates</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Balances update instantly as expenses and payments are added. Everyone sees the same numbers, always in sync.
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader>
                <div className="icon-circle mb-4 bg-gradient-to-br from-chart-4 to-chart-5">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Privacy-first</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your financial data stays private. No ads, no tracking, no data selling. Just simple expense splitting.
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader>
                <div className="icon-circle mb-4 bg-gradient-to-br from-chart-5 to-chart-1">
                  <Smartphone className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Works everywhere</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Fully responsive design that works seamlessly on any device. Track expenses from your phone, tablet, or desktop.
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader>
                <div className="icon-circle mb-4 bg-gradient-to-br from-chart-1 to-chart-2">
                  <ArrowRightLeft className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Smart settlements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                See exactly who owes whom and how much. Smart calculations minimize the number of transactions needed.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="space-y-8 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Three simple steps to split anything
            </h2>
            <p className="text-lg text-muted-foreground">
              From group creation to settlement in minutes, not hours
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3 md:gap-12">
            {/* Timeline connectors - behind the content */}
            <div className="absolute left-0 top-10 hidden w-full md:block">
              <div className="relative mx-auto flex h-1 w-2/3 items-center justify-between">
                <div className="h-1 flex-1 bg-gradient-to-r from-chart-2 to-chart-3" />
                <div className="h-1 flex-1 bg-gradient-to-r from-chart-4 to-chart-5" />
              </div>
            </div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-chart-1 to-chart-2 text-2xl font-bold text-primary-foreground shadow-lg">
                  01
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-chart-1 shadow-md">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Create your group</h3>
              <p className="text-muted-foreground">
                Add a group name and list your friends. They don&apos;t need accounts yet—add them as unclaimed members and share your unique invite link.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-chart-3 to-chart-4 text-2xl font-bold text-primary-foreground shadow-lg">
                  02
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-chart-3 shadow-md">
                  <Receipt className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Add expenses as you go</h3>
              <p className="text-muted-foreground">
                When someone pays for something shared, add it to the group. Split equally or customize amounts. Attach notes and see balances update instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-chart-5 to-chart-1 text-2xl font-bold text-primary-foreground shadow-lg">
                  03
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-chart-5 shadow-md">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Settle balances</h3>
              <p className="text-muted-foreground">
                See who owes whom with optimized settlement suggestions. Record payments when they happen, and watch balances clear to zero.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section
          className="border-shimmer animate-fade-in overflow-hidden rounded-2xl backdrop-blur-xl"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="bg-gradient-to-br from-background/80 to-muted/40 p-8 md:p-12">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Ready to split smarter?
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Create your first group in under 60 seconds. No signup required until you&apos;re ready.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group animate-pulse">
                  <Link href="/groups/new">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/signin">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
