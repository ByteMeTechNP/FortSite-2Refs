import { CurrencyAmount } from '@/components/shared/currency-amount';

export function MoneyStack({
  totals,
  empty = 'No amounts yet',
}: {
  totals: Record<string, number | string> | null | undefined;
  empty?: string;
}) {
  const rows = Object.entries(totals ?? {}).filter(
    ([, amount]) => amount !== '' && amount !== null && amount !== undefined,
  );
  if (rows.length === 0) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  return (
    <div className="grid gap-1">
      {rows.map(([currency, amount]) => (
        <CurrencyAmount key={currency} amount={amount} currency={currency} />
      ))}
    </div>
  );
}
