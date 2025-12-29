import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Expense - QuickSplit",
  description: "Edit or delete an expense.",
};

export default function EditExpenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
