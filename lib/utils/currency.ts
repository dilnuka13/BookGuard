/**
 * Currency display formatter.
 * Default UI currency: LKR / Rs.
 * Formats numbers into clean localized representation: e.g. "Rs. 2,500.00"
 */

export interface FormatCurrencyOptions {
  symbol?: string;
  decimals?: number;
  fallback?: string;
}

export function formatCurrency(
  amount: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const { symbol = "Rs. ", decimals = 2, fallback = "Unpriced" } = options;

  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return fallback;
  }

  const num = Number(amount);
  const formatted = num.toLocaleString("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatted}`;
}

export function formatPriceCompact(amount: number | null | undefined): string {
  return formatCurrency(amount, { decimals: 0, fallback: "—" });
}
