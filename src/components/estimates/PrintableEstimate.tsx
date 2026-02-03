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

  if (template === 'modern') {
    return (
      <div className="page-break-avoid mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
              <th className="text-left py-3 px-4 text-sm font-bold">Scope of Works</th>
              <th className="text-right py-3 px-4 text-sm font-bold w-28">Included</th>
            </tr>
          </thead>
          <tbody>
            {scopeBreakdowns.map((scope, index) => (
              <tr key={index} className="border-b border-gray-200" style={{ backgroundColor: index % 2 === 0 ? "#f9fafb" : "white" }}>
                <td className="py-3 px-4 text-sm">
                  <span className="font-semibold text-gray-900">{scope.scopeName}</span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    {generateScopeDescription(scope)}
                  </span>
                  {scope.areas && scope.areas.length > 0 && (
                    <span className="block text-xs text-gray-500 mt-1">
                      {scope.areas.map(a => `${a.name}: ${a.area.toFixed(1)}m²`).join(' • ')}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: primaryColor }}>✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Classic template
  return (
    <div className="page-break-avoid mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
            <th className="text-left py-2 px-3 text-sm font-semibold">Scope of Works</th>
            <th className="text-right py-2 px-3 text-sm font-semibold w-28">Included</th>
          </tr>
        </thead>
        <tbody>
          {scopeBreakdowns.map((scope, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 px-3 text-sm">
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
              <td className="py-2 px-3 text-sm text-right font-medium" style={{ color: primaryColor }}>✓</td>
            </tr>
          ))}
        </tbody>
      </table>
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

  if (template === 'modern') {
    return (
      <div className="page-break-avoid mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
              <th className="text-left py-3 px-4 text-sm font-bold">Scope of Works</th>
              <th className="text-right py-3 px-4 text-sm font-bold w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200" style={{ backgroundColor: index % 2 === 0 ? "#f9fafb" : "white" }}>
                <td className="py-3 px-4 text-sm">
                  <span className="font-semibold text-gray-900">{item.name}</span>
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: primaryColor }}>{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Classic template
  return (
    <div className="page-break-avoid mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
            <th className="text-left py-2 px-3 text-sm font-semibold">Scope of Works</th>
            <th className="text-right py-2 px-3 text-sm font-semibold w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2 px-3 text-sm">
                <span className="font-medium text-gray-900">{item.name}</span>
              </td>
              <td className="py-2 px-3 text-sm text-right font-medium text-gray-700">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

    if (template === 'modern') {
      return (
        <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: `3px solid ${primaryColor}` }}>
          <div className="flex items-center gap-4">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Company logo"
                style={{ maxHeight: "40px", maxWidth: "100px", width: "auto", height: "auto", objectFit: "contain" }}
              />
            )}
            <div>
              <p className="font-bold text-gray-900">{business?.name}</p>
              <p className="text-xs text-gray-500">Quote: {estimate.estimate_number}</p>
            </div>
          </div>
          <h2 className="text-lg font-bold uppercase" style={{ color: secondaryColor }}>Terms & Conditions</h2>
        </div>
      );
    }

    // Classic
    return (
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: `2px solid ${secondaryColor}` }}>
        <div className="flex items-center gap-4">
          {business?.logo_url && (
            <img
              src={business.logo_url}
              alt="Company logo"
              style={{ maxHeight: "48px", maxWidth: "100px", width: "auto", height: "auto", objectFit: "contain" }}
            />
          )}
          <div>
            <p className="font-semibold text-gray-900">{business?.name}</p>
            <p className="text-sm text-gray-500">Quote: {estimate.estimate_number}</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-700">Terms & Conditions</h2>
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

    if (template === 'modern') {
      return (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>Payment Terms</h3>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="text-sm text-blue-900 space-y-2">
              {customNotes ? (
                <p className="whitespace-pre-wrap">{customNotes}</p>
              ) : paymentTerms ? (
                paymentTerms.map((term, index) => (
                  <p key={index}>• {term}</p>
                ))
              ) : (
                <>
                  <p>• This quote is valid for 14 days from the date of issue.</p>
                  <p>• A 50% deposit is required before commencement of works.</p>
                  <p>• Final payment is due upon completion of works.</p>
                  <p>• Prices include GST unless otherwise stated.</p>
                  <p>• Any variations to the scope of works may result in additional charges.</p>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Classic
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Terms</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-700 space-y-2">
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

    if (template === 'modern') {
      return (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>Inclusions</h3>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <p className="text-xs text-green-800 mb-3">This quote includes:</p>
            <ul className="space-y-1">
              {inclusions.map((inc, index) => (
                <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    // Classic
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Inclusions</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-800 mb-3">This quote includes:</p>
          <ul className="space-y-1">
            {inclusions.map((inc, index) => (
              <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                <span style={{ color: primaryColor }}>✓</span>
                <span>{inc}</span>
              </li>
            ))}
          </ul>
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

    if (template === 'modern') {
      return (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>Exclusions</h3>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-xs text-red-800 mb-3">The following items are NOT included in this quote:</p>
            <ul className="space-y-1">
              {exclusions.map((exc, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    // Classic
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Exclusions</h3>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-orange-800 mb-3">The following items are NOT included in this quote:</p>
          <ul className="space-y-1">
            {exclusions.map((exc, index) => (
              <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                <span style={{ color: primaryColor }}>✕</span>
                <span>{exc}</span>
              </li>
            ))}
          </ul>
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

    if (template === 'modern') {
      return (
        <div className="p-4" style={{ backgroundColor: "#f9fafb", borderRadius: "8px", border: `2px solid ${primaryColor}` }}>
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
      );
    }

    // Classic
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
    );
  };

  return (
    <div data-pdf-section="page-2" className="page-break-before pt-8">
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

    // Common styles for print
    const printStyles = `
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
      .page-break-before {
        page-break-before: always;
        break-before: page;
      }
    `;

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
          <style>{printStyles}</style>

          {/* PAGE 1 - Quote Content */}
          
          {/* Modern Template - Bold header banner */}
          <div data-pdf-section="header" className="page-break-avoid" style={{ backgroundColor: secondaryColor, padding: "24px 32px", marginBottom: "24px" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {business?.logo_url && (
                  <img
                    src={business.logo_url}
                    alt="Company logo"
                    style={{ maxHeight: "64px", maxWidth: "140px", width: "auto", height: "auto", objectFit: "contain", backgroundColor: "white", borderRadius: "8px", padding: "8px" }}
                  />
                )}
                <div style={{ color: "white" }}>
                  <h1 className="text-2xl font-bold">{business?.name || "Company Name"}</h1>
                  {business?.abn && <p className="text-sm opacity-80">ABN: {business.abn}</p>}
                </div>
              </div>
              <div style={{ color: "white", textAlign: "right" }}>
                <h2 className="text-2xl font-black tracking-tight">CONCRETE WORK</h2>
                <h3 className="text-xl font-bold">ESTIMATE</h3>
                <p className="text-lg font-bold mt-2" style={{ color: primaryColor }}>{estimate.estimate_number}</p>
              </div>
            </div>
          </div>

          {/* Two column client/company info cards */}
          <div data-pdf-section="client-info" className="page-break-avoid grid grid-cols-2 gap-8 mb-6 px-2">
            <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", borderLeft: `4px solid ${primaryColor}` }}>
              <h3 className="text-sm font-bold uppercase mb-3" style={{ color: primaryColor }}>Client Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-900">{estimate.client_name}</span></p>
                {estimate.company_name && <p><span className="text-gray-500">Company:</span> <span className="text-gray-900">{estimate.company_name}</span></p>}
                <p><span className="text-gray-500">Address:</span> <span className="text-gray-900">{estimate.site_address}</span></p>
                {estimate.client_phone && <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{estimate.client_phone}</span></p>}
                {estimate.client_email && <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{estimate.client_email}</span></p>}
              </div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", borderLeft: `4px solid ${secondaryColor}` }}>
              <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>Company Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Company:</span> <span className="font-semibold text-gray-900">{business?.name}</span></p>
                {business?.address && <p><span className="text-gray-500">Address:</span> <span className="text-gray-900">{business.address}</span></p>}
                {business?.phone && <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{business.phone}</span></p>}
                {business?.email && <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{business.email}</span></p>}
              </div>
            </div>
          </div>

          {/* Project Description */}
          {estimate.description && (
            <div className="page-break-avoid mb-6 px-2">
              <div style={{ backgroundColor: "#f9fafb", padding: "16px 20px", borderRadius: "8px", borderLeft: `4px solid ${primaryColor}` }}>
                <h3 className="text-sm font-bold uppercase mb-2" style={{ color: primaryColor }}>Project Description</h3>
                <p className="text-sm text-gray-700">{estimate.description}</p>
              </div>
            </div>
          )}

          {/* Date info strip */}
          <div className="page-break-avoid flex justify-between mb-6 px-2 text-sm text-gray-600">
            <div>
              Date: {format(new Date(estimate.created_at), "d MMMM yyyy")}
            </div>
            {estimate.valid_until && (
              <div>
                Valid until: {format(new Date(estimate.valid_until), "d MMMM yyyy")}
              </div>
            )}
          </div>

          {/* Project Summary */}
          <div data-pdf-section="project-summary" className="px-2">
            <ProjectSummarySection 
              data={quotePDFData} 
              primaryColor={primaryColor} 
              secondaryColor={secondaryColor}
              template="modern"
            />
          </div>

          {/* Scope of Works as Line Items - above totals */}
          <div data-pdf-section="scope-breakdown" className="px-2">
            {quotePDFData.scopeBreakdowns.length > 0 ? (
              <ScopeLineItemsSection 
                data={quotePDFData} 
                primaryColor={primaryColor} 
                secondaryColor={secondaryColor}
                template="modern"
                formatCurrency={formatCurrency}
                totalAmount={estimate.total_amount}
              />
            ) : parsedNotes.scopeBreakdownFromNotes.length > 0 ? (
              <NotesBasedScopeBreakdown 
                items={parsedNotes.scopeBreakdownFromNotes}
                template="modern"
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            ) : null}
          </div>

          {/* Line Items */}
          {parsedItems.length > 0 && (
            <div className="page-break-avoid mb-6 px-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
                    <th className="text-left py-3 px-4 text-sm font-bold">No</th>
                    <th className="text-left py-3 px-4 text-sm font-bold">Description</th>
                    <th className="text-right py-3 px-4 text-sm font-bold w-20">Qty</th>
                    <th className="text-center py-3 px-4 text-sm font-bold w-16">Unit</th>
                    <th className="text-right py-3 px-4 text-sm font-bold w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200" style={{ backgroundColor: index % 2 === 0 ? "#f9fafb" : "white" }}>
                      <td className="py-3 px-4 text-sm font-medium">{String(index + 1).padStart(2, '0')}</td>
                      <td className="py-3 px-4 text-sm">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-center">{item.unit}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total - Modern style */}
          <div data-pdf-section="totals" className="page-break-avoid flex justify-end mb-8 px-2">
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
                <span className="text-lg font-bold text-gray-900">TOTAL (inc GST)</span>
                <span className="text-2xl font-black" style={{ color: primaryColor }}>
                  {formatCurrency(estimate.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Signature */}
          <div data-pdf-section="page-1-footer" className="page-break-avoid px-2 py-4 border-t border-gray-200">
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-500">
                <p>Notes: Quote valid for {estimate.quote_validity_days || 14} days</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-2">Signature</p>
                <div className="w-48 border-b-2 border-gray-400"></div>
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
            template="modern"
          />
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
          <style>{printStyles.replace('padding: 20px', 'padding: 40px')}</style>

          {/* PAGE 1 - Quote Content */}

          {/* Minimal Template - Company info left, logo right */}
          <div data-pdf-section="header" className="page-break-avoid flex items-start justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{business?.name || "Company Name"}</h1>
              {business?.address && <p className="text-sm text-gray-500">{business.address}</p>}
              {business?.phone && <p className="text-sm text-gray-500">{business.phone}</p>}
              {business?.abn && <p className="text-xs text-gray-400 mt-1">ABN: {business.abn}</p>}
            </div>
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Company logo"
                style={{ maxHeight: "60px", maxWidth: "140px", width: "auto", height: "auto", objectFit: "contain" }}
              />
            )}
          </div>

          {/* Large centered title */}
          <div className="text-center my-10">
            <h2 className="text-4xl font-bold tracking-widest" style={{ color: secondaryColor }}>CONCRETE</h2>
            <h2 className="text-4xl font-bold tracking-widest" style={{ color: secondaryColor }}>ESTIMATE</h2>
          </div>

          {/* Bill To and Estimate Meta */}
          <div data-pdf-section="client-info" className="page-break-avoid grid grid-cols-2 gap-12 mb-10">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Bill To</p>
              <p className="font-medium text-gray-900 text-lg">{estimate.client_name}</p>
              {estimate.company_name && <p className="text-sm text-gray-600">{estimate.company_name}</p>}
              <p className="text-sm text-gray-600">{estimate.site_address}</p>
              {estimate.client_email && <p className="text-sm text-gray-500">{estimate.client_email}</p>}
            </div>
            <div className="text-right">
              <table className="ml-auto text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-400 pr-4 py-1">Estimate #</td>
                    <td className="font-medium text-gray-900">{estimate.estimate_number?.replace('Q-', '') || '0001'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-400 pr-4 py-1">Estimate Date</td>
                    <td className="text-gray-900">{format(new Date(estimate.created_at), "dd-MM")}</td>
                  </tr>
                  {estimate.valid_until && (
                    <tr>
                      <td className="text-gray-400 pr-4 py-1">Due Date</td>
                      <td className="text-gray-900">{format(new Date(estimate.valid_until), "dd-MM")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Summary */}
          <div data-pdf-section="project-summary">
            <ProjectSummarySection 
              data={quotePDFData} 
              primaryColor={primaryColor} 
              secondaryColor={secondaryColor}
              template="minimal"
            />
          </div>

          {/* Scope of Works as Line Items - above totals */}
          <div data-pdf-section="scope-breakdown">
            {quotePDFData.scopeBreakdowns.length > 0 ? (
              <ScopeLineItemsSection 
                data={quotePDFData} 
                primaryColor={primaryColor} 
                secondaryColor={secondaryColor}
                template="minimal"
                formatCurrency={formatCurrency}
                totalAmount={estimate.total_amount}
              />
            ) : parsedNotes.scopeBreakdownFromNotes.length > 0 ? (
              <NotesBasedScopeBreakdown 
                items={parsedNotes.scopeBreakdownFromNotes}
                template="minimal"
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            ) : null}
          </div>

          {/* Line Items - minimal table */}
          {parsedItems.length > 0 && (
            <div className="page-break-avoid mb-10">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${secondaryColor}` }}>
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-400 font-normal">Qty</th>
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-400 font-normal">Description</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-24">Unit</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-400 font-normal w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td className="py-3 text-sm text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-sm text-gray-700">{item.description}</td>
                      <td className="py-3 text-sm text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-sm text-right text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total - minimal */}
          <div data-pdf-section="totals" className="page-break-avoid flex justify-end mb-12">
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
                <span className="text-2xl font-light" style={{ color: primaryColor }}>
                  {formatCurrency(estimate.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms section */}
          <div data-pdf-section="page-1-footer" className="page-break-avoid">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Terms & Conditions</p>
              <p className="text-sm text-gray-600">Payment due in {estimate.quote_validity_days || 14} days</p>
            </div>

            {/* Signature line */}
            <div className="flex justify-end mb-8">
              <div className="text-center">
                <div className="w-48 border-b border-gray-400 mb-2"></div>
                <p className="text-xs text-gray-400">Customer Signature</p>
              </div>
            </div>

            {/* Page 1 Footer - minimal */}
            <div className="text-center pt-8" style={{ borderTop: "1px solid #e5e7eb" }}>
              <div className="text-xs text-gray-400 space-x-4">
                {business?.phone && <span>{business.phone}</span>}
                {business?.email && <span>{business.email}</span>}
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

        {/* PAGE 1 - Quote Content */}

        {/* Header Banner with Logo */}
        <div data-pdf-section="header" className="page-break-avoid mb-4" style={{ backgroundColor: secondaryColor, padding: "16px 24px" }}>
          <div className="flex items-center gap-4">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt="Company logo"
                style={{ maxHeight: "56px", maxWidth: "120px", width: "auto", height: "auto", objectFit: "contain", backgroundColor: "white", borderRadius: "6px", padding: "6px" }}
              />
            )}
            <div className="text-white">
              <h1 className="text-xl font-bold">CONSTRUCTION QUOTE</h1>
              <p className="text-sm opacity-80">({business?.name || "Company Name"})</p>
            </div>
          </div>
        </div>

        {/* Company Details - Form style */}
        <div data-pdf-section="client-info" className="page-break-avoid">
          <div className="mb-4 px-4 py-3 border-b border-gray-200">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Company Address:</span>
                <span className="text-sm text-gray-700">{business?.address || "123 Business Street"}</span>
              </div>
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Contact Number:</span>
                <span className="text-sm text-gray-700">{business?.phone || "0400 000 000"}</span>
              </div>
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Email Address:</span>
                <span className="text-sm text-gray-700">{business?.email || "email@company.com"}</span>
              </div>
              {business?.abn && (
                <div className="flex">
                  <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>ABN:</span>
                  <span className="text-sm text-gray-700">{business.abn}</span>
                </div>
              )}
            </div>
          </div>

          {/* TO Section - Client Details */}
          <div className="mb-6 px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>TO:</h3>
            <div className="space-y-1">
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Owner Name:</span>
                <span className="text-sm text-gray-700">{estimate.client_name}</span>
              </div>
              {estimate.company_name && (
                <div className="flex">
                  <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Company:</span>
                  <span className="text-sm text-gray-700">{estimate.company_name}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Address:</span>
                <span className="text-sm text-gray-700">{estimate.site_address}</span>
              </div>
              {estimate.client_phone && (
                <div className="flex">
                  <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Contact Number:</span>
                  <span className="text-sm text-gray-700">{estimate.client_phone}</span>
                </div>
              )}
              {estimate.client_email && (
                <div className="flex">
                  <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Email Address:</span>
                  <span className="text-sm text-gray-700">{estimate.client_email}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Date:</span>
                <span className="text-sm text-gray-700">{format(new Date(estimate.created_at), "d MMMM yyyy")}</span>
              </div>
              <div className="flex">
                <span className="w-40 text-sm font-semibold" style={{ color: primaryColor }}>Quote Number:</span>
                <span className="text-sm text-gray-700">{estimate.estimate_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        <div data-pdf-section="project-summary" className="px-4">
          <ProjectSummarySection 
            data={quotePDFData} 
            primaryColor={primaryColor} 
            secondaryColor={secondaryColor}
            template="classic"
          />
        </div>

        {/* Scope of Works as Line Items - above totals */}
        <div data-pdf-section="scope-breakdown" className="px-4">
          {quotePDFData.scopeBreakdowns.length > 0 ? (
            <ScopeLineItemsSection 
              data={quotePDFData} 
              primaryColor={primaryColor} 
              secondaryColor={secondaryColor}
              template="classic"
              formatCurrency={formatCurrency}
              totalAmount={estimate.total_amount}
            />
          ) : parsedNotes.scopeBreakdownFromNotes.length > 0 ? (
            <NotesBasedScopeBreakdown 
              items={parsedNotes.scopeBreakdownFromNotes}
              template="classic"
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          ) : null}
        </div>

        {/* Material Description Table with Tax column */}
        {parsedItems.length > 0 && (
          <div className="page-break-avoid mb-6 px-4">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
                  <th className="text-left py-3 px-4 text-sm font-bold">Material Description</th>
                  <th className="text-right py-3 px-4 text-sm font-bold w-28">Cost</th>
                  <th className="text-center py-3 px-4 text-sm font-bold w-20">Tax</th>
                  <th className="text-right py-3 px-4 text-sm font-bold w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.total / 1.1)}</td>
                    <td className="py-3 px-4 text-sm text-center">10%</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr style={{ backgroundColor: primaryColor, color: "white" }}>
                  <td className="py-3 px-4 text-sm font-bold" colSpan={3}>GRAND TOTAL</td>
                  <td className="py-3 px-4 text-lg text-right font-bold">{formatCurrency(estimate.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* If no line items, show total separately */}
        {parsedItems.length === 0 && (
          <div data-pdf-section="totals" className="page-break-avoid flex justify-end mb-8 px-4">
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
                <div 
                  className="flex justify-between items-center pt-3 text-white"
                  style={{ backgroundColor: primaryColor, margin: "-4px", padding: "12px", borderRadius: "4px" }}
                >
                  <span className="text-base font-bold">GRAND TOTAL</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(estimate.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dual Signature/Date Row */}
        <div data-pdf-section="page-1-footer" className="page-break-avoid px-4 py-6 border-t border-gray-200">
          <div className="flex justify-between items-end">
            <div className="flex-1">
              <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
              <p className="text-sm text-gray-500">(Signature)</p>
            </div>
            <div className="flex-1 text-right">
              <div className="w-48 border-b-2 border-gray-400 mb-2 ml-auto"></div>
              <p className="text-sm text-gray-500">(Date)</p>
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
