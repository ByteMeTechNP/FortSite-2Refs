const FORMATTERS: Record<'NPR' | 'INR', Intl.NumberFormat> = {
  NPR: new Intl.NumberFormat('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  INR: new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
};

export function formatMoney(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
): string {
  if (
    amount === null ||
    amount === undefined ||
    amount === '' ||
    currency === null ||
    currency === undefined ||
    currency === ''
  ) {
    return '—';
  }
  const numeric = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isNaN(numeric)) {
    return '—';
  }
  if (currency === 'NPR' || currency === 'INR') {
    return `${FORMATTERS[currency].format(numeric)} ${currency}`;
  }
  return `${numeric.toFixed(2)} ${currency}`;
}
