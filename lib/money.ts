export function formatCents(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(amount);
}

export function formatSignedCents(amountCents: number, currency: string): string {
  const sign = amountCents < 0 ? "-" : "";
  return `${sign}${formatCents(Math.abs(amountCents), currency)}`;
}
