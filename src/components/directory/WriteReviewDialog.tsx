import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { useSubmitReview, type SubcontractorReview } from "@/hooks/useSubcontractorReviews";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcontractorProfileId: string;
  existingReview?: SubcontractorReview | null;
}

export function WriteReviewDialog({
  open,
  onOpenChange,
  subcontractorProfileId,
  existingReview,
}: WriteReviewDialogProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const { toast } = useToast();
  const submitReview = useSubmitReview();

  useEffect(() => {
    if (open) {
      setRating(existingReview?.rating ?? 0);
      setComment(existingReview?.comment ?? "");
    }
  }, [open, existingReview]);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }

    // Get reviewer info
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles" as any)
      .select("full_name, business_id")
      .eq("id", session.user.id)
      .maybeSingle();

    let businessName: string | undefined;
    if ((profile as any)?.business_id) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", (profile as any).business_id)
        .maybeSingle();
      businessName = biz?.name ?? undefined;
    }

    submitReview.mutate(
      {
        subcontractor_profile_id: subcontractorProfileId,
        rating,
        comment: comment.trim() || undefined,
        reviewer_name: (profile as any)?.full_name ?? undefined,
        reviewer_business_name: businessName,
      },
      {
        onSuccess: () => {
          toast({ title: existingReview ? "Review updated" : "Review submitted" });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: "Failed to submit review", description: String(err), variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingReview ? "Edit Review" : "Write a Review"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              placeholder="Share your experience working with this subcontractor..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitReview.isPending || rating < 1}>
            {submitReview.isPending ? "Submitting..." : existingReview ? "Update" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
