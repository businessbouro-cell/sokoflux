// Taux fixe en dev — remplacer par API en production
export const USD_TO_GNF_RATE = 8600;

export const CURRENCIES = {
  GNF: { code: "GNF", symbol: "GNF", name: "Franc Guinéen", decimals: 0 },
  USD: { code: "USD", symbol: "$", name: "Dollar américain", decimals: 2 },
} as const;

export const PLATFORM_COMMISSION_RATE = 0.02; // 2%
export const CUSTOMS_RATE = 0.15; // 15% CIF
