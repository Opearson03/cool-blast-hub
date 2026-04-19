import type { EnterpriseQuoteCalculation } from "@/hooks/useEnterpriseQuoteCalculation";

interface QuoteCalculationPanelProps {
  calc: EnterpriseQuoteCalculation;
  hasSelections: boolean;
}

export function QuoteCalculationPanel({ calc, hasSelections }: QuoteCalculationPanelProps) {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  if (!hasSelections) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Quote Summary</h3>
        <p className="text-sm text-muted-foreground">
          Select an Enterprise tier to start building your quote.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h3 className="text-lg font-semibold text-foreground">Quote Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Base tier</span>
          <span>
            {fmt(calc.baseSubtotalLow)}–{fmt(calc.baseSubtotalHigh)}
          </span>
        </div>
        {calc.modulesTotal > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Modules</span>
            <span>+{fmt(calc.modulesTotal)}</span>
          </div>
        )}
        {calc.integrationsTotal > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Integrations</span>
            <span>+{fmt(calc.integrationsTotal)}</span>
          </div>
        )}
        {(calc.complexityMultiplier !== 1 || calc.urgencyMultiplier !== 1) && (
          <div className="flex justify-between text-muted-foreground">
            <span>Multipliers</span>
            <span>×{(calc.complexityMultiplier * calc.urgencyMultiplier).toFixed(2)}</span>
          </div>
        )}
        {calc.strategicFeesTotal > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Strategic fees</span>
            <span>+{fmt(calc.strategicFeesTotal)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Estimate Range
          </p>
          <p className="text-xl font-bold text-foreground">
            {fmt(calc.estimateLow)} – {fmt(calc.estimateHigh)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Recommended Fixed Quote
          </p>
          <p className="text-3xl font-bold text-primary">{fmt(calc.recommendedQuote)}</p>
        </div>
        {calc.monthlySupport > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Monthly Support
            </p>
            <p className="text-lg font-semibold text-foreground">
              {fmt(calc.monthlySupport)}/mo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
