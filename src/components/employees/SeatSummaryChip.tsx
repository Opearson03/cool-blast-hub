import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

export function SeatSummaryChip() {
  const { data } = useQuery({
    queryKey: ["seat-preview"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("preview-seat-cost");
      if (error) return null;
      return data as {
        employeeCount: number;
        freeSeats: number;
        currentPaidSeats: number;
        currentMonthlyExtraCents: number;
        perSeatPriceCents: number;
        isExempt: boolean;
      };
    },
  });

  if (!data || data.isExempt) return null;

  const dollars = (c: number) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;
  const extra = data.currentPaidSeats > 0
    ? `${dollars(data.currentMonthlyExtraCents)}/mo extra`
    : "all free";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1.5 cursor-help">
            <Users className="w-3.5 h-3.5" />
            {data.employeeCount} {data.employeeCount === 1 ? "seat" : "seats"} · {extra}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          First {data.freeSeats} seats free. Each additional seat is{" "}
          {dollars(data.perSeatPriceCents)}/month, billed via your subscription.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
