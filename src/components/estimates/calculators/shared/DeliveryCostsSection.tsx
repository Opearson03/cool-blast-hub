import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Truck } from "lucide-react";

interface DeliveryCostsSectionProps {
  concreteDeliveryCost: string;
  onConcreteDeliveryChange: (value: string) => void;
  meshDeliveryCost?: string;
  onMeshDeliveryChange?: (value: string) => void;
  rebarDeliveryCost?: string;
  onRebarDeliveryChange?: (value: string) => void;
  otherDeliveryCost?: string;
  onOtherDeliveryChange?: (value: string) => void;
  showMesh?: boolean;
  showRebar?: boolean;
  showOther?: boolean;
}

export function DeliveryCostsSection({
  concreteDeliveryCost,
  onConcreteDeliveryChange,
  meshDeliveryCost = "",
  onMeshDeliveryChange,
  rebarDeliveryCost = "",
  onRebarDeliveryChange,
  otherDeliveryCost = "",
  onOtherDeliveryChange,
  showMesh = true,
  showRebar = false,
  showOther = false,
}: DeliveryCostsSectionProps) {
  return (
    <AccordionItem value="delivery" className="border rounded-lg">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <span className="font-medium">Delivery Costs</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Concrete Delivery ($)</Label>
            <Input
              type="number"
              value={concreteDeliveryCost}
              onChange={(e) => onConcreteDeliveryChange(e.target.value)}
              placeholder="0"
            />
          </div>
          
          {showMesh && onMeshDeliveryChange && (
            <div>
              <Label>Mesh Delivery ($)</Label>
              <Input
                type="number"
                value={meshDeliveryCost}
                onChange={(e) => onMeshDeliveryChange(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          
          {showRebar && onRebarDeliveryChange && (
            <div>
              <Label>Rebar Delivery ($)</Label>
              <Input
                type="number"
                value={rebarDeliveryCost}
                onChange={(e) => onRebarDeliveryChange(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          
          {showOther && onOtherDeliveryChange && (
            <div>
              <Label>Other Delivery ($)</Label>
              <Input
                type="number"
                value={otherDeliveryCost}
                onChange={(e) => onOtherDeliveryChange(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
