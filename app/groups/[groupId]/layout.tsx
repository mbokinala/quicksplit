import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  // We can't fetch the group name here easily without setting up the Convex client on the server
  // So we'll use a generic title that still makes sense
  return {
    title: "Group Dashboard - QuickSplit",
    description: "View and manage your group's expenses, payments, and balances.",
  };
}

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
