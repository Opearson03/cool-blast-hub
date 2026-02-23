import { format } from "date-fns";
import { StarRating } from "./StarRating";
import type { SubcontractorReview } from "@/hooks/useSubcontractorReviews";

interface ReviewsListProps {
  reviews: SubcontractorReview[];
  emptyMessage?: string;
}

export function ReviewsList({ reviews, emptyMessage = "No reviews yet." }: ReviewsListProps) {
  if (!reviews.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-medium text-sm text-foreground">
                {review.reviewer_name || "Anonymous"}
              </p>
              {review.reviewer_business_name && (
                <p className="text-xs text-muted-foreground">{review.reviewer_business_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
