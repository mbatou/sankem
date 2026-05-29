import { currency } from "@/config/brand";

/**
 * Format an integer XOF amount as FCFA. XOF has no minor unit, so amounts are
 * always whole numbers. e.g. 45000 -> "45 000 FCFA".
 */
export function formatXOF(amount: number): string {
  const grouped = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${grouped} ${currency.label}`;
}
