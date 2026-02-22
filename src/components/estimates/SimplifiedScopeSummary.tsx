import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/format-currency";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Ruler, Box, Droplets, Pencil, RotateCcw } from "lucide-react";

interface ScopeEntry {
  scopeAnswers?: Record<string, any>;
  moduleAnswers?: Record<string, Record<string, any>>;
  calculatedTotal?: number;
}

interface SimplifiedScopeSummaryProps {
  scopeId: string;
  scopeEntry: ScopeEntry;
  scopeLabel: string;
  onTotalChange?: (newTotal: number) => void;
  isOverridden?: boolean;
  originalTotal?: number;
  onReset?: () => void;
}

const formatScopeName = (scopeId: string): string => {
  return scopeId
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Extract key metrics from scope answers for display
 */
function extractKeyMetrics(scopeAnswers: Record<string, any> | undefined) {
  if (!scopeAnswers) return [];
  
  const metrics: { label: string; value: string; icon: React.ReactNode }[] = [];
  
  // Calculate total area from areas array
  if (scopeAnswers.areas && Array.isArray(scopeAnswers.areas)) {
    const totalArea = scopeAnswers.areas.reduce((sum: number, a: any) => {
      const areaValue = a._actualArea && a._actualArea > 0
        ? a._actualArea
        : (Number(a.length) || 0) * (Number(a.width) || 0);
      return sum + areaValue;
    }, 0);
    if (totalArea > 0) {
      metrics.push({
        label: "Area",
        value: `${totalArea.toFixed(1)} m²`,
        icon: <Ruler className="w-3 h-3" />,
      });
    }
  } else if (scopeAnswers.area && Number(scopeAnswers.area) > 0) {
    metrics.push({
      label: "Area",
      value: `${Number(scopeAnswers.area).toFixed(1)} m²`,
      icon: <Ruler className="w-3 h-3" />,
    });
  }
  
  // Pier count from pierGroups or piers array
  if (scopeAnswers.pierGroups && Array.isArray(scopeAnswers.pierGroups)) {
    const totalPiers = scopeAnswers.pierGroups.reduce((s: number, g: any) => s + (Number(g.quantity) || 1), 0);
    if (totalPiers > 0) {
      metrics.push({
        label: "Piers",
        value: `${totalPiers}`,
        icon: <Box className="w-3 h-3" />,
      });
    }
  } else if (scopeAnswers.piers && Array.isArray(scopeAnswers.piers)) {
    const totalPiers = scopeAnswers.piers.reduce((s: number, p: any) => s + (Number(p.quantity) || 0), 0);
    if (totalPiers > 0) {
      metrics.push({
        label: "Piers",
        value: `${totalPiers}`,
        icon: <Box className="w-3 h-3" />,
      });
    }
  }
  
  // Footing length from footings array
  if (scopeAnswers.footings && Array.isArray(scopeAnswers.footings)) {
    const totalLength = scopeAnswers.footings.reduce((s: number, f: any) => {
      const length = f._actualLength && f._actualLength > 0 ? f._actualLength : (Number(f.length) || 0);
      return s + length;
    }, 0);
    if (totalLength > 0) {
      metrics.push({
        label: "Length",
        value: `${totalLength.toFixed(1)} m`,
        icon: <Ruler className="w-3 h-3" />,
      });
    }
  }
  
  // Pad footings count
  if (scopeAnswers.pads && Array.isArray(scopeAnswers.pads)) {
    const totalPads = scopeAnswers.pads.reduce((s: number, p: any) => s + (Number(p.quantity) || 1), 0);
    if (totalPads > 0) {
      metrics.push({
        label: "Pads",
        value: `${totalPads}`,
        icon: <Box className="w-3 h-3" />,
      });
    }
  }
  
  // Pad footing groups count
  if (scopeAnswers.padFootingGroups && Array.isArray(scopeAnswers.padFootingGroups)) {
    const totalPads = scopeAnswers.padFootingGroups.reduce((s: number, g: any) => s + (Number(g.quantity) || 1), 0);
    if (totalPads > 0) {
      metrics.push({
        label: "Pads",
        value: `${totalPads}`,
        icon: <Box className="w-3 h-3" />,
      });
    }
  }
  
  // Bollards count
  if (scopeAnswers.num_bollards && Number(scopeAnswers.num_bollards) > 0) {
    metrics.push({
      label: "Bollards",
      value: `${scopeAnswers.num_bollards}`,
      icon: <Box className="w-3 h-3" />,
    });
  }
  
  // Waffle pod count
  if (scopeAnswers.pod_count && Number(scopeAnswers.pod_count) > 0) {
    metrics.push({
      label: "Pods",
      value: `${scopeAnswers.pod_count}`,
      icon: <Box className="w-3 h-3" />,
    });
  }
  
  // Linear sections (paths, crossovers)
  if (scopeAnswers.linearSections && Array.isArray(scopeAnswers.linearSections)) {
    const totalLength = scopeAnswers.linearSections.reduce((s: number, sec: any) => {
      const length = sec._actualLength && sec._actualLength > 0 ? sec._actualLength : (Number(sec.length) || 0);
      return s + length;
    }, 0);
    if (totalLength > 0) {
      metrics.push({
        label: "Length",
        value: `${totalLength.toFixed(1)} m`,
        icon: <Ruler className="w-3 h-3" />,
      });
    }
  }
  
  // Concrete volume if stored
  if (scopeAnswers.concrete_volume && Number(scopeAnswers.concrete_volume) > 0) {
    metrics.push({
      label: "Concrete",
      value: `${Number(scopeAnswers.concrete_volume).toFixed(2)} m³`,
      icon: <Droplets className="w-3 h-3" />,
    });
  }
  
  return metrics;
}

export function SimplifiedScopeSummary({ 
  scopeId, 
  scopeEntry, 
  scopeLabel,
  onTotalChange,
  isOverridden,
  originalTotal,
  onReset,
}: SimplifiedScopeSummaryProps) {
  const scopeTotal = scopeEntry.calculatedTotal || 0;
  const displayTotal = isOverridden && originalTotal !== undefined ? scopeTotal : scopeTotal;
  const metrics = extractKeyMetrics(scopeEntry.scopeAnswers);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!onTotalChange) return;
    setEditValue(String(scopeTotal));
    setIsEditing(true);
  };

  const handleCommit = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue >= 0 && onTotalChange) {
      onTotalChange(newValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCommit();
    if (e.key === "Escape") setIsEditing(false);
  };
  
  return (
    <div className="flex items-center justify-between bg-muted/50 hover:bg-muted/70 transition-colors px-4 py-3 rounded-lg">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">{scopeLabel || formatScopeName(scopeId)}</span>
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metrics.map((metric, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs font-normal gap-1 py-0.5"
              >
                {metric.icon}
                {metric.value}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="h-7 w-28 text-sm font-semibold font-mono text-right"
            min={0}
            step="0.01"
          />
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            disabled={!onTotalChange}
            className={`flex items-center gap-1.5 group ${onTotalChange ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span className={`text-sm font-semibold font-mono ${scopeTotal > 0 ? 'text-primary' : 'text-muted-foreground'} ${isOverridden ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {formatCurrency(scopeTotal)}
            </span>
            {onTotalChange && (
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        )}
        {isOverridden && originalTotal !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground line-through font-mono">
              {formatCurrency(originalTotal)}
            </span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                reset
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
