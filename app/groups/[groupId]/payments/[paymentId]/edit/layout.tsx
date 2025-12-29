import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Payment - QuickSplit",
  description: "Edit or delete a payment.",
};

export default function EditPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
