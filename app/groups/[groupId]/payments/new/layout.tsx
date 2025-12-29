import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Record Payment - QuickSplit",
  description: "Record a payment to settle balances.",
};

export default function NewPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
