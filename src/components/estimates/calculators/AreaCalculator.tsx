// Re-export the new VisualAreaBuilder as AreaCalculator for backwards compatibility
export { VisualAreaBuilder as AreaCalculator } from "./VisualAreaBuilder";
export type { VisualAreaBuilderProps as AreaCalculatorProps } from "./VisualAreaBuilder";
  }, [length, width, showCalculator, onChange]);

  // Reset calculator inputs when hiding
  const handleToggleCalculator = () => {
    if (showCalculator) {
      setLength("");
      setWidth("");
    }
    setShowCalculator(!showCalculator);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggleCalculator}
          className={cn(
            "h-7 px-2 text-xs gap-1",
            showCalculator && "text-primary"
          )}
        >
          {showCalculator ? (
            <>
              <X className="w-3 h-3" />
              Close
            </>
          ) : (
            <>
              <Calculator className="w-3 h-3" />
              Calculate
            </>
          )}
        </Button>
      </div>
      
      {showCalculator ? (
        <div className="space-y-3 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Length (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Width (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Calculated Area:</span>
            <span className="font-medium text-primary">
              {value ? `${parseFloat(value).toFixed(2)} m²` : "—"}
            </span>
          </div>
        </div>
      ) : (
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
