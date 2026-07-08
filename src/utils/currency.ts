const EXCHANGE_RATES: Record<string, number> = {
  KES: 1,
  USD: 0.0077,   // 1 KES = 0.0077 USD
  EUR: 0.0071,   // 1 KES = 0.0071 EUR
  UGX: 28.5,     // 1 KES = 28.5 UGX
  TZS: 20.2,     // 1 KES = 20.2 TZS
  RWF: 10.1,     // 1 KES = 10.1 RWF
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: 'KES',
  USD: '$',
  EUR: '€',
  UGX: 'UGX',
  TZS: 'TZS',
  RWF: 'RWF',
};

/**
 * Converts a base amount in KES to the target currency and formats it.
 */
export function convertAndFormatCurrency(amount: number, targetCurrency: string): string {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  const converted = amount * rate;
  const symbol = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency;

  if (targetCurrency === 'USD' || targetCurrency === 'EUR') {
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${symbol}`;
}
