import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DraftProgressTrackerProps {
  estimate: {
    estimate_type: string | null;
    client_name: string | null;
    site_address: string | null;
    selected_scopes: string[] | null;
    scope_data: Record<string, unknown> | null;
    total_amount: number | null;
  };
  variant?: "compact" | "detailed";
}

interface Step {
  key: string;
  label: string;
  shortLabel: string;
  isComplete: boolean;
}

export function calculateDraftProgress(estimate: DraftProgressTrackerProps["estimate"]): {
  steps: Step[];
  completedCount: number;
  totalSteps: number;
  percentage: number;
  currentStep: string;
  currentStepShort: string;
} {
  const steps: Step[] = [
    {
      key: "type",
      label: "Project Type",
      shortLabel: "Type",
      isComplete: !!estimate.estimate_type,
    },
    {
      key: "client",
      label: "Client Details",
      shortLabel: "Client",
      isComplete: !!estimate.client_name && !!estimate.site_address,
    },
    {
      key: "scopes",
      label: "Scopes Selected",
      shortLabel: "Scopes",
      isComplete: Array.isArray(estimate.selected_scopes) && estimate.selected_scopes.length > 0,
    },
    {
      key: "configure",
      label: "Scopes Configured",
      shortLabel: "Config",
      isComplete: (() => {
        if (!estimate.selected_scopes || !Array.isArray(estimate.selected_scopes) || estimate.selected_scopes.length === 0) {
          return false;
        }
        if (!estimate.scope_data || typeof estimate.scope_data !== "object") {
          return false;
        }
        // Check if all selected scopes have data with at least some module answers
        return estimate.selected_scopes.every((scopeId) => {
          const scopeState = estimate.scope_data?.[scopeId];
          if (!scopeState || typeof scopeState !== "object") return false;
          const state = scopeState as Record<string, unknown>;
          // Check if moduleAnswers exists and has at least one entry
          const moduleAnswers = state.moduleAnswers;
          if (!moduleAnswers || typeof moduleAnswers !== "object") return false;
          return Object.keys(moduleAnswers).length > 0;
        });
      })(),
    },
    {
      key: "margin",
      label: "Margin Set",
      shortLabel: "Margin",
      isComplete: (() => {
        if (!estimate.scope_data) return false;
        // Margin is complete if _globalMargin is set
        const scopeData = estimate.scope_data as Record<string, unknown>;
        return scopeData._globalMargin !== undefined && scopeData._globalMargin !== null;
      })(),
    },
    {
      key: "inclusions",
      label: "Inclusions Reviewed",
      shortLabel: "Inclusions",
      isComplete: (() => {
        // Inclusions are reviewed if scope_data includes visited inclusions step
        // For now, consider complete if configure is complete and there's a total > 0
        if (!estimate.selected_scopes || estimate.selected_scopes.length === 0) return false;
        if (!estimate.scope_data) return false;
        // Check if any scope has doneModules indicating completion
        const hasDoneModules = Object.values(estimate.scope_data).some((scopeState) => {
          if (typeof scopeState !== "object" || !scopeState) return false;
          const state = scopeState as Record<string, unknown>;
          const doneModules = state.doneModules;
          return Array.isArray(doneModules) && doneModules.length > 0;
        });
        return hasDoneModules && (estimate.total_amount || 0) > 0;
      })(),
    },
    {
      key: "summary",
      label: "Summary Complete",
      shortLabel: "Summary",
      isComplete: (estimate.total_amount || 0) > 0 && (() => {
        // Summary is complete when all previous steps are done
        if (!estimate.selected_scopes || estimate.selected_scopes.length === 0) return false;
        if (!estimate.scope_data) return false;
        // All scopes should have done modules
        return estimate.selected_scopes.every((scopeId) => {
          const scopeState = estimate.scope_data?.[scopeId];
          if (!scopeState || typeof scopeState !== "object") return false;
          const state = scopeState as Record<string, unknown>;
          const doneModules = state.doneModules;
          return Array.isArray(doneModules) && doneModules.length > 0;
        });
      })(),
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  
  // Find the first incomplete step
  const incompleteStep = steps.find((s) => !s.isComplete);
  const currentStep = incompleteStep?.label || "Complete";
  const currentStepShort = incompleteStep?.shortLabel || "Done";

  return { steps, completedCount, totalSteps, percentage, currentStep, currentStepShort };
}

export function DraftProgressTracker({ estimate, variant = "compact" }: DraftProgressTrackerProps) {
  const { steps, completedCount, totalSteps, percentage, currentStepShort } = calculateDraftProgress(estimate);

  if (variant === "compact") {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs gap-2">
          <span className="text-muted-foreground whitespace-nowrap">
            {completedCount}/{totalSteps}
          </span>
          <span className="font-medium text-primary">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-1.5" />
        <p className="text-xs text-muted-foreground truncate">
          Next: <span className="text-foreground">{currentStepShort}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Progress: {completedCount}/{totalSteps}
        </span>
        <span className="text-sm font-semibold text-primary">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              step.isComplete ? "text-primary" : "text-muted-foreground"
            )}
          >
            {step.isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{step.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
