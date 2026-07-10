// All rates relative to KES (Kenyan Shilling) as internal base
// TZS is displayed as default to the user
const EXCHANGE_RATES_FROM_KES: Record<string, number> = {
  KES: 1,
  TZS: 20.2,     // 1 KES = ~20.2 TZS
  USD: 0.0077,   // 1 KES = 0.0077 USD
  EUR: 0.0071,   // 1 KES = 0.0071 EUR
  UGX: 28.5,     // 1 KES = ~28.5 UGX
  RWF: 10.1,     // 1 KES = ~10.1 RWF
  BIF: 22.8,     // 1 KES = ~22.8 BIF (Burundian Franc)
  ZMW: 0.19,     // 1 KES = ~0.19 ZMW (Zambian Kwacha)
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: 'KSh',
  TZS: 'TSh',
  USD: '$',
  EUR: '€',
  UGX: 'USh',
  RWF: 'RF',
  BIF: 'FBu',
  ZMW: 'ZK',
};

export const CURRENCY_FLAGS: Record<string, string> = {
  KES: '🇰🇪',
  TZS: '🇹🇿',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  UGX: '🇺🇬',
  RWF: '🇷🇼',
  BIF: '🇧🇮',
  ZMW: '🇿🇲',
};

export const CURRENCY_NAMES: Record<string, string> = {
  KES: 'Kenyan Shilling',
  TZS: 'Tanzanian Shilling',
  USD: 'US Dollar',
  EUR: 'Euro',
  UGX: 'Ugandan Shilling',
  RWF: 'Rwandan Franc',
  BIF: 'Burundian Franc',
  ZMW: 'Zambian Kwacha',
};

/**
 * Converts an amount in KES to the target currency and formats it with proper symbol.
 */
export function convertAndFormatCurrency(amountKES: number, targetCurrency: string): string {
  const rate = EXCHANGE_RATES_FROM_KES[targetCurrency] ?? 1;
  const converted = amountKES * rate;
  const symbol = CURRENCY_SYMBOLS[targetCurrency] ?? targetCurrency;

  if (targetCurrency === 'USD' || targetCurrency === 'EUR') {
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${symbol} ${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

