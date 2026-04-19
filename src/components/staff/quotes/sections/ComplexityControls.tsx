import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComplexityControlsProps {
  complexityLevel: string;
  urgencyLevel: string;
  onComplexityChange: (v: string) => void;
  onUrgencyChange: (v: string) => void;
}

export function ComplexityControls({
  complexityLevel,
  urgencyLevel,
  onComplexityChange,
  onUrgencyChange,
}: ComplexityControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <Label>Complexity</Label>
        <Select value={complexityLevel} onValueChange={onComplexityChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low (×1.0)</SelectItem>
            <SelectItem value="medium">Medium (×1.25)</SelectItem>
            <SelectItem value="high">High (×1.5)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Urgency</Label>
        <Select value={urgencyLevel} onValueChange={onUrgencyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (×1.0)</SelectItem>
            <SelectItem value="fast_track">Fast-track (×1.2)</SelectItem>
            <SelectItem value="rush">Rush (×1.4)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
