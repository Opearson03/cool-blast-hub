import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const HIGH_RISK_CATEGORIES = [
  { value: "working_at_heights", label: "Working at Heights (>2m risk of falling)" },
  { value: "excavation", label: "Excavation/Trenching Work" },
  { value: "demolition", label: "Demolition Work" },
  { value: "scaffolding", label: "Scaffolding Work (>4m)" },
  { value: "confined_space", label: "Confined Space Entry" },
  { value: "hazardous_substances", label: "Work Involving Hazardous Substances" },
  { value: "electrical", label: "Electrical Work Near Energized Equipment" },
  { value: "asbestos", label: "Asbestos Removal/Disturbance" },
  { value: "structural_alterations", label: "Structural Alterations Requiring Temporary Support" },
  { value: "tilt_up", label: "Tilt-up/Precast Concrete Work" },
  { value: "traffic", label: "Work Near Traffic/Moving Plant" },
  { value: "water", label: "Work In or Near Water" },
  { value: "diving", label: "Diving Work" },
  { value: "powered_mobile_plant", label: "Powered Mobile Plant" },
  { value: "suspended_loads", label: "Work Under Suspended Loads" },
  { value: "artificial_structures", label: "Erection/Demolition of Artificial Structures" },
  { value: "hot_work", label: "Hot Work (Welding, Cutting, Grinding)" },
  { value: "load_shifting", label: "Load Shifting Equipment" },
  { value: "pressure_equipment", label: "Pressure Equipment" },
];

interface HighRiskWorkSelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function HighRiskWorkSelector({ selectedCategories, onChange }: HighRiskWorkSelectorProps) {
  const handleToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter((c) => c !== category));
    } else {
      onChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">High-Risk Construction Work (HRCW)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select all categories that apply to this work (NSW WHS Regulation 2017)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HIGH_RISK_CATEGORIES.map((category) => (
          <div key={category.value} className="flex items-center space-x-2">
            <Checkbox
              id={category.value}
              checked={selectedCategories.includes(category.value)}
              onCheckedChange={() => handleToggle(category.value)}
            />
            <Label
              htmlFor={category.value}
              className="text-sm font-normal cursor-pointer leading-tight"
            >
              {category.label}
            </Label>
          </div>
        ))}
      </div>

      {selectedCategories.length > 0 && (
        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            ⚠️ High-Risk Work Identified ({selectedCategories.length} categories selected)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            A comprehensive SWMS is required before work commences. Workers must be inducted and sign
            the SWMS.
          </p>
        </div>
      )}
    </div>
  );
}
