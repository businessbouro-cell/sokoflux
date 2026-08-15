import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, maxStars = 5, size = 16, showValue = false, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: maxStars }, (_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;
          return (
            <Star
              key={i}
              size={size}
              className={cn(
                filled ? "fill-[#EF9F27] text-[#EF9F27]" : partial ? "fill-[#EF9F27]/50 text-[#EF9F27]" : "fill-none text-gray-300"
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
