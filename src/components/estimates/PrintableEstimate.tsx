import { forwardRef } from "react";
import { format } from "date-fns";

interface EstimateLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface PrintableEstimateProps {
  estimate: {
    estimate_number: string;
    client_name: string;
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
  } | null;
  lineItems?: EstimateLineItem[];
}

export const PrintableEstimate = forwardRef<HTMLDivElement, PrintableEstimateProps>(
  ({ estimate, business, lineItems = [] }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Parse description to extract calculated items if no line items provided
    const parsedItems: EstimateLineItem[] = lineItems.length > 0 ? lineItems : [];
    
    // If no line items, try to show description-based summary
    const descriptionParts = estimate.description?.split(" | ") || [];

    return (
      <div
        ref={ref}
        className="print-container bg-white text-black"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm 20mm;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-container {
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 0;
            }
            
            .no-print {
              display: none !important;
            }
            
            .page-break-avoid {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        `}</style>

        {/* Header with Logo */}
        <div className="page-break-avoid flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-start gap-4">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt="Company logo"
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded">
                Logo
              </div>
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
            <h2 className="text-2xl font-bold text-gray-900">ESTIMATE</h2>
            <p className="text-lg font-semibold text-primary mt-1">{estimate.estimate_number}</p>
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
            {estimate.client_email && <p className="text-sm text-gray-600">{estimate.client_email}</p>}
            {estimate.client_phone && <p className="text-sm text-gray-600">{estimate.client_phone}</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Site Address</h3>
            <p className="text-gray-900">{estimate.site_address}</p>
          </div>
        </div>

        {/* Description / Scope */}
        {descriptionParts.length > 0 && (
          <div className="page-break-avoid mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Scope of Works</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ul className="space-y-1">
                {descriptionParts.map((part, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-primary">•</span>
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
                <tr className="bg-gray-800 text-white">
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
          <div className="w-64">
            <div className="border-t-2 border-gray-800 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total (inc GST)</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(estimate.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

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
            I accept this estimate and authorize the commencement of works as described above.
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
