import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep, OrderType } from "./types";

interface StepIndicatorProps {
  currentStep: WizardStep;
  orderType: OrderType;
  completedSteps: WizardStep[];
}

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "items", label: "Items" },
  { key: "supplier", label: "Supplier" },
  { key: "delivery", label: "Delivery" },
  { key: "review", label: "Review" },
];

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.key);
        const isCurrent = currentStep === step.key;
        const isPast = index < currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary text-primary-foreground",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 hidden sm:block",
                (isCurrent || isCompleted) ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                isPast || isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
