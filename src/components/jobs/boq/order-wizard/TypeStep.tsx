import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderType } from "./types";

interface TypeStepProps {
  orderType: OrderType;
  onSelect: (type: OrderType) => void;
}

export function TypeStep({ orderType, onSelect }: TypeStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">What would you like to do?</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            orderType === "quote" && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => onSelect("quote")}
        >
          <CardContent className="p-6 text-center">
            <FileQuestion className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h4 className="font-semibold mb-1">Request Quote</h4>
            <p className="text-sm text-muted-foreground">
              Get pricing from one or more suppliers before ordering
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            orderType === "po" && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => onSelect("po")}
        >
          <CardContent className="p-6 text-center">
            <Send className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h4 className="font-semibold mb-1">Send Purchase Order</h4>
            <p className="text-sm text-muted-foreground">
              Order materials directly from a supplier
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
