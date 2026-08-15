import { ITEM_CONDITIONS } from "@/constants/categories";
import { cn } from "@/lib/utils";

interface ConditionBadgeProps {
  condition: string;
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const config = ITEM_CONDITIONS.find((c) => c.value === condition);
  if (!config) return null;

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", config.color, className)}>
      {config.label}
    </span>
  );
}
