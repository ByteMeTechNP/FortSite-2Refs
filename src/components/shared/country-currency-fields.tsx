import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COUNTRIES = ['Nepal', 'India'] as const;
const CURRENCIES = ['NPR', 'INR'] as const;

export type CountryCurrencyCountry = (typeof COUNTRIES)[number];
export type CountryCurrencyCode = (typeof CURRENCIES)[number];

function defaultCurrencyForCountry(
  country: CountryCurrencyCountry,
): CountryCurrencyCode {
  return country === 'India' ? 'INR' : 'NPR';
}

/**
 * Presentational country and currency pair from the reference create flow.
 * The target onboarding wizard does not mount this control: currency stays
 * locked to the registration country, with no separate currency field.
 */
export function CountryCurrencyFields({
  country,
  currency,
  onCountryChange,
  onCurrencyChange,
  currencyManuallySet,
}: {
  country: CountryCurrencyCountry;
  currency: CountryCurrencyCode;
  onCountryChange: (
    country: CountryCurrencyCountry,
    nextDefault: CountryCurrencyCode,
  ) => void;
  onCurrencyChange: (currency: CountryCurrencyCode) => void;
  currencyManuallySet: boolean;
}) {
  const suggested = defaultCurrencyForCountry(country);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="country">Country</Label>
        <Select
          value={country}
          onValueChange={(value) => {
            const next = value as CountryCurrencyCountry;
            onCountryChange(next, defaultCurrencyForCountry(next));
          }}
        >
          <SelectTrigger id="country" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="currency">Default currency</Label>
        <Select
          value={currency}
          onValueChange={(value) =>
            onCurrencyChange(value as CountryCurrencyCode)
          }
        >
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
                {item === suggested ? ' (country default)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          {currencyManuallySet
            ? `${currency} was selected manually. Historical financial records will not be converted.`
            : `${country} defaults to ${suggested}. You may choose the other permitted currency.`}
        </p>
      </div>
    </div>
  );
}
