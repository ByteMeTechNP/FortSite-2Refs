import { formatMoney } from '@/components/shared/format-money';

export function CurrencyAmount({
  amount,
  currency,
}: {
  amount: string | number | null | undefined;
  currency: string | null | undefined;
}) {
  return <span className="tabular-nums">{formatMoney(amount, currency)}</span>;
}
