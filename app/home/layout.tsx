import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Groups - QuickSplit",
  description: "Manage your expense groups and track shared bills.",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
