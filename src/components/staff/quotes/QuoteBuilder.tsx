import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useEnterpriseQuotePricing,
  type PricingTier,
} from "@/hooks/useEnterpriseQuotePricing";
import {
  useEnterpriseQuoteCalculation,
  type SelectedIntegration,
  type SelectedStrategicFee,
  type EnterpriseQuoteSelections,
} from "@/hooks/useEnterpriseQuoteCalculation";
import { ClientDetailsSection } from "./sections/ClientDetailsSection";
import { TierSelector } from "./sections/TierSelector";
import { ModuleSelector } from "./sections/ModuleSelector";
import { IntegrationSelector } from "./sections/IntegrationSelector";
import { ComplexityControls } from "./sections/ComplexityControls";
import { StrategicFeesSelector } from "./sections/StrategicFeesSelector";
import { SupportPlanSelector } from "./sections/SupportPlanSelector";
import { QuoteCalculationPanel } from "./QuoteCalculationPanel";

export function QuoteBuilder() {
  const navigate = useNavigate();
  const { data: pricing, isLoading: pricingLoading } = useEnterpriseQuotePricing();

  // Client details
  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [crewCount, setCrewCount] = useState("");
  const [concurrentJobs, setConcurrentJobs] = useState("");
  const [region, setRegion] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Selections
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [selectedModuleKeys, setSelectedModuleKeys] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<SelectedIntegration[]>([]);
  const [complexityLevel, setComplexityLevel] = useState("low");
  const [urgencyLevel, setUrgencyLevel] = useState("standard");
  const [selectedStrategicFees, setSelectedStrategicFees] = useState<SelectedStrategicFee[]>(
    [],
  );
  const [selectedSupportKey, setSelectedSupportKey] = useState<string | null>(null);

  // Internal
  const [confidenceRating, setConfidenceRating] = useState("medium");
  const [profitMargin, setProfitMargin] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["enterprise-quote-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_quote_templates")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const selections: EnterpriseQuoteSelections = {
    selectedTier,
    selectedModuleKeys,
    selectedIntegrations,
    complexityLevel,
    urgencyLevel,
    selectedStrategicFees,
    selectedSupportKey,
  };

  const calc = useEnterpriseQuoteCalculation(
    selections,
    pricing?.modules || [],
    pricing?.integrations || [],
    pricing?.support_plans || [],
    pricing?.complexity_multipliers || {},
    pricing?.urgency_multipliers || {},
  );

  const toggleModule = useCallback((key: string) => {
    setSelectedModuleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const toggleIntegration = useCallback((key: string) => {
    setSelectedIntegrations((prev) =>
      prev.some((s) => s.key === key)
        ? prev.filter((s) => s.key !== key)
        : [...prev, { key, complexity: "simple" }],
    );
  }, []);

  const changeIntegrationComplexity = useCallback(
    (key: string, complexity: "simple" | "moderate" | "advanced") => {
      setSelectedIntegrations((prev) =>
        prev.map((s) => (s.key === key ? { ...s, complexity } : s)),
      );
    },
    [],
  );

  const toggleStrategicFee = useCallback((fee: { key: string; price: number }) => {
    setSelectedStrategicFees((prev) =>
      prev.some((s) => s.key === fee.key)
        ? prev.filter((s) => s.key !== fee.key)
        : [...prev, { key: fee.key, price: fee.price }],
    );
  }, []);

  const applyTemplate = (templateId: string) => {
    const t = templates.find((tp) => tp.id === templateId);
    if (!t || !pricing) return;
    const tier = pricing.tiers.find((ti) => ti.key === t.tier_key);
    if (tier) setSelectedTier(tier);
    setSelectedModuleKeys((t.modules as unknown as string[]) || []);
    setSelectedIntegrations((t.integrations as unknown as SelectedIntegration[]) || []);
    if (t.support_key) setSelectedSupportKey(t.support_key);
    toast.success(`Applied template: ${t.name}`);
  };

  const saveMutation = useMutation({
    mutationFn: async (status: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const quoteNumber = `EQ-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase
        .from("enterprise_quotes")
        .insert({
          quote_number: quoteNumber,
          client_name: clientName,
          business_name: businessName || null,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          team_size: teamSize ? Number(teamSize) : null,
          crew_count: crewCount ? Number(crewCount) : null,
          concurrent_jobs: concurrentJobs ? Number(concurrentJobs) : null,
          region: region || null,
          meeting_notes: meetingNotes || null,
          selected_tier: selectedTier as never,
          selected_modules: selectedModuleKeys as never,
          selected_integrations: selectedIntegrations as never,
          complexity_settings: {
            complexity: complexityLevel,
            urgency: urgencyLevel,
          } as never,
          strategic_fees: selectedStrategicFees as never,
          selected_support: selectedSupportKey
            ? ({ key: selectedSupportKey } as never)
            : null,
          base_subtotal_low: calc.baseSubtotalLow,
          base_subtotal_high: calc.baseSubtotalHigh,
          modules_subtotal: calc.modulesTotal,
          integrations_subtotal: calc.integrationsTotal,
          strategic_fees_total: calc.strategicFeesTotal,
          complexity_multiplier: calc.complexityMultiplier,
          urgency_multiplier: calc.urgencyMultiplier,
          estimate_low: calc.estimateLow,
          estimate_high: calc.estimateHigh,
          recommended_quote: calc.recommendedQuote,
          monthly_support: calc.monthlySupport,
          profit_margin_pct: profitMargin ? Number(profitMargin) : null,
          estimated_hours: estimatedHours ? Number(estimatedHours) : null,
          confidence_rating: confidenceRating,
          internal_notes: internalNotes || null,
          status,
          created_by: session.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Quote saved");
      navigate(`/staff/quotes/${data.id}`);
    },
    onError: (err: Error) => {
      toast.error("Error saving quote", { description: err.message });
    },
  });

  if (pricingLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pricing) {
    return (
      <p className="p-8 text-destructive">
        No pricing configuration found. Please seed pricing first.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Form */}
      <div className="lg:col-span-2 space-y-4">
        {templates.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Start — Apply Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(t.id)}
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">A — Client details</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientDetailsSection
              clientName={clientName}
              setClientName={setClientName}
              businessName={businessName}
              setBusinessName={setBusinessName}
              clientEmail={clientEmail}
              setClientEmail={setClientEmail}
              clientPhone={clientPhone}
              setClientPhone={setClientPhone}
              teamSize={teamSize}
              setTeamSize={setTeamSize}
              crewCount={crewCount}
              setCrewCount={setCrewCount}
              concurrentJobs={concurrentJobs}
              setConcurrentJobs={setConcurrentJobs}
              region={region}
              setRegion={setRegion}
              meetingNotes={meetingNotes}
              setMeetingNotes={setMeetingNotes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">B — Base platform tier</CardTitle>
          </CardHeader>
          <CardContent>
            <TierSelector
              tiers={pricing.tiers}
              selectedTier={selectedTier}
              onSelect={setSelectedTier}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">C — Module add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleSelector
              modules={pricing.modules}
              selectedKeys={selectedModuleKeys}
              onToggle={toggleModule}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">D — Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <IntegrationSelector
              integrations={pricing.integrations}
              selected={selectedIntegrations}
              onToggle={toggleIntegration}
              onComplexityChange={changeIntegrationComplexity}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">E — Complexity & urgency</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplexityControls
              complexityLevel={complexityLevel}
              urgencyLevel={urgencyLevel}
              onComplexityChange={setComplexityLevel}
              onUrgencyChange={setUrgencyLevel}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">F — Strategic / one-off fees</CardTitle>
          </CardHeader>
          <CardContent>
            <StrategicFeesSelector
              fees={pricing.strategic_fees}
              selected={selectedStrategicFees}
              onToggle={toggleStrategicFee}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">G — Ongoing monthly support</CardTitle>
          </CardHeader>
          <CardContent>
            <SupportPlanSelector
              plans={pricing.support_plans}
              selectedKey={selectedSupportKey}
              onSelect={setSelectedSupportKey}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">H — Internal notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Profit margin %</Label>
                <Input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div>
                <Label>Est. dev hours</Label>
                <Input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="120"
                />
              </div>
              <div>
                <Label>Confidence</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ].map((opt) => {
                    const selected = confidenceRating === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setConfidenceRating(opt.value)}
                        className={cn(
                          "h-9 px-3 text-xs font-medium rounded-md border transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-foreground hover:bg-muted",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <Label>Internal notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                placeholder="Notes for the team..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 pb-32 lg:pb-8">
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate("draft")}
            disabled={!clientName || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as draft
          </Button>
          <Button
            onClick={() => saveMutation.mutate("saved")}
            disabled={!clientName || saveMutation.isPending}
          >
            Save & view summary
          </Button>
          <Button variant="ghost" disabled>
            Export PDF (coming soon)
          </Button>
        </div>
      </div>

      {/* Right: Sticky Calculation Panel */}
      <div className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <QuoteCalculationPanel calc={calc} hasSelections={!!selectedTier} />
          {pricing.default_assumptions && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Assumptions
              </p>
              <p className="text-xs text-muted-foreground">{pricing.default_assumptions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Calculation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Recommended Quote</p>
            <p className="text-xl font-bold text-primary">
              ${Math.round(calc.recommendedQuote).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Range</p>
            <p className="text-sm text-foreground">
              ${Math.round(calc.estimateLow).toLocaleString()} – $
              {Math.round(calc.estimateHigh).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
