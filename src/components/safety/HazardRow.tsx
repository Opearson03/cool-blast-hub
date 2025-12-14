import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Hazard {
  step_number: number;
  work_activity: string;
  hazard: string;
  potential_harm: string;
  likelihood: string;
  consequence: string;
  initial_risk_rating: string;
  elimination_controls: string;
  substitution_controls: string;
  engineering_controls: string;
  administrative_controls: string;
  ppe_required: string;
  residual_risk_rating: string;
  responsible_person: string;
}

interface HazardRowProps {
  hazard: Hazard;
  index: number;
  onChange: (index: number, field: keyof Hazard, value: string | number) => void;
  onDelete: (index: number) => void;
}

export function HazardRow({ hazard, index, onChange, onDelete }: HazardRowProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">Step {hazard.step_number}</h4>
        <Button variant="ghost" size="icon" onClick={() => onDelete(index)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor={`work_activity_${index}`}>Work Activity/Task Description</Label>
          <Textarea
            id={`work_activity_${index}`}
            value={hazard.work_activity}
            onChange={(e) => onChange(index, "work_activity", e.target.value)}
            placeholder="Describe the work activity or task being performed"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={`hazard_${index}`}>Hazard Identified</Label>
          <Textarea
            id={`hazard_${index}`}
            value={hazard.hazard}
            onChange={(e) => onChange(index, "hazard", e.target.value)}
            placeholder="What is the hazard?"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={`potential_harm_${index}`}>Potential Harm/Injury</Label>
          <Textarea
            id={`potential_harm_${index}`}
            value={hazard.potential_harm}
            onChange={(e) => onChange(index, "potential_harm", e.target.value)}
            placeholder="What injuries or harm could result?"
            className="mt-1"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h5 className="font-semibold mb-3">Control Measures (Hierarchy of Controls)</h5>
        <div className="space-y-3">
          <div>
            <Label htmlFor={`elimination_${index}`} className="text-green-600">
              1. Elimination (Remove the hazard)
            </Label>
            <Input
              id={`elimination_${index}`}
              value={hazard.elimination_controls}
              onChange={(e) => onChange(index, "elimination_controls", e.target.value)}
              placeholder="Can we eliminate the hazard entirely?"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`substitution_${index}`} className="text-blue-600">
              2. Substitution (Use something safer)
            </Label>
            <Input
              id={`substitution_${index}`}
              value={hazard.substitution_controls}
              onChange={(e) => onChange(index, "substitution_controls", e.target.value)}
              placeholder="Can we substitute with something less hazardous?"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`engineering_${index}`} className="text-purple-600">
              3. Engineering Controls (Physical barriers, guards)
            </Label>
            <Input
              id={`engineering_${index}`}
              value={hazard.engineering_controls}
              onChange={(e) => onChange(index, "engineering_controls", e.target.value)}
              placeholder="Guards, barriers, ventilation, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`administrative_${index}`} className="text-orange-600">
              4. Administrative Controls (Procedures, training, signage)
            </Label>
            <Input
              id={`administrative_${index}`}
              value={hazard.administrative_controls}
              onChange={(e) => onChange(index, "administrative_controls", e.target.value)}
              placeholder="Safe work procedures, permits, training, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`ppe_${index}`} className="text-red-600">
              5. PPE (Personal Protective Equipment)
            </Label>
            <Input
              id={`ppe_${index}`}
              value={hazard.ppe_required}
              onChange={(e) => onChange(index, "ppe_required", e.target.value)}
              placeholder="Hard hat, safety glasses, gloves, etc."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor={`responsible_${index}`}>Responsible Person</Label>
        <Input
          id={`responsible_${index}`}
          value={hazard.responsible_person}
          onChange={(e) => onChange(index, "responsible_person", e.target.value)}
          placeholder="Who is responsible for implementing controls?"
          className="mt-1"
        />
      </div>
    </Card>
  );
}
