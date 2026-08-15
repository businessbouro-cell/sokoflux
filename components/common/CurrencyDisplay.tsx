import { formatGNF, formatUSD } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  currency?: "GNF" | "USD";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CurrencyDisplay({
  amount,
  currency = "GNF",
  className,
  size = "md",
}: CurrencyDisplayProps) {
  const formatted = currency === "GNF" ? formatGNF(amount) : formatUSD(amount);

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl",
        className
      )}
    >
      {formatted}
    </span>
  );
}
