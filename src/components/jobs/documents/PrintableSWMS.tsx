import { forwardRef } from "react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type JobSWMS = Tables<"job_swms">;
type SWMSSignoff = Tables<"swms_signoffs">;

interface Hazard {
  hazard: string;
  risk: string;
  controls: string[];
}

interface PrintableSWMSProps {
  swms: JobSWMS;
  signoffs: SWMSSignoff[];
  jobName: string;
  jobAddress: string;
  business: {
    name: string;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    abn: string | null;
  } | null;
}

export const PrintableSWMS = forwardRef<HTMLDivElement, PrintableSWMSProps>(
  ({ swms, signoffs, jobName, jobAddress, business }, ref) => {
    const content = swms.content as any;
    const hazards = (swms.hazards || content?.hazards || []) as Hazard[];
    const ppeRequired = content?.ppe_required || [];

    return (
      <div
        ref={ref}
        className="print-swms-container bg-white text-black"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .print-swms-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 9pt !important;
              line-height: 1.3 !important;
            }
            
            .swms-header {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 8px;
            }
            
            .swms-section {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 6px;
            }
            
            .hazard-table {
              page-break-inside: auto;
            }
            
            .hazard-row {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .signoff-table {
              page-break-inside: auto;
            }
            
            .signoff-row {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .swms-footer {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 8px;
            }
            
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            
            th, td {
              padding: 4px 6px !important;
            }
            
            img {
              max-width: 100% !important;
              height: auto !important;
            }
            
            .signature-img {
              max-height: 28px !important;
              width: auto !important;
              object-fit: contain !important;
            }
          }
          
          @media screen {
            .print-swms-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
              font-size: 11px;
              background: white;
            }
          }
        `}</style>

        {/* Header */}
        <div className="swms-header flex items-start justify-between border-b-2 border-black pb-2 mb-3">
          <div className="flex items-center gap-2">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt="Company logo"
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 flex items-center justify-center text-gray-500 text-[9px]">
                Logo
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold leading-tight">{business?.name || "Company Name"}</h1>
              {business?.abn && <p className="text-[9px] leading-tight">ABN: {business.abn}</p>}
              {business?.address && <p className="text-[9px] leading-tight">{business.address}</p>}
              {business?.phone && <p className="text-[9px] leading-tight">Ph: {business.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xs font-bold">SAFE WORK METHOD STATEMENT</h2>
            <p className="text-[9px] text-gray-600">
              Date: {format(new Date(swms.created_at!), "d MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <div className="swms-section grid grid-cols-2 gap-1 mb-3 text-[10px]">
          <div>
            <span className="font-semibold">Job: </span>
            <span>{jobName}</span>
          </div>
          <div>
            <span className="font-semibold">SWMS: </span>
            <span>{swms.name}</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Site: </span>
            <span>{jobAddress}</span>
          </div>
        </div>

        {/* Scope of Work */}
        {content?.scope && (
          <div className="swms-section mb-3 text-[10px]">
            <p className="font-semibold mb-0.5">Scope of Work:</p>
            <p className="border border-gray-300 p-1.5 text-[9px]">{content.scope}</p>
          </div>
        )}

        {/* PPE Required */}
        {ppeRequired.length > 0 && (
          <div className="swms-section mb-3 text-[10px]">
            <p className="font-semibold mb-0.5">PPE Required:</p>
            <div className="flex flex-wrap gap-1">
              {ppeRequired.map((ppe: string, i: number) => (
                <span key={i} className="border border-gray-400 px-1.5 py-0.5 text-[9px]">
                  {ppe}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hazards Table */}
        <div className="mb-3">
          <p className="font-semibold mb-1 text-[10px]">Hazard Identification & Risk Control:</p>
          <table className="hazard-table w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-1.5 py-1 text-left" style={{ width: "22%" }}>Hazard</th>
                <th className="border border-gray-400 px-1.5 py-1 text-center" style={{ width: "10%" }}>Risk</th>
                <th className="border border-gray-400 px-1.5 py-1 text-left">Control Measures</th>
              </tr>
            </thead>
            <tbody>
              {hazards.map((hazard, index) => (
                <tr key={index} className="hazard-row">
                  <td className="border border-gray-400 px-1.5 py-1 font-medium align-top">
                    {hazard.hazard}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-center align-top">
                    <span
                      className={`px-1 py-0.5 text-[8px] font-bold ${
                        hazard.risk === "High"
                          ? "bg-red-200 text-red-800"
                          : hazard.risk === "Medium"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {hazard.risk}
                    </span>
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 align-top">
                    <ul className="list-disc list-inside m-0 p-0">
                      {(hazard.controls || []).map((control, j) => (
                        <li key={j} className="leading-tight">{control}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Worker Sign-off Section */}
        <div className="mb-3">
          <p className="font-semibold mb-1 text-[10px]">Worker Sign-off:</p>
          <p className="text-[8px] text-gray-600 mb-1">
            I have read and understood this SWMS. I agree to follow the safe work procedures and use the required PPE.
          </p>
          <table className="signoff-table w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-1.5 py-1 text-left" style={{ width: "35%" }}>Name</th>
                <th className="border border-gray-400 px-1.5 py-1 text-left" style={{ width: "25%" }}>Date/Time</th>
                <th className="border border-gray-400 px-1.5 py-1 text-left" style={{ width: "40%" }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {signoffs.map((signoff) => (
                <tr key={signoff.id} className="signoff-row">
                  <td className="border border-gray-400 px-1.5 py-1">
                    {signoff.employee_name}
                  </td>
                  <td className="border border-gray-400 px-1.5 py-1 text-[8px]">
                    {signoff.signed_at && format(new Date(signoff.signed_at), "d MMM yyyy, HH:mm")}
                  </td>
                  <td className="border border-gray-400 px-1 py-0.5">
                    {signoff.signature_data ? (
                      <img
                        src={signoff.signature_data}
                        alt={`Signature of ${signoff.employee_name}`}
                        className="signature-img h-7 object-contain"
                      />
                    ) : (
                      <span className="text-[8px] text-gray-400 italic">No signature</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Empty rows for additional signatures if needed */}
              {signoffs.length < 6 &&
                Array.from({ length: Math.min(3, 6 - signoffs.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="signoff-row">
                    <td className="border border-gray-400 px-1.5 py-2.5" />
                    <td className="border border-gray-400 px-1.5 py-2.5" />
                    <td className="border border-gray-400 px-1.5 py-2.5" />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="swms-footer pt-2 border-t border-gray-300 text-[8px] text-gray-500 text-center">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableSWMS.displayName = "PrintableSWMS";
