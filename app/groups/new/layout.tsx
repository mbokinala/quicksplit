import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Group - QuickSplit",
  description: "Create a new expense group to track and split bills with friends.",
};

export default function NewGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
