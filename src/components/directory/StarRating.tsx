import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              filled
                ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                : "text-muted-foreground/30",
              interactive && "cursor-pointer hover:text-[hsl(var(--warning))] transition-colors"
            )}
            onClick={() => interactive && onRatingChange?.(i + 1)}
          />
        );
      })}
    </div>
  );
}
