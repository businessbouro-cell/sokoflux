import { USD_TO_GNF_RATE, PLATFORM_COMMISSION_RATE, CUSTOMS_RATE } from "@/constants/currencies";

export function usdToGnf(usd: number): number {
  return Math.round(usd * USD_TO_GNF_RATE);
}

export function gnfToUsd(gnf: number): number {
  return gnf / USD_TO_GNF_RATE;
}

export function formatGNF(amount: number): string {
  return new Intl.NumberFormat("fr-GN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + " GNF";
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function calculateImportCost(params: {
  productPriceUSD: number;
  quantity: number;
  volumeM3: number;
  pricePerM3: number;
}): {
  productTotal: number;
  shippingFee: number;
  customsFee: number;
  platformFee: number;
  totalGNF: number;
} {
  const productTotalUSD = params.productPriceUSD * params.quantity;
  const shippingFeeUSD = params.volumeM3 * params.pricePerM3;
  const cifUSD = productTotalUSD + shippingFeeUSD;
  const customsFeeGNF = usdToGnf(cifUSD * CUSTOMS_RATE);
  const productTotalGNF = usdToGnf(productTotalUSD);
  const shippingFeeGNF = usdToGnf(shippingFeeUSD);
  const subtotalGNF = productTotalGNF + shippingFeeGNF + customsFeeGNF;
  const platformFeeGNF = Math.round(subtotalGNF * PLATFORM_COMMISSION_RATE);

  return {
    productTotal: productTotalGNF,
    shippingFee: shippingFeeGNF,
    customsFee: customsFeeGNF,
    platformFee: platformFeeGNF,
    totalGNF: subtotalGNF + platformFeeGNF,
  };
}
