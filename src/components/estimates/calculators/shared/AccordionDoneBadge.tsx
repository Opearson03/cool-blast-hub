import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AccordionDoneBadge = () => (
  <Badge 
    variant="outline" 
    className="ml-auto mr-2 bg-green-50 text-green-700 border-green-200 text-xs dark:bg-green-950 dark:text-green-400 dark:border-green-800"
  >
    <Check className="w-3 h-3 mr-1" /> Done
  </Badge>
);
