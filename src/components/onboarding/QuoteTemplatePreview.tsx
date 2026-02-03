import { Building2 } from "lucide-react";

interface QuoteTemplatePreviewProps {
  template: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logoUrl: string | null;
  businessName?: string;
}

export function QuoteTemplatePreview({
  template,
  primaryColor,
  secondaryColor,
  font,
  logoUrl,
  businessName = "Your Business",
}: QuoteTemplatePreviewProps) {
  const fontFamily = `${font}, sans-serif`;

  // Minimal Template - Clean & spacious (Image 2 inspired)
  if (template === "minimal") {
    return (
      <div
        className="w-full rounded-lg border shadow-sm overflow-hidden bg-white p-3 text-[6px]"
        style={{ fontFamily }}
      >
        {/* Header - Company left, Logo right */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-gray-900 text-[7px]">{businessName}</p>
            <p className="text-gray-500 text-[5px]">123 Company Street</p>
            <p className="text-gray-500 text-[5px]">Sydney NSW 2000</p>
          </div>
          <div className="flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
            ) : (
              <div 
                className="h-6 w-10 rounded flex items-center justify-center border-2 border-dashed"
                style={{ borderColor: secondaryColor }}
              >
                <p className="text-[4px] text-gray-400">Upload Logo</p>
              </div>
            )}
          </div>
        </div>

        {/* Large centered title */}
        <div className="text-center my-3">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: secondaryColor }}>CONCRETE</p>
          <p className="text-[10px] font-bold tracking-widest" style={{ color: secondaryColor }}>ESTIMATE</p>
        </div>

        {/* Bill To and Estimate Meta */}
        <div className="flex justify-between mb-2">
          <div>
            <p className="text-gray-400 uppercase text-[5px] mb-0.5">Bill To</p>
            <p className="font-medium text-gray-900">Customer Name</p>
            <p className="text-gray-500">123 Customer St</p>
            <p className="text-gray-500">Sydney NSW 2000</p>
          </div>
          <div className="text-right text-[5px]">
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Estimate #</span>
              <span className="font-medium text-gray-900">0001</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Estimate Date</span>
              <span className="text-gray-900">11-04</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Due Date</span>
              <span className="text-gray-900">25-04</span>
            </div>
          </div>
        </div>

        {/* Simple table */}
        <table className="w-full mb-2 text-[5px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${secondaryColor}` }}>
              <th className="text-left py-0.5 font-normal text-gray-400 uppercase">Qty</th>
              <th className="text-left py-0.5 font-normal text-gray-400 uppercase">Description</th>
              <th className="text-right py-0.5 font-normal text-gray-400 uppercase">Unit</th>
              <th className="text-right py-0.5 font-normal text-gray-400 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td className="py-0.5">1</td>
              <td className="py-0.5">Site Preparation</td>
              <td className="py-0.5 text-right">$1,500</td>
              <td className="py-0.5 text-right">$1,500</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td className="py-0.5">18</td>
              <td className="py-0.5">Concrete (m³)</td>
              <td className="py-0.5 text-right">$120</td>
              <td className="py-0.5 text-right">$2,160</td>
            </tr>
          </tbody>
        </table>

        {/* Right-aligned totals */}
        <div className="flex justify-end mb-2">
          <div className="w-20 text-[5px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span>$11,364</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">GST (10%)</span>
              <span>$1,136</span>
            </div>
            <div 
              className="flex justify-between font-bold pt-0.5 mt-0.5"
              style={{ borderTop: `1px solid ${primaryColor}` }}
            >
              <span>Total</span>
              <span style={{ color: primaryColor }}>$12,500</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mb-2">
          <p className="text-gray-400 uppercase text-[5px] mb-0.5">Terms & Conditions</p>
          <p className="text-gray-500 text-[5px]">Payment due in 14 days</p>
        </div>

        {/* Signature line */}
        <div className="flex justify-end">
          <div className="text-center">
            <div className="w-20 border-b border-gray-400 mb-0.5"></div>
            <p className="text-gray-400 text-[5px]">Customer Signature</p>
          </div>
        </div>
      </div>
    );
  }

  // Classic Template - Form-style layout (Image 3 inspired)
  return (
    <div
      className="w-full rounded-lg border shadow-sm overflow-hidden bg-white text-[6px]"
      style={{ fontFamily }}
    >
      {/* Header with title */}
      <div 
        className="px-2 py-1.5"
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-5 w-5 object-contain bg-white rounded p-0.5" />
          ) : (
            <div className="h-5 w-5 bg-white/20 rounded flex items-center justify-center">
              <Building2 className="w-3 h-3 text-white/70" />
            </div>
          )}
          <div className="text-white">
            <p className="font-bold text-[7px]">CONSTRUCTION QUOTE</p>
            <p className="text-[5px] opacity-80">({businessName})</p>
          </div>
        </div>
      </div>

      {/* Company Details - Form style */}
      <div className="px-2 py-1 border-b border-gray-200">
        <div className="space-y-0.5 text-[5px]">
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Company Address:</span>
            <span className="text-gray-700">123 Business Street</span>
          </div>
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Contact Number:</span>
            <span className="text-gray-700">0400 000 000</span>
          </div>
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Email Address:</span>
            <span className="text-gray-700">email@company.com</span>
          </div>
        </div>
      </div>

      {/* TO Section */}
      <div className="px-2 py-1 border-b border-gray-200">
        <p className="font-bold text-[6px] mb-0.5" style={{ color: secondaryColor }}>TO:</p>
        <div className="space-y-0.5 text-[5px]">
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Owner Name:</span>
            <span className="text-gray-700">John Smith</span>
          </div>
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Address:</span>
            <span className="text-gray-700">123 Example Street</span>
          </div>
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Date:</span>
            <span className="text-gray-700">10 Jan 2026</span>
          </div>
          <div className="flex">
            <span className="w-20 font-semibold" style={{ color: primaryColor }}>Quote Number:</span>
            <span className="text-gray-700">Q-0001</span>
          </div>
        </div>
      </div>

      {/* Material Table */}
      <div className="px-2 py-1">
        <table className="w-full text-[5px]">
          <thead>
            <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
              <th className="text-left py-0.5 px-1 font-bold">Material Description</th>
              <th className="text-right py-0.5 px-1 font-bold">Cost</th>
              <th className="text-center py-0.5 px-1 font-bold">Tax</th>
              <th className="text-right py-0.5 px-1 font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td className="py-0.5 px-1">Site Preparation</td>
              <td className="py-0.5 px-1 text-right">$1,500</td>
              <td className="py-0.5 px-1 text-center">10%</td>
              <td className="py-0.5 px-1 text-right">$1,650</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td className="py-0.5 px-1">Concrete Supply</td>
              <td className="py-0.5 px-1 text-right">$2,000</td>
              <td className="py-0.5 px-1 text-center">10%</td>
              <td className="py-0.5 px-1 text-right">$2,200</td>
            </tr>
            <tr style={{ backgroundColor: primaryColor, color: "white" }}>
              <td className="py-0.5 px-1 font-bold" colSpan={3}>GRAND TOTAL</td>
              <td className="py-0.5 px-1 text-right font-bold">$12,500</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Row */}
      <div className="px-2 py-1.5 border-t border-gray-200">
        <div className="flex justify-between items-end text-[5px]">
          <div className="flex-1">
            <div className="w-full border-b border-gray-400 mb-0.5" style={{ maxWidth: "60px" }}></div>
            <p className="text-gray-500">(Signature)</p>
          </div>
          <div className="flex-1 text-right">
            <div className="w-full border-b border-gray-400 mb-0.5 ml-auto" style={{ maxWidth: "60px" }}></div>
            <p className="text-gray-500">(Date)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
