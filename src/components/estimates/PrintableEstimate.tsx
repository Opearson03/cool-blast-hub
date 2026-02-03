import { forwardRef } from "react";
import { format } from "date-fns";
import { extractQuotePDFData, hasDetailedData, generateScopeDescription, type QuotePDFData, type ScopeBreakdown } from "@/lib/quote-pdf-data";

// ===== Notes Parser Utility =====
// Parses the estimate.notes field to extract user notes separately from auto-generated content
interface ParsedNotes {
  userNotes: string | null;
  scopeBreakdownFromNotes: { name: string; amount: string }[];
  inclusionsFromNotes: string[];
  exclusionsFromNotes: string[];
}

function parseNotesContent(notes: string | null): ParsedNotes {
  if (!notes) {
    return {
      userNotes: null,
      scopeBreakdownFromNotes: [],
      inclusionsFromNotes: [],
      exclusionsFromNotes: [],
    };
  }

  // Find markers for auto-generated sections
  const scopeIdx = notes.indexOf('SCOPE BREAKDOWN:');
  const inclIdx = notes.indexOf('INCLUSIONS:');
  const exclIdx = notes.indexOf('EXCLUSIONS:');

  // Determine the first marker position to extract user notes
  const firstMarker = Math.min(
    scopeIdx === -1 ? Infinity : scopeIdx,
    inclIdx === -1 ? Infinity : inclIdx,
    exclIdx === -1 ? Infinity : exclIdx
  );

  // Extract user notes (everything before the first marker)
  const userNotes = firstMarker === Infinity
    ? notes.trim()
    : notes.substring(0, firstMarker).trim() || null;

  // Parse scope breakdown section
  let scopeBreakdownFromNotes: { name: string; amount: string }[] = [];
  if (scopeIdx !== -1) {
    const endIdx = Math.min(
      inclIdx === -1 ? notes.length : inclIdx,
      exclIdx === -1 ? notes.length : exclIdx
    );
    const scopeBlock = notes.substring(scopeIdx + 16, endIdx);
    const lines = scopeBlock.split('\n').filter(l => l.trim().startsWith('•'));
    scopeBreakdownFromNotes = lines
      .map(line => {
        const match = line.match(/•\s*(.+?):\s*(\$[\d,.]+)/);
        return match ? { name: match[1].trim(), amount: match[2] } : null;
      })
      .filter(Boolean) as { name: string; amount: string }[];
  }

  // Parse inclusions section
  let inclusionsFromNotes: string[] = [];
  if (inclIdx !== -1) {
    const endIdx = exclIdx === -1 ? notes.length : exclIdx;
    const inclBlock = notes.substring(inclIdx + 11, endIdx);
    inclusionsFromNotes = inclBlock
      .split('\n')
      .filter(l => l.trim().startsWith('•'))
      .map(l => l.replace(/^•\s*/, '').trim());
  }

  // Parse exclusions section
  let exclusionsFromNotes: string[] = [];
  if (exclIdx !== -1) {
    const exclBlock = notes.substring(exclIdx + 11);
    exclusionsFromNotes = exclBlock
      .split('\n')
      .filter(l => l.trim().startsWith('•'))
      .map(l => l.replace(/^•\s*/, '').trim());
  }

  return {
    userNotes,
    scopeBreakdownFromNotes,
    inclusionsFromNotes,
    exclusionsFromNotes,
  };
}

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
    payment_terms_type?: string | null;
    deposit_percentage?: number | null;
    quote_validity_days?: number | null;
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

  // Classic template - boxed section with colored header
  return (
    <div className="page-break-avoid mb-6">
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className="px-4 py-2" style={{ backgroundColor: secondaryColor }}>
          <p className="text-sm font-bold text-white uppercase tracking-wide">Project Summary</p>
        </div>
        <div className="p-4 bg-gray-50">
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
    </div>
  );
};

// Scope Line Items Component - Renders scopes as line items in the table
const ScopeLineItemsSection = ({ 
  data, 
  primaryColor, 
  secondaryColor,
  template,
  formatCurrency,
  totalAmount
}: { 
  data: QuotePDFData; 
  primaryColor: string; 
  secondaryColor: string;
  template: string;
  formatCurrency: (amount: number) => string;
  totalAmount: number;
}) => {
  const { scopeBreakdowns } = data;
  
  if (scopeBreakdowns.length === 0) return null;

  // For now, we show scopes as descriptive line items
  // The total is divided proportionally by volume if multiple scopes exist
  const totalVolume = scopeBreakdowns.reduce((sum, s) => sum + s.volume, 0);

  if (template === 'minimal') {
    return (
      <div className="page-break-avoid mb-10">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${secondaryColor}` }}>
              <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-400 font-normal">Description</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {scopeBreakdowns.map((scope, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td className="py-3 text-sm text-gray-700">
                  <span className="font-medium">{scope.scopeName}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {generateScopeDescription(scope)}
                  </span>
                  {scope.areas && scope.areas.length > 0 && (
                    <span className="block text-xs text-gray-400 mt-1">
                      {scope.areas.map(a => `${a.name}: ${a.area.toFixed(1)}m²`).join(' • ')}
                    </span>
                  )}
                </td>
                <td className="py-3 text-sm text-right text-gray-500">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Classic template - boxed section with colored header
  return (
    <div className="page-break-avoid mb-6">
      <div className="border border-gray-300 rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: secondaryColor }}>
              <th className="text-left py-3 px-4 text-sm font-bold text-white uppercase tracking-wide">Scope of Works</th>
              <th className="text-right py-3 px-4 text-sm font-bold text-white uppercase tracking-wide w-28">Included</th>
            </tr>
          </thead>
          <tbody>
            {scopeBreakdowns.map((scope, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-3 px-4 text-sm border-b border-gray-200">
                  <span className="font-medium text-gray-900">{scope.scopeName}</span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    {generateScopeDescription(scope)}
                  </span>
                  {scope.areas && scope.areas.length > 0 && (
                    <span className="block text-xs text-gray-500 mt-1">
                      {scope.areas.map(a => `${a.name}: ${a.area.toFixed(1)}m²`).join(' • ')}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-right font-bold border-b border-gray-200" style={{ color: primaryColor }}>✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Notes-Based Scope Breakdown Fallback - renders scopes from parsed notes when scope_data is empty
const NotesBasedScopeBreakdown = ({ 
  items, 
  template, 
  primaryColor, 
  secondaryColor 
}: { 
  items: { name: string; amount: string }[];
  template: string;
  primaryColor: string;
  secondaryColor: string;
}) => {
  if (items.length === 0) return null;

  if (template === 'minimal') {
    return (
      <div className="page-break-avoid mb-10">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${secondaryColor}` }}>
              <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-400 font-normal">Description</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td className="py-3 text-sm text-gray-700">
                  <span className="font-medium">{item.name}</span>
                </td>
                <td className="py-3 text-sm text-right font-medium text-gray-700">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Classic template - boxed section with colored header
  return (
    <div className="page-break-avoid mb-6">
      <div className="border border-gray-300 rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: secondaryColor }}>
              <th className="text-left py-3 px-4 text-sm font-bold text-white uppercase tracking-wide">Scope of Works</th>
              <th className="text-right py-3 px-4 text-sm font-bold text-white uppercase tracking-wide w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-3 px-4 text-sm border-b border-gray-200">
                  <span className="font-medium text-gray-900">{item.name}</span>
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium text-gray-700 border-b border-gray-200">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// Terms and Exclusions Page Component - NEW (Page 2)
const TermsAndExclusionsPage = ({
  inclusions,
  exclusions, 
  paymentTerms,
  customNotes,
  business,
  estimate,
  primaryColor, 
  secondaryColor,
  template 
}: { 
  inclusions: string[];
  exclusions: string[]; 
  paymentTerms: string[] | null;
  customNotes: string | null;
  business: PrintableEstimateProps['business'];
  estimate: PrintableEstimateProps['estimate'];
  primaryColor: string; 
  secondaryColor: string;
  template: string;
}) => {
  const hasContent = inclusions.length > 0 || exclusions.length > 0 || paymentTerms || customNotes;
  if (!hasContent) return null;

  const renderHeader = () => {
    if (template === 'minimal') {
      return (
        <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: `1px solid ${primaryColor}` }}>
          <div className="flex items-center gap-3">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Company logo"
                style={{ maxHeight: "32px", maxWidth: "80px", width: "auto", height: "auto", objectFit: "contain" }}
              />
            )}
            <span className="text-sm font-medium text-gray-700">{business?.name}</span>
          </div>
          <span className="text-xs uppercase tracking-wider text-gray-400">Terms & Conditions</span>
        </div>
      );
    }

    // Classic - letterhead-style with accent bar - full bleed with negative margins
    return (
      <div className="mb-4 -mx-5">
        <div style={{ height: "6px", backgroundColor: primaryColor }}></div>
        <div style={{ backgroundColor: secondaryColor }}>
          <div className="flex justify-between items-center py-3 px-5">
          <div className="flex items-center gap-4">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Company logo"
                style={{ maxHeight: "48px", maxWidth: "100px", width: "auto", height: "auto", objectFit: "contain", backgroundColor: "white", borderRadius: "4px", padding: "4px" }}
              />
            )}
            <div className="text-white">
              <p className="font-bold text-lg">{business?.name}</p>
              <p className="text-sm opacity-80">Quote: {estimate.estimate_number}</p>
            </div>
          </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Terms & Conditions</h2>
          </div>
        </div>
      </div>
    );
  };

  const renderTerms = () => {
    if (template === 'minimal') {
      return (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Payment Terms</p>
          <div className="text-sm text-gray-600 space-y-2">
            {customNotes ? (
              <p className="whitespace-pre-wrap">{customNotes}</p>
            ) : paymentTerms ? (
              paymentTerms.map((term, index) => (
                <p key={index} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{term}</span>
                </p>
              ))
            ) : (
              <>
                <p>• Quote valid 14 days from issue date</p>
                <p>• 50% deposit required before commencement</p>
                <p>• Balance due upon completion</p>
                <p>• Prices include GST</p>
                <p>• Variations may incur additional charges</p>
              </>
            )}
          </div>
        </div>
      );
    }

    // Classic - boxed section with colored header
    return (
      <div className="mb-4">
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="px-3 py-1" style={{ backgroundColor: secondaryColor }}>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Payment Terms</p>
          </div>
          <div className="p-3 bg-gray-50">
            <div className="text-xs text-gray-700 space-y-1">
              {customNotes ? (
                <p className="whitespace-pre-wrap">{customNotes}</p>
              ) : paymentTerms ? (
                paymentTerms.map((term, index) => (
                  <p key={index}>• {term}</p>
                ))
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
        </div>
      </div>
    );
  };

  const renderInclusions = () => {
    if (inclusions.length === 0) return null;

    if (template === 'minimal') {
      return (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Inclusions</p>
          <p className="text-xs text-gray-500 mb-2">This quote includes:</p>
          <div className="text-sm text-gray-600 space-y-1">
            {inclusions.map((inc, index) => (
              <p key={index} className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{inc}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }

    // Classic - boxed section with colored header
    return (
      <div className="mb-4">
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="px-3 py-1" style={{ backgroundColor: "#166534" }}>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Inclusions</p>
          </div>
          <div className="p-3 bg-green-50">
            <p className="text-[10px] text-green-800 mb-2">This quote includes:</p>
            <ul className="space-y-0.5">
              {inclusions.map((inc, index) => (
                <li key={index} className="text-xs text-green-700 flex items-start gap-1">
                  <span style={{ color: primaryColor }}>✓</span>
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderExclusions = () => {
    if (exclusions.length === 0) return null;

    if (template === 'minimal') {
      return (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Exclusions</p>
          <p className="text-xs text-gray-500 mb-2">The following items are NOT included in this quote:</p>
          <div className="text-sm text-gray-600 space-y-1">
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

    // Classic - boxed section with colored header
    return (
      <div className="mb-4">
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="px-3 py-1" style={{ backgroundColor: "#c2410c" }}>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Exclusions</p>
          </div>
          <div className="p-3 bg-orange-50">
            <p className="text-[10px] text-orange-800 mb-2">The following items are NOT included:</p>
            <ul className="space-y-0.5">
              {exclusions.map((exc, index) => (
                <li key={index} className="text-xs text-orange-700 flex items-start gap-1">
                  <span style={{ color: primaryColor }}>✕</span>
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderAcceptance = () => {
    if (template === 'minimal') {
      return (
        <div className="pt-8" style={{ borderTop: "1px solid #e5e7eb" }}>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-4">Acceptance</p>
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
      );
    }

    // Classic - formal authorization block with colored header
    return (
      <div className="border border-gray-300 rounded overflow-hidden">
        <div className="px-3 py-1" style={{ backgroundColor: secondaryColor }}>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Authorization</p>
        </div>
        <div className="p-4 bg-white">
          <p className="text-xs text-gray-600 mb-3">
            I accept this quotation and authorize commencement of the described works.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="border-b-2 border-gray-400 h-8 mb-1"></div>
              <p className="text-xs text-gray-500">Authorized Signature</p>
            </div>
            <div>
              <div className="border-b-2 border-gray-400 h-8 mb-1"></div>
              <p className="text-xs text-gray-500">Date</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="border-b border-gray-300 h-6 mb-1"></div>
            <p className="text-xs text-gray-500">Print Name</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div data-pdf-section="page-2" className="page-break-before">
      {renderHeader()}
      {renderInclusions()}
      {renderExclusions()}
      {renderTerms()}
      {renderAcceptance()}
    </div>
  );
};

// Helper function to generate dynamic payment terms text
// NOTE: We no longer check for estimate.notes here - we use payment_terms_type to generate terms
// and only use user-entered notes (parsed separately) for custom content
const getPaymentTermsText = (estimate: PrintableEstimateProps['estimate'], hasUserNotes: boolean): string[] | null => {
  // If user has entered custom notes, don't override with generated terms
  if (hasUserNotes) return null;
  
  const validity = estimate.quote_validity_days || 14;
  const deposit = estimate.deposit_percentage || 50;
  const termsType = estimate.payment_terms_type || 'deposit_balance';
  
  switch (termsType) {
    case 'deposit_balance':
      return [
        `This quote is valid for ${validity} days from the date of issue.`,
        `A ${deposit}% deposit is required before commencement of works.`,
        `Final payment is due upon completion of works.`,
        `Prices include GST unless otherwise stated.`,
        `Any variations to the scope of works may result in additional charges.`,
      ];
    case 'progress':
      return [
        `This quote is valid for ${validity} days from the date of issue.`,
        `Payment is due in progress claims as milestones are completed.`,
        `Prices include GST unless otherwise stated.`,
        `Any variations to the scope of works may result in additional charges.`,
      ];
    case 'on_completion':
      return [
        `This quote is valid for ${validity} days from the date of issue.`,
        `Full payment is due upon completion of works.`,
        `Prices include GST unless otherwise stated.`,
        `Any variations to the scope of works may result in additional charges.`,
      ];
    case 'net_14':
      return [
        `This quote is valid for ${validity} days from the date of issue.`,
        `Payment is due within 14 days of invoice date.`,
        `Prices include GST unless otherwise stated.`,
        `Any variations to the scope of works may result in additional charges.`,
      ];
    case 'net_30':
      return [
        `This quote is valid for ${validity} days from the date of issue.`,
        `Payment is due within 30 days of invoice date.`,
        `Prices include GST unless otherwise stated.`,
        `Any variations to the scope of works may result in additional charges.`,
      ];
    default:
      return null; // Use notes field for custom terms
  }
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
    
    // Parse notes to extract user-entered notes separately from auto-generated content
    const parsedNotes = parseNotesContent(estimate.notes);
    
    // Get dynamic payment terms (pass whether user has custom notes)
    const paymentTerms = getPaymentTermsText(estimate, !!parsedNotes.userNotes);

    // Common styles for print - no margin auto to avoid gaps in PDF capture
    const printStyles = `
      @media screen {
        .print-container {
          width: 210mm;
          max-width: 210mm;
          margin: 0;
          padding: 20px;
          background: #ffffff !important;
          background-color: #ffffff !important;
          overflow: visible;
        }
      }
      .page-break-avoid {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .page-break-before {
        page-break-before: always;
        break-before: page;
      }
    `;

    // Minimal template relies on PDF margins for spacing; keep the DOM layout within the
    // printable content box to avoid pushing Page 1 slightly over a single page (which
    // can trigger an extra blank leading page in the section-based renderer).
    const minimalPrintStyles = printStyles
      .replace("width: 210mm;", "width: 190mm;")
      .replace("max-width: 210mm;", "max-width: 190mm;")
      .replace("padding: 20px;", "padding: 0;");

    // Render template based on selection
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
          <style>{minimalPrintStyles}</style>

          {/* PAGE 1 - Fixed height container for A4 page */}
          <div 
            data-pdf-section="page-1"
            style={{ 
              minHeight: "277mm",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Header - QUOTE title with logo */}
            <div className="page-break-avoid flex items-start justify-between mb-6">
              <h1 className="text-3xl font-light tracking-wide" style={{ color: primaryColor }}>QUOTE</h1>
              {business?.logo_url && (
                <img
                  src={business.logo_url}
                  alt="Company logo"
                  style={{ maxHeight: "50px", maxWidth: "120px", width: "auto", height: "auto", objectFit: "contain" }}
                />
              )}
            </div>

            {/* Two-column info boxes - aligned at top with matching structure */}
            <div className="page-break-avoid grid grid-cols-2 gap-8 mb-6 items-start">
              {/* Left - Customer/Quote Info (4 rows) */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-2 uppercase">CUSTOMER DETAILS</p>
                <table className="w-full text-sm border border-gray-300 table-fixed">
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "60%" }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Customer name</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{estimate.client_name}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Quote number</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{estimate.estimate_number}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Date</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{format(new Date(estimate.created_at), "d MMM yyyy")}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Quote valid until</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{estimate.valid_until ? format(new Date(estimate.valid_until), "d MMM yyyy") : "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right - Business Info (4 rows to match left side) */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-2 uppercase">{business?.name || "Your Business Name"}</p>
                <table className="w-full text-sm border border-gray-300 table-fixed">
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "60%" }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Email</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{business?.email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Phone</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{business?.phone || "-"}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Address</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{business?.address || "-"}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">ABN</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{business?.abn || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary of Customer Requirements */}
            <div className="page-break-avoid mb-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">Summary of Customer Requirements</p>
              <div className="bg-gray-100 border border-gray-300 p-4 min-h-[60px]">
                <p className="text-sm text-gray-700">{estimate.site_address}</p>
                {estimate.description && <p className="text-sm text-gray-600 mt-1">{estimate.description}</p>}
              </div>
            </div>

            {/* Flexible content area - grows to fill space */}
            <div className="flex-grow">
              {/* Line Items Table with alternating rows - markup distributed into each line item */}
              {(() => {
                // Calculate markup multiplier from global margin
                const globalMargin = scopeData?._globalMargin || 0;
                const markupMultiplier = 1 + (Number(globalMargin) / 100);
                
                // Calculate marked-up totals for each scope
                const markedUpScopes = quotePDFData.scopeBreakdowns.map(scope => {
                  const internalCost = scope.calculatedTotal || 0;
                  return {
                    ...scope,
                    markedUpTotal: internalCost * markupMultiplier
                  };
                });
                
                // Calculate sum and apply rounding adjustment to largest item
                const markedUpSum = markedUpScopes.reduce((sum, s) => sum + s.markedUpTotal, 0);
                const roundingDiff = estimate.total_amount - markedUpSum;
                
                // Apply rounding difference to the largest scope (if any scopes exist)
                if (markedUpScopes.length > 0 && Math.abs(roundingDiff) > 0.001) {
                  const largestIdx = markedUpScopes.reduce(
                    (maxIdx, scope, idx, arr) => scope.markedUpTotal > arr[maxIdx].markedUpTotal ? idx : maxIdx, 
                    0
                  );
                  markedUpScopes[largestIdx].markedUpTotal += roundingDiff;
                }
                
                // Count total data rows for empty row calculation (no separate markup row now)
                const dataRowCount = quotePDFData.scopeBreakdowns.length 
                  + (quotePDFData.scopeBreakdowns.length === 0 ? parsedItems.length : 0);
                
                return (
                  <div className="page-break-avoid mb-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-400">
                          <th className="text-left py-2 px-2 text-xs font-bold uppercase text-gray-700">Description</th>
                          <th className="text-right py-2 px-2 text-xs font-bold uppercase text-gray-700 w-24">Price</th>
                          <th className="text-right py-2 px-2 text-xs font-bold uppercase text-gray-700 w-16">Qty</th>
                          <th className="text-right py-2 px-2 text-xs font-bold uppercase text-gray-700 w-16">GST %</th>
                          <th className="text-right py-2 px-2 text-xs font-bold uppercase text-gray-700 w-28">Total Inc GST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Scope Items - with markup distributed into each line item */}
                        {markedUpScopes.map((scope, index) => {
                          const totalIncGst = scope.markedUpTotal;
                          const priceExGst = totalIncGst / 1.1;
                          return (
                            <tr key={`scope-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#f3f4f6" : "white" }}>
                              <td className="py-2 px-2 text-gray-900">{scope.scopeName}</td>
                              <td className="py-2 px-2 text-right text-gray-700">
                                {totalIncGst ? formatCurrency(priceExGst) : "-"}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-700">1</td>
                              <td className="py-2 px-2 text-right text-gray-700">10%</td>
                              <td className="py-2 px-2 text-right text-gray-900 font-medium">
                                {totalIncGst ? formatCurrency(totalIncGst) : "-"}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Legacy line items if no scope breakdowns */}
                        {quotePDFData.scopeBreakdowns.length === 0 && parsedItems.map((item, index) => (
                          <tr key={`item-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#f3f4f6" : "white" }}>
                            <td className="py-2 px-2 text-gray-900">{item.description}</td>
                            <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 px-2 text-right text-gray-700">{item.quantity}</td>
                            <td className="py-2 px-2 text-right text-gray-700">10%</td>
                            <td className="py-2 px-2 text-right text-gray-900 font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                        {/* Empty rows for visual consistency */}
                        {Array.from({ length: Math.max(0, 8 - dataRowCount) }).map((_, index) => {
                          const rowIndex = dataRowCount + index;
                          return (
                            <tr key={`empty-${index}`} style={{ backgroundColor: rowIndex % 2 === 0 ? "#f3f4f6" : "white" }}>
                              <td className="py-2 px-2">&nbsp;</td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2 text-right text-gray-400">0.00</td>
                            </tr>
                          );
                        })}
                        {/* Subtotal, GST, Total rows */}
                        <tr className="border-t border-gray-300">
                          <td colSpan={4} className="py-2 px-2 text-right text-gray-700 font-medium">Subtotal (ex GST)</td>
                          <td className="py-2 px-2 text-right text-gray-900 font-medium">
                            {formatCurrency(estimate.total_amount ? estimate.total_amount / 1.1 : 0)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="py-2 px-2 text-right text-gray-700 font-medium">GST (10%)</td>
                          <td className="py-2 px-2 text-right text-gray-900 font-medium">
                            {formatCurrency(estimate.total_amount ? estimate.total_amount - (estimate.total_amount / 1.1) : 0)}
                          </td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="py-2 px-2 text-right text-gray-900 font-bold">Total (inc GST)</td>
                          <td className="py-2 px-2 text-right text-gray-900 font-bold text-base">
                            {formatCurrency(estimate.total_amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Fixed bottom section */}
            <div className="mt-auto">

              {/* Terms & Conditions section */}
              <div className="page-break-avoid mb-6">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-2 border-b border-gray-400 pb-1">Terms & Conditions</p>
                <div className="text-sm text-gray-600 py-2">
                  <p>• Quote valid for {estimate.quote_validity_days || 14} days from date of issue</p>
                  <p>• Prices include GST</p>
                </div>
              </div>

              {/* Signature line */}
              <div className="page-break-avoid flex justify-between items-end mb-4">
                <div>
                  <div className="w-56 border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-500">Customer Signature</p>
                </div>
                <div>
                  <div className="w-40 border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-500">Date</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">{business?.name} • {business?.phone} • {business?.email}</p>
              </div>
            </div>
          </div>

          {/* PAGE 2 - Terms & Exclusions */}
          <TermsAndExclusionsPage
            inclusions={[...quotePDFData.inclusions, ...parsedNotes.inclusionsFromNotes.filter(inc => !quotePDFData.inclusions.includes(inc))]}
            exclusions={quotePDFData.exclusions.length > 0 ? quotePDFData.exclusions : parsedNotes.exclusionsFromNotes}
            paymentTerms={paymentTerms}
            customNotes={parsedNotes.userNotes}
            business={business}
            estimate={estimate}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            template="minimal"
          />
        </div>
      );
    }

    // Classic Template (default) - Form-style layout
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
        <style>{printStyles}</style>

        {/* PAGE 1 - Fixed height container for A4 page */}
        <div 
          data-pdf-section="page-1"
          style={{ 
            minHeight: "277mm", /* A4 height minus margins */
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Letterhead-style Header with Accent Bar - Full bleed */}
          <div className="page-break-avoid mb-4">
            {/* Top accent bar */}
            <div style={{ height: "8px", backgroundColor: primaryColor }}></div>
            
            {/* Main header area - background extends full width */}
            <div style={{ backgroundColor: secondaryColor }}>
              <div className="flex justify-between items-center py-3 px-6">
                <div className="flex items-center gap-4">
                  {business?.logo_url && (
                    <img
                      src={business.logo_url}
                      alt="Company logo"
                      style={{ maxHeight: "50px", maxWidth: "120px", backgroundColor: "white", borderRadius: "4px", padding: "6px" }}
                    />
                  )}
                  <div className="text-white">
                    <h1 className="text-xl font-bold tracking-wide">{business?.name || "Company Name"}</h1>
                    <p className="text-xs opacity-90">{business?.address || ""}</p>
                  </div>
                </div>
                <div className="text-right text-white">
                  <p className="text-2xl font-bold tracking-wider">QUOTE</p>
                  <p className="text-base font-semibold" style={{ color: primaryColor }}>{estimate.estimate_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-column info boxes with colored section headers */}
          <div className="page-break-avoid grid grid-cols-2 gap-4 mb-4 px-6">
            {/* Left - Bill To */}
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="px-4 py-2" style={{ backgroundColor: secondaryColor }}>
                <p className="text-sm font-bold text-white uppercase tracking-wide">Bill To</p>
              </div>
              <div className="p-4 space-y-2 bg-white">
                <p className="text-base font-semibold text-gray-900">{estimate.client_name}</p>
                {estimate.company_name && <p className="text-sm text-gray-600">{estimate.company_name}</p>}
                <p className="text-sm text-gray-600">{estimate.site_address}</p>
                {estimate.client_email && <p className="text-sm text-gray-600">{estimate.client_email}</p>}
                {estimate.client_phone && <p className="text-sm text-gray-600">{estimate.client_phone}</p>}
              </div>
            </div>

            {/* Right - Quote Details */}
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="px-4 py-2" style={{ backgroundColor: secondaryColor }}>
                <p className="text-sm font-bold text-white uppercase tracking-wide">Quote Details</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2 text-gray-600 font-medium bg-gray-50">Quote #</td>
                    <td className="px-4 py-2 text-gray-900 text-right font-semibold">{estimate.estimate_number}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2 text-gray-600 font-medium bg-gray-50">Date</td>
                    <td className="px-4 py-2 text-gray-900 text-right">{format(new Date(estimate.created_at), "d MMMM yyyy")}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2 text-gray-600 font-medium bg-gray-50">Valid Until</td>
                    <td className="px-4 py-2 text-gray-900 text-right">{estimate.valid_until ? format(new Date(estimate.valid_until), "d MMMM yyyy") : "-"}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600 font-medium bg-gray-50">ABN</td>
                    <td className="px-4 py-2 text-gray-900 text-right">{business?.abn || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Flexible content area - grows to fill space */}
          <div className="flex-grow px-6">

            {/* Scope of Works as Line Items with Markup - matching Minimal template */}
            {quotePDFData.scopeBreakdowns.length > 0 ? (
              (() => {
                // Calculate markup multiplier from global margin
                const globalMargin = scopeData?._globalMargin || 0;
                const markupMultiplier = 1 + (Number(globalMargin) / 100);
                
                // Calculate marked-up totals for each scope
                const markedUpScopes = quotePDFData.scopeBreakdowns.map(scope => ({
                  ...scope,
                  markedUpTotal: (scope.calculatedTotal || 0) * markupMultiplier
                }));
                
                // Apply rounding adjustment to largest item to match estimate.total_amount
                const markedUpSum = markedUpScopes.reduce((sum, s) => sum + s.markedUpTotal, 0);
                const roundingDiff = estimate.total_amount - markedUpSum;
                
                if (markedUpScopes.length > 0 && Math.abs(roundingDiff) > 0.001) {
                  const largestIdx = markedUpScopes.reduce(
                    (maxIdx, scope, idx, arr) => scope.markedUpTotal > arr[maxIdx].markedUpTotal ? idx : maxIdx, 
                    0
                  );
                  markedUpScopes[largestIdx].markedUpTotal += roundingDiff;
                }

                return (
                  <div className="page-break-avoid mb-4 border border-gray-300 rounded overflow-hidden">
                    <table className="w-full border-collapse table-fixed">
                      <colgroup>
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "22%" }} />
                      </colgroup>
                      <thead>
                        <tr style={{ backgroundColor: secondaryColor }}>
                          <th className="text-left py-2 px-3 text-xs font-bold text-white uppercase tracking-wide">Item Description</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-white uppercase tracking-wide">Unit Price</th>
                          <th className="text-center py-2 px-3 text-xs font-bold text-white uppercase tracking-wide">Qty</th>
                          <th className="text-center py-2 px-3 text-xs font-bold text-white uppercase tracking-wide">GST</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-white uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {markedUpScopes.map((scope, index) => {
                          const totalIncGst = scope.markedUpTotal;
                          const priceExGst = totalIncGst / 1.1;
                          return (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="py-2 px-3 text-sm border-b border-gray-200 text-gray-900">{scope.scopeName}</td>
                              <td className="py-2 px-3 text-sm text-right border-b border-gray-200 text-gray-700">{formatCurrency(priceExGst)}</td>
                              <td className="py-2 px-3 text-sm text-center border-b border-gray-200 text-gray-700">1</td>
                              <td className="py-2 px-3 text-sm text-center border-b border-gray-200 text-gray-700">10%</td>
                              <td className="py-2 px-3 text-sm text-right font-medium border-b border-gray-200 text-gray-900">{formatCurrency(totalIncGst)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Totals section with accent bar */}
                    <div className="border-t-2" style={{ borderColor: primaryColor }}>
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: "78%" }} />
                          <col style={{ width: "22%" }} />
                        </colgroup>
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="py-1 px-3 text-sm font-medium text-right text-gray-700">Subtotal (ex GST)</td>
                            <td className="py-1 px-3 text-sm text-right font-medium text-gray-900">{formatCurrency(estimate.total_amount / 1.1)}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-1 px-3 text-sm font-medium text-right text-gray-700">GST (10%)</td>
                            <td className="py-1 px-3 text-sm text-right font-medium text-gray-900">{formatCurrency(estimate.total_amount - (estimate.total_amount / 1.1))}</td>
                          </tr>
                          <tr style={{ backgroundColor: primaryColor }}>
                            <td className="py-2 px-3 text-sm font-bold text-right text-white uppercase">Total Due</td>
                            <td className="py-2 px-3 text-lg text-right font-bold text-white">{formatCurrency(estimate.total_amount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()
            ) : parsedNotes.scopeBreakdownFromNotes.length > 0 ? (
              <NotesBasedScopeBreakdown 
                items={parsedNotes.scopeBreakdownFromNotes}
                template="classic"
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            ) : null}

            {/* Material Description Table with Tax column */}
            {parsedItems.length > 0 && (
              <div className="page-break-avoid mb-4 border border-gray-300 rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: secondaryColor }}>
                      <th className="text-left py-2 px-3 text-xs font-bold text-white uppercase tracking-wide">Material Description</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-white uppercase tracking-wide w-24">Cost</th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-white uppercase tracking-wide w-16">Tax</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-white uppercase tracking-wide w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="py-2 px-3 text-sm border-b border-gray-200 text-gray-900">{item.description}</td>
                        <td className="py-2 px-3 text-sm text-right border-b border-gray-200 text-gray-700">{formatCurrency(item.total / 1.1)}</td>
                        <td className="py-2 px-3 text-sm text-center border-b border-gray-200 text-gray-700">10%</td>
                        <td className="py-2 px-3 text-sm text-right font-medium border-b border-gray-200 text-gray-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Totals section with accent bar */}
                <div className="border-t-2" style={{ borderColor: primaryColor }}>
                  <table className="w-full">
                    <tbody>
                      <tr style={{ backgroundColor: primaryColor }}>
                        <td className="py-2 px-3 text-sm font-bold text-white uppercase" colSpan={3}>Total Due</td>
                        <td className="py-2 px-3 text-lg text-right font-bold text-white w-24">{formatCurrency(estimate.total_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Formal Signature Block - anchored to bottom */}
            <div className="page-break-avoid mt-auto border border-gray-300 rounded overflow-hidden">
              <div className="px-4 py-2" style={{ backgroundColor: primaryColor }}>
                <p className="text-sm font-bold text-white uppercase tracking-wide text-center">Authorization</p>
              </div>
              <div className="p-4 bg-white">
                <p className="text-xs text-gray-600 mb-3">
                  I accept this quotation and authorize commencement of the described works.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="border-b-2 border-gray-400 h-8 mb-1"></div>
                    <p className="text-xs text-gray-500">Authorized Signature</p>
                  </div>
                  <div>
                    <div className="border-b-2 border-gray-400 h-8 mb-1"></div>
                    <p className="text-xs text-gray-500">Date</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="border-b border-gray-300 h-6 mb-1"></div>
                  <p className="text-xs text-gray-500">Print Name</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2 - Terms & Exclusions */}
        <TermsAndExclusionsPage
          inclusions={[...quotePDFData.inclusions, ...parsedNotes.inclusionsFromNotes.filter(inc => !quotePDFData.inclusions.includes(inc))]}
          exclusions={quotePDFData.exclusions.length > 0 ? quotePDFData.exclusions : parsedNotes.exclusionsFromNotes}
          paymentTerms={paymentTerms}
          customNotes={parsedNotes.userNotes}
          business={business}
          estimate={estimate}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          template="classic"
        />
      </div>
    );
  }
);

PrintableEstimate.displayName = "PrintableEstimate";
