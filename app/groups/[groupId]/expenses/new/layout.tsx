import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Expense - QuickSplit",
  description: "Add a new expense to your group.",
};

export default function NewExpenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
