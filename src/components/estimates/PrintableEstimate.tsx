import { forwardRef } from "react";
import { format } from "date-fns";
import { extractQuotePDFData, hasDetailedData, type QuotePDFData } from "@/lib/quote-pdf-data";

interface EstimateLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface BrandingSettings {
  quote_template?: string;
  quote_primary_color?: string;
  quote_secondary_color?: string;
  quote_font?: string;
}

interface PrintableEstimateProps {
  estimate: {
    estimate_number: string;
    client_name: string;
    company_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    site_address: string;
    description: string | null;
    total_amount: number;
    valid_until: string | null;
    notes: string | null;
    created_at: string;
  };
  business: {
    name: string;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    abn: string | null;
  } & BrandingSettings | null;
  lineItems?: EstimateLineItem[];
  scopeData?: Record<string, any> | null;
  selectedScopes?: string[] | null;
}

// Project Summary Component
const ProjectSummarySection = ({ 
  data, 
  primaryColor, 
  secondaryColor,
  template 
}: { 
  data: QuotePDFData; 
  primaryColor: string; 
  secondaryColor: string;
  template: string;
}) => {
  const { projectSummary, reinforcement } = data;
  
  if (!hasDetailedData(data)) return null;

  const summaryItems = [
    projectSummary.totalVolume > 0 && {
      label: 'Concrete Volume',
      value: `${projectSummary.totalVolume.toFixed(2)} m³`,
      sub: projectSummary.concreteStrength || undefined,
    },
    projectSummary.totalArea > 0 && {
      label: 'Total Area',
      value: `${projectSummary.totalArea.toFixed(1)} m²`,
    },
    projectSummary.thickness > 0 && {
      label: 'Thickness',
      value: `${projectSummary.thickness} mm`,
    },
    reinforcement && {
      label: 'Reinforcement',
      value: reinforcement.meshType,
      sub: reinforcement.meshSheets > 0 ? `${reinforcement.meshSheets} sheets` : undefined,
    },
    projectSummary.perimeter > 0 && {
      label: 'Perimeter',
      value: `${projectSummary.perimeter.toFixed(1)} m`,
    },
  ].filter(Boolean) as Array<{ label: string; value: string; sub?: string }>;

  if (summaryItems.length === 0) return null;

  if (template === 'modern') {
    return (
      <div className="page-break-avoid mb-6">
        <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>Project Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryItems.map((item, index) => (
            <div 
              key={index} 
              className="p-3 rounded-lg"
              style={{ backgroundColor: "#f9fafb", borderLeft: `3px solid ${primaryColor}` }}
            >
              <p className="text-xs text-gray-500 uppercase">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
              {item.sub && <p className="text-xs text-gray-600">{item.sub}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    return (
      <div className="page-break-avoid mb-10">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Project Details</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {summaryItems.map((item, index) => (
            <div key={index} className="text-sm">
              <span className="text-gray-500">{item.label}: </span>
              <span className="font-medium text-gray-900">{item.value}</span>
              {item.sub && <span className="text-gray-500"> ({item.sub})</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Classic template
  return (
    <div className="page-break-avoid mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Project Summary</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.map((item, index) => (
            <div key={index}>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-base font-semibold text-gray-900">{item.value}</p>
              {item.sub && <p className="text-xs text-gray-600">{item.sub}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Scope Breakdown Component
const ScopeBreakdownSection = ({ 
  data, 
  primaryColor, 
  secondaryColor,
  template,
  formatCurrency 
}: { 
  data: QuotePDFData; 
  primaryColor: string; 
  secondaryColor: string;
  template: string;
  formatCurrency: (amount: number) => string;
}) => {
  const { scopeBreakdowns } = data;
  
  if (scopeBreakdowns.length <= 1) return null;

  if (template === 'minimal') {
    return (
      <div className="page-break-avoid mb-10">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Scope Breakdown</p>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${secondaryColor}` }}>
              <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-400 font-normal">Scope</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-24">Volume</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-24">Area</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-32">Details</th>
            </tr>
          </thead>
          <tbody>
            {scopeBreakdowns.map((scope, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td className="py-3 text-sm text-gray-700">{scope.scopeName}</td>
                <td className="py-3 text-sm text-right text-gray-600">{scope.volume.toFixed(2)} m³</td>
                <td className="py-3 text-sm text-right text-gray-600">{scope.area ? `${scope.area.toFixed(1)} m²` : '—'}</td>
                <td className="py-3 text-sm text-right text-gray-500">{scope.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Modern and Classic templates
  return (
    <div className="page-break-avoid mb-6">
      <h3 className={`text-sm font-${template === 'modern' ? 'bold' : 'semibold'} uppercase mb-2`} 
          style={{ color: template === 'modern' ? secondaryColor : '#6b7280' }}>
        Scope Breakdown
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
            <th className="text-left py-2 px-3 text-sm font-semibold">Scope</th>
            <th className="text-right py-2 px-3 text-sm font-semibold w-24">Volume</th>
            <th className="text-right py-2 px-3 text-sm font-semibold w-24">Area</th>
            <th className="text-right py-2 px-3 text-sm font-semibold w-32">Details</th>
          </tr>
        </thead>
        <tbody>
          {scopeBreakdowns.map((scope, index) => (
            <tr key={index} className="border-b border-gray-200" style={{ backgroundColor: index % 2 === 0 ? "#f9fafb" : "white" }}>
              <td className="py-2 px-3 text-sm font-medium">{scope.scopeName}</td>
              <td className="py-2 px-3 text-sm text-right">{scope.volume.toFixed(2)} m³</td>
              <td className="py-2 px-3 text-sm text-right">{scope.area ? `${scope.area.toFixed(1)} m²` : '—'}</td>
              <td className="py-2 px-3 text-sm text-right text-gray-500">{scope.details || '—'}</td>
            </tr>
          ))}
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <td className="py-2 px-3 text-sm">Total</td>
            <td className="py-2 px-3 text-sm text-right">{scopeBreakdowns.reduce((sum, s) => sum + s.volume, 0).toFixed(2)} m³</td>
            <td className="py-2 px-3 text-sm text-right">{scopeBreakdowns.reduce((sum, s) => sum + (s.area || 0), 0).toFixed(1)} m²</td>
            <td className="py-2 px-3 text-sm text-right"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Exclusions Component
const ExclusionsSection = ({ 
  exclusions, 
  primaryColor, 
  secondaryColor,
  template 
}: { 
  exclusions: string[]; 
  primaryColor: string; 
  secondaryColor: string;
  template: string;
}) => {
  if (exclusions.length === 0) return null;

  if (template === 'minimal') {
    return (
      <div className="page-break-avoid mb-8">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Exclusions</p>
        <div className="text-xs text-gray-500 space-y-1">
          {exclusions.map((exc, index) => (
            <p key={index} className="flex items-start gap-2">
              <span className="text-gray-400">×</span>
              <span>{exc}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (template === 'modern') {
    return (
      <div className="page-break-avoid mb-6">
        <h3 className="text-sm font-bold uppercase mb-2" style={{ color: secondaryColor }}>Exclusions</h3>
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs text-red-800 mb-2">The following items are NOT included in this quote:</p>
          <ul className="space-y-1">
            {exclusions.map((exc, index) => (
              <li key={index} className="text-xs text-red-700 flex items-start gap-2">
                <span className="text-red-400">✕</span>
                <span>{exc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Classic template
  return (
    <div className="page-break-avoid mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Exclusions</h3>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-xs text-orange-800 mb-2">The following items are NOT included in this quote:</p>
        <ul className="space-y-1">
          {exclusions.map((exc, index) => (
            <li key={index} className="text-xs text-orange-700 flex items-start gap-2">
              <span style={{ color: primaryColor }}>✕</span>
              <span>{exc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const PrintableEstimate = forwardRef<HTMLDivElement, PrintableEstimateProps>(
  ({ estimate, business, lineItems = [], scopeData = null, selectedScopes = null }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Get branding settings with defaults
    const template = business?.quote_template || "classic";
    const primaryColor = business?.quote_primary_color || "#f97316";
    const secondaryColor = business?.quote_secondary_color || "#1f2937";
    const fontFamily = business?.quote_font || "Arial";

    // Extract rich data from scope_data
    const quotePDFData = extractQuotePDFData(scopeData, selectedScopes, estimate.description);

    // Parse description to extract calculated items if no line items provided
    const parsedItems: EstimateLineItem[] = lineItems.length > 0 ? lineItems : [];
    
    // If no line items, try to show description-based summary
    const descriptionParts = estimate.description?.split(" | ") || [];

    // Render template based on selection
    if (template === "modern") {
      return (
        <div
          ref={ref}
          className="print-container"
          style={{ 
            fontFamily: `${fontFamily}, sans-serif`,
            backgroundColor: "white",
            color: "black"
          }}
        >
          <style>{`
            @media screen {
              .print-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 20px;
                background: white !important;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }
            .page-break-avoid {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          `}</style>

          {/* Modern Template - Bold header bar */}
          <div className="page-break-avoid" style={{ backgroundColor: secondaryColor, padding: "24px", marginBottom: "24px" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {business?.logo_url && (
                  <img
                    src={business.logo_url}
                    alt="Company logo"
                    style={{ height: "60px", width: "60px", objectFit: "contain", backgroundColor: "white", borderRadius: "8px", padding: "4px" }}
                  />
                )}
                <div style={{ color: "white" }}>
                  <h1 className="text-2xl font-bold">{business?.name || "Company Name"}</h1>
                  {business?.abn && <p className="text-sm opacity-80">ABN: {business.abn}</p>}
                </div>
              </div>
              <div style={{ color: "white", textAlign: "right" }}>
                <h2 className="text-3xl font-black tracking-tight">QUOTE</h2>
                <p className="text-lg font-bold mt-1" style={{ color: primaryColor }}>{estimate.estimate_number}</p>
              </div>
            </div>
          </div>

          {/* Contact strip */}
          <div className="page-break-avoid flex justify-between mb-6 text-sm" style={{ borderBottom: `3px solid ${primaryColor}`, paddingBottom: "12px" }}>
            <div className="flex gap-6">
              {business?.phone && <span>📞 {business.phone}</span>}
              {business?.email && <span>✉️ {business.email}</span>}
            </div>
            <div className="text-gray-600">
              Date: {format(new Date(estimate.created_at), "d MMMM yyyy")}
              {estimate.valid_until && ` • Valid until: ${format(new Date(estimate.valid_until), "d MMMM yyyy")}`}
            </div>
          </div>

          {/* Two column client/site */}
          <div className="page-break-avoid grid grid-cols-2 gap-8 mb-6">
            <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", borderLeft: `4px solid ${primaryColor}` }}>
              <h3 className="text-xs font-bold uppercase mb-2" style={{ color: primaryColor }}>Client</h3>
              <p className="font-bold text-lg text-gray-900">{estimate.client_name}</p>
              {estimate.company_name && <p className="text-sm text-gray-700">{estimate.company_name}</p>}
              {estimate.client_email && <p className="text-sm text-gray-600">{estimate.client_email}</p>}
              {estimate.client_phone && <p className="text-sm text-gray-600">{estimate.client_phone}</p>}
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", borderLeft: `4px solid ${secondaryColor}` }}>
              <h3 className="text-xs font-bold uppercase mb-2" style={{ color: secondaryColor }}>Site Location</h3>
              <p className="text-gray-900">{estimate.site_address}</p>
            </div>
          </div>

          {/* Project Summary */}
          <ProjectSummarySection 
            data={quotePDFData} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="modern"
          />

          {/* Scope Breakdown */}
          <ScopeBreakdownSection 
            data={quotePDFData} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="modern"
            formatCurrency={formatCurrency}
          />

          {/* Scope */}
          {descriptionParts.length > 0 && (
            <div className="page-break-avoid mb-6">
              <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>Scope of Works</h3>
              <div className="grid grid-cols-2 gap-2">
                {descriptionParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    <span style={{ color: primaryColor }}>✓</span>
                    <span>{part}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Items */}
          {parsedItems.length > 0 && (
            <div className="page-break-avoid mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
                    <th className="text-left py-3 px-4 text-sm font-bold">Description</th>
                    <th className="text-right py-3 px-4 text-sm font-bold w-20">Qty</th>
                    <th className="text-center py-3 px-4 text-sm font-bold w-16">Unit</th>
                    <th className="text-right py-3 px-4 text-sm font-bold w-24">Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-bold w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200" style={{ backgroundColor: index % 2 === 0 ? "#f9fafb" : "white" }}>
                      <td className="py-3 px-4 text-sm">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-center">{item.unit}</td>
                      <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total - Modern style */}
          <div className="page-break-avoid flex justify-end mb-8">
            <div className="w-80" style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal (ex GST)</span>
                <span className="text-base font-medium text-gray-700">
                  {formatCurrency(estimate.total_amount / 1.1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">GST (10%)</span>
                <span className="text-base font-medium text-gray-700">
                  {formatCurrency(estimate.total_amount - (estimate.total_amount / 1.1))}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3" style={{ borderTop: `2px solid ${primaryColor}` }}>
                <span className="text-lg font-bold text-gray-900">Total (inc GST)</span>
                <span className="text-2xl font-black" style={{ color: primaryColor }}>
                  {formatCurrency(estimate.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Exclusions */}
          <ExclusionsSection 
            exclusions={quotePDFData.exclusions} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="modern"
          />

          {/* Terms */}
          <div className="page-break-avoid border-t-2 border-gray-200 pt-4 mb-6">
            <h3 className="text-sm font-bold uppercase mb-2" style={{ color: secondaryColor }}>Terms & Conditions</h3>
            <div className="text-xs text-gray-600 space-y-1">
              {estimate.notes ? (
                <p className="whitespace-pre-wrap">{estimate.notes}</p>
              ) : (
                <>
                  <p>• This quote is valid for 14 days from the date of issue unless otherwise specified.</p>
                  <p>• A 50% deposit is required before commencement of works.</p>
                  <p>• Final payment is due upon completion of works.</p>
                  <p>• Prices include GST unless otherwise stated.</p>
                  <p>• Any variations to the scope of works may result in additional charges.</p>
                </>
              )}
            </div>
          </div>

          {/* Acceptance */}
          <div className="page-break-avoid p-4 mb-6" style={{ backgroundColor: "#f9fafb", borderRadius: "8px", border: `2px solid ${primaryColor}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: secondaryColor }}>Acceptance</h3>
            <p className="text-xs text-gray-600 mb-4">
              I accept this quote and authorize the commencement of works as described above.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Signature</p>
                <div className="border-b-2 border-gray-400 h-8"></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Print Name</p>
                <div className="border-b-2 border-gray-400 h-8"></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <div className="border-b-2 border-gray-400 h-8"></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="page-break-avoid text-center pt-4">
            <p className="text-xs text-gray-500">
              Thank you for considering {business?.name || "us"} for your project.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Generated by PourHub • {format(new Date(), "d MMM yyyy")}
            </p>
          </div>
        </div>
      );
    }

    if (template === "minimal") {
      return (
        <div
          ref={ref}
          className="print-container"
          style={{ 
            fontFamily: `${fontFamily}, sans-serif`,
            backgroundColor: "white",
            color: "black"
          }}
        >
          <style>{`
            @media screen {
              .print-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 40px;
                background: white !important;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }
            .page-break-avoid {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          `}</style>

          {/* Minimal Template - Clean & Simple */}
          <div className="page-break-avoid flex items-start justify-between mb-12">
            <div>
              {business?.logo_url && (
                <img
                  src={business.logo_url}
                  alt="Company logo"
                  style={{ height: "48px", objectFit: "contain", marginBottom: "8px" }}
                />
              )}
              <h1 className="text-lg font-semibold text-gray-900">{business?.name || "Company Name"}</h1>
              {business?.abn && <p className="text-xs text-gray-500">ABN: {business.abn}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Quote</p>
              <p className="text-xl font-light" style={{ color: primaryColor }}>{estimate.estimate_number}</p>
              <p className="text-xs text-gray-500 mt-4">
                {format(new Date(estimate.created_at), "d MMMM yyyy")}
              </p>
            </div>
          </div>

          {/* Simple divider */}
          <div className="mb-8" style={{ borderBottom: `1px solid ${primaryColor}` }}></div>

          {/* Client & Site - minimal layout */}
          <div className="page-break-avoid grid grid-cols-2 gap-12 mb-10">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">To</p>
              <p className="font-medium text-gray-900">{estimate.client_name}</p>
              {estimate.company_name && <p className="text-sm text-gray-600">{estimate.company_name}</p>}
              {estimate.client_email && <p className="text-sm text-gray-500">{estimate.client_email}</p>}
              {estimate.client_phone && <p className="text-sm text-gray-500">{estimate.client_phone}</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Site</p>
              <p className="text-gray-900">{estimate.site_address}</p>
            </div>
          </div>

          {/* Project Summary */}
          <ProjectSummarySection 
            data={quotePDFData} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="minimal"
          />

          {/* Scope Breakdown */}
          <ScopeBreakdownSection 
            data={quotePDFData} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="minimal"
            formatCurrency={formatCurrency}
          />

          {/* Scope - simple list */}
          {descriptionParts.length > 0 && (
            <div className="page-break-avoid mb-10">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Scope</p>
              <ul className="space-y-2">
                {descriptionParts.map((part, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-3">
                    <span style={{ color: primaryColor }}>—</span>
                    <span>{part}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Line Items - minimal table */}
          {parsedItems.length > 0 && (
            <div className="page-break-avoid mb-10">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${secondaryColor}` }}>
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-400 font-normal">Item</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-20">Qty</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-24">Rate</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td className="py-3 text-sm text-gray-700">{item.description}</td>
                      <td className="py-3 text-sm text-right text-gray-600">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-sm text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-sm text-right text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total - minimal */}
          <div className="page-break-avoid flex justify-end mb-12">
            <div className="w-64">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{formatCurrency(estimate.total_amount / 1.1)}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500">GST (10%)</span>
                <span className="text-gray-700">{formatCurrency(estimate.total_amount - (estimate.total_amount / 1.1))}</span>
              </div>
              <div className="flex justify-between items-center pt-3" style={{ borderTop: `2px solid ${primaryColor}` }}>
                <span className="text-gray-900 font-medium">Total</span>
                <span className="text-xl font-light" style={{ color: primaryColor }}>
                  {formatCurrency(estimate.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Exclusions */}
          <ExclusionsSection 
            exclusions={quotePDFData.exclusions} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="minimal"
          />

          {/* Terms - minimal */}
          <div className="page-break-avoid mb-8">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Terms</p>
            <div className="text-xs text-gray-500 space-y-1">
              {estimate.notes ? (
                <p className="whitespace-pre-wrap">{estimate.notes}</p>
              ) : (
                <>
                  <p>Quote valid 14 days • 50% deposit required • Balance on completion</p>
                  <p>Prices include GST • Variations may incur additional charges</p>
                </>
              )}
            </div>
          </div>

          {/* Acceptance - minimal */}
          <div className="page-break-avoid pt-6 mb-8" style={{ borderTop: "1px solid #e5e7eb" }}>
            <p className="text-xs text-gray-500 mb-6">
              By signing below, I accept this quote and authorize commencement of works.
            </p>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="border-b border-gray-300 h-12"></div>
                <p className="text-xs text-gray-400 mt-1">Signature & Date</p>
              </div>
              <div>
                <div className="border-b border-gray-300 h-12"></div>
                <p className="text-xs text-gray-400 mt-1">Print Name</p>
              </div>
            </div>
          </div>

          {/* Footer - minimal */}
          <div className="page-break-avoid text-center pt-8" style={{ borderTop: "1px solid #e5e7eb" }}>
            <div className="text-xs text-gray-400 space-x-4">
              {business?.phone && <span>{business.phone}</span>}
              {business?.email && <span>{business.email}</span>}
              {business?.address && <span>{business.address}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Classic Template (default)
    return (
      <div
        ref={ref}
        className="print-container"
        style={{ 
          fontFamily: `${fontFamily}, sans-serif`,
          backgroundColor: "white",
          color: "black"
        }}
      >
        <style>{`
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
              background: white !important;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
          
          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        `}</style>

        {/* Header with Logo */}
        <div className="page-break-avoid flex items-start justify-between pb-4 mb-6" style={{ borderBottom: `2px solid ${secondaryColor}` }}>
          <div className="flex items-start gap-4">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Company logo"
                style={{ height: "64px", width: "64px", objectFit: "contain" }}
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{business?.name || "Company Name"}</h1>
              {business?.address && <p className="text-sm text-gray-600">{business.address}</p>}
              {business?.phone && <p className="text-sm text-gray-600">Ph: {business.phone}</p>}
              {business?.email && <p className="text-sm text-gray-600">{business.email}</p>}
              {business?.abn && <p className="text-sm text-gray-600">ABN: {business.abn}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">QUOTE</h2>
            <p className="text-lg font-semibold mt-1" style={{ color: primaryColor }}>{estimate.estimate_number}</p>
            <p className="text-sm text-gray-600 mt-2">
              Date: {format(new Date(estimate.created_at), "d MMMM yyyy")}
            </p>
            {estimate.valid_until && (
              <p className="text-sm text-gray-600">
                Valid Until: {format(new Date(estimate.valid_until), "d MMMM yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Client Details */}
        <div className="page-break-avoid grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
            <p className="font-semibold text-gray-900">{estimate.client_name}</p>
            {estimate.company_name && <p className="text-sm text-gray-700">{estimate.company_name}</p>}
            {estimate.client_email && <p className="text-sm text-gray-600">{estimate.client_email}</p>}
            {estimate.client_phone && <p className="text-sm text-gray-600">{estimate.client_phone}</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Site Address</h3>
            <p className="text-gray-900">{estimate.site_address}</p>
          </div>
        </div>

        {/* Project Summary */}
        <ProjectSummarySection 
          data={quotePDFData} 
          primaryColor={primaryColor} 
          secondaryColor={secondaryColor}
          template="classic"
        />

        {/* Scope Breakdown */}
        <ScopeBreakdownSection 
          data={quotePDFData} 
          primaryColor={primaryColor} 
          secondaryColor={secondaryColor}
          template="classic"
          formatCurrency={formatCurrency}
        />

        {/* Description / Scope */}
        {descriptionParts.length > 0 && (
          <div className="page-break-avoid mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Scope of Works</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ul className="space-y-1">
                {descriptionParts.map((part, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span style={{ color: primaryColor }}>•</span>
                    <span>{part}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Line Items Table (if available) */}
        {parsedItems.length > 0 && (
          <div className="page-break-avoid mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Description</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold w-20">Qty</th>
                  <th className="text-center py-2 px-3 text-sm font-semibold w-16">Unit</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold w-24">Rate</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-3 text-sm">{item.description}</td>
                    <td className="py-2 px-3 text-sm text-right">{item.quantity}</td>
                    <td className="py-2 px-3 text-sm text-center">{item.unit}</td>
                    <td className="py-2 px-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total */}
        <div className="page-break-avoid flex justify-end mb-8">
          <div className="w-72">
            <div style={{ borderTop: `2px solid ${secondaryColor}`, paddingTop: "12px" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal (ex GST)</span>
                <span className="text-base font-medium text-gray-700">
                  {formatCurrency(estimate.total_amount / 1.1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">GST (10%)</span>
                <span className="text-base font-medium text-gray-700">
                  {formatCurrency(estimate.total_amount - (estimate.total_amount / 1.1))}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid #d1d5db" }}>
                <span className="text-lg font-bold text-gray-900">Total (inc GST)</span>
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(estimate.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Exclusions */}
        <ExclusionsSection 
          exclusions={quotePDFData.exclusions} 
          primaryColor={primaryColor} 
          secondaryColor={secondaryColor}
          template="classic"
        />

        {/* Terms & Notes */}
        <div className="page-break-avoid border-t border-gray-300 pt-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Terms & Conditions</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {estimate.notes ? (
              <p className="whitespace-pre-wrap">{estimate.notes}</p>
            ) : (
              <>
                <p>• This quote is valid for 14 days from the date of issue unless otherwise specified.</p>
                <p>• A 50% deposit is required before commencement of works.</p>
                <p>• Final payment is due upon completion of works.</p>
                <p>• Prices include GST unless otherwise stated.</p>
                <p>• Any variations to the scope of works may result in additional charges.</p>
              </>
            )}
          </div>
        </div>

        {/* Acceptance */}
        <div className="page-break-avoid bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Acceptance</h3>
          <p className="text-xs text-gray-600 mb-4">
            I accept this quote and authorize the commencement of works as described above.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-500 mb-1">Signature</p>
              <div className="border-b border-gray-400 h-8"></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <div className="border-b border-gray-400 h-8"></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1">Print Name</p>
            <div className="border-b border-gray-400 h-8"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="page-break-avoid text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Thank you for considering {business?.name || "us"} for your project.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Generated by PourHub • {format(new Date(), "d MMM yyyy")}
          </p>
        </div>
      </div>
    );
  }
);

PrintableEstimate.displayName = "PrintableEstimate";
