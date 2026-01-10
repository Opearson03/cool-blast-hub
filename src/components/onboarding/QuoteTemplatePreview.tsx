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

  if (template === "modern") {
    return (
      <div
        className="w-full rounded-lg border shadow-sm overflow-hidden bg-white text-[6px]"
        style={{ fontFamily }}
      >
        {/* Header bar */}
        <div style={{ backgroundColor: secondaryColor, padding: "8px" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-6 w-6 object-contain bg-white rounded p-0.5"
                />
              ) : (
                <div className="h-6 w-6 bg-white/20 rounded flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white/70" />
                </div>
              )}
              <div className="text-white">
                <p className="font-bold text-[7px]">{businessName}</p>
                <p className="opacity-70 text-[5px]">ABN: XX XXX XXX XXX</p>
              </div>
            </div>
            <div className="text-white text-right">
              <p className="font-black text-[9px] tracking-tight">QUOTE</p>
              <p className="font-bold text-[6px]" style={{ color: primaryColor }}>
                #Q-0001
              </p>
            </div>
          </div>
        </div>

        {/* Contact strip */}
        <div
          className="px-2 py-1 flex justify-between text-gray-600"
          style={{ borderBottom: `2px solid ${primaryColor}` }}
        >
          <span>📞 0400 000 000</span>
          <span>Date: 10 Jan 2026</span>
        </div>

        {/* Two column cards */}
        <div className="grid grid-cols-2 gap-2 p-2">
          <div
            className="p-1.5 rounded"
            style={{ backgroundColor: "#f9fafb", borderLeft: `2px solid ${primaryColor}` }}
          >
            <p className="font-bold uppercase text-[5px]" style={{ color: primaryColor }}>
              Client
            </p>
            <p className="font-bold text-gray-900">John Smith</p>
            <p className="text-gray-600">john@email.com</p>
          </div>
          <div
            className="p-1.5 rounded"
            style={{ backgroundColor: "#f9fafb", borderLeft: `2px solid ${secondaryColor}` }}
          >
            <p className="font-bold uppercase text-[5px]" style={{ color: secondaryColor }}>
              Site
            </p>
            <p className="text-gray-900">123 Example Street</p>
            <p className="text-gray-600">Sydney NSW 2000</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-1 px-2 pb-1">
          {["18.5 m³", "120 m²", "150mm"].map((val, i) => (
            <div
              key={i}
              className="p-1 rounded"
              style={{ backgroundColor: "#f9fafb", borderLeft: `2px solid ${primaryColor}` }}
            >
              <p className="text-gray-500 text-[5px] uppercase">
                {i === 0 ? "Volume" : i === 1 ? "Area" : "Depth"}
              </p>
              <p className="font-bold text-gray-900">{val}</p>
            </div>
          ))}
        </div>

        {/* Total bar */}
        <div
          className="mx-2 mb-2 p-1.5 rounded text-white flex justify-between items-center"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="font-bold">Total (inc GST)</span>
          <span className="font-black text-[8px]">$12,500.00</span>
        </div>
      </div>
    );
  }

  if (template === "minimal") {
    return (
      <div
        className="w-full rounded-lg border shadow-sm overflow-hidden bg-white p-3 text-[6px]"
        style={{ fontFamily }}
      >
        {/* Header - simple and clean */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-5 w-5 object-contain" />
            ) : (
              <div className="h-5 w-5 bg-gray-100 rounded flex items-center justify-center">
                <Building2 className="w-3 h-3 text-gray-400" />
              </div>
            )}
            <span className="font-medium text-gray-900 text-[7px]">{businessName}</span>
          </div>
          <div className="text-right">
            <p className="uppercase tracking-widest text-gray-400 text-[5px]">Quote</p>
            <p className="font-medium text-gray-900">#Q-0001</p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${secondaryColor}` }} className="pt-2 mb-2">
          <p className="text-gray-500 uppercase tracking-wider text-[5px] mb-1">Prepared for</p>
          <p className="font-medium text-gray-900">John Smith</p>
          <p className="text-gray-600">123 Example Street, Sydney</p>
        </div>

        {/* Inline summary */}
        <div className="flex gap-4 mb-2 text-gray-600">
          <span>Volume: <span className="font-medium text-gray-900">18.5 m³</span></span>
          <span>Area: <span className="font-medium text-gray-900">120 m²</span></span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${primaryColor}` }}>
          <span className="uppercase tracking-wider text-gray-400 text-[5px]">Total (inc GST)</span>
          <span className="font-bold text-gray-900 text-[9px]">$12,500.00</span>
        </div>
      </div>
    );
  }

  // Classic template (default)
  return (
    <div
      className="w-full rounded-lg border shadow-sm overflow-hidden bg-white p-2 text-[6px]"
      style={{ fontFamily }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 pb-2" style={{ borderBottom: `1px solid #e5e7eb` }}>
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
          ) : (
            <div className="h-6 w-6 bg-gray-100 rounded flex items-center justify-center">
              <Building2 className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-[7px]">{businessName}</p>
            <p className="text-gray-500">ABN: XX XXX XXX XXX</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-[8px]" style={{ color: primaryColor }}>
            QUOTE
          </p>
          <p className="text-gray-600">#Q-0001</p>
          <p className="text-gray-500">10 Jan 2026</p>
        </div>
      </div>

      {/* Client info */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <p className="text-gray-500 uppercase text-[5px] mb-0.5">Bill To</p>
          <p className="font-semibold text-gray-900">John Smith</p>
          <p className="text-gray-600">john@email.com</p>
        </div>
        <div>
          <p className="text-gray-500 uppercase text-[5px] mb-0.5">Site Address</p>
          <p className="text-gray-900">123 Example Street</p>
          <p className="text-gray-600">Sydney NSW 2000</p>
        </div>
      </div>

      {/* Summary box */}
      <div className="bg-gray-50 border border-gray-200 rounded p-1.5 mb-2">
        <p className="text-gray-500 uppercase text-[5px] mb-1">Project Summary</p>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "Volume", value: "18.5 m³" },
            { label: "Area", value: "120 m²" },
            { label: "Depth", value: "150mm" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-gray-500 text-[5px]">{item.label}</p>
              <p className="font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div
        className="rounded p-1.5 flex justify-between items-center text-white"
        style={{ backgroundColor: secondaryColor }}
      >
        <span className="font-semibold">Total (inc GST)</span>
        <span className="font-bold text-[8px]" style={{ color: primaryColor }}>
          $12,500.00
        </span>
      </div>
    </div>
  );
}
