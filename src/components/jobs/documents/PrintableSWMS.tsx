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
        className="print-container bg-white text-black"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 12mm 15mm;
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
            
            .print-header {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .hazard-row {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .signoff-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .print-footer {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 15px;
              font-size: 11px;
            }
          }
        `}</style>

        {/* Header */}
        <div className="print-header flex items-start justify-between border-b-2 border-black pb-3 mb-4">
          <div className="flex items-center gap-3">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt="Company logo"
                className="h-12 w-12 object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-gray-500 text-[10px]">
                Logo
              </div>
            )}
            <div>
              <h1 className="text-base font-bold">{business?.name || "Company Name"}</h1>
              {business?.abn && <p className="text-[10px]">ABN: {business.abn}</p>}
              {business?.address && <p className="text-[10px]">{business.address}</p>}
              {business?.phone && <p className="text-[10px]">Ph: {business.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold">SAFE WORK METHOD STATEMENT</h2>
            <p className="text-[10px] text-gray-600">
              Date: {format(new Date(swms.created_at!), "d MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
          <div>
            <p className="font-semibold">Job Name:</p>
            <p>{jobName}</p>
          </div>
          <div>
            <p className="font-semibold">SWMS Title:</p>
            <p>{swms.name}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold">Site Address:</p>
            <p>{jobAddress}</p>
          </div>
        </div>

        {/* Scope of Work */}
        {content?.scope && (
          <div className="mb-4 text-[11px]">
            <p className="font-semibold mb-1">Scope of Work:</p>
            <p className="border border-gray-300 p-2">{content.scope}</p>
          </div>
        )}

        {/* PPE Required */}
        {ppeRequired.length > 0 && (
          <div className="mb-4 text-[11px]">
            <p className="font-semibold mb-1">Personal Protective Equipment (PPE) Required:</p>
            <div className="flex flex-wrap gap-1">
              {ppeRequired.map((ppe: string, i: number) => (
                <span key={i} className="border border-gray-400 px-1.5 py-0.5 text-[10px]">
                  {ppe}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hazards Table */}
        <div className="mb-4">
          <p className="font-semibold mb-1 text-[11px]">Hazard Identification & Risk Control:</p>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left w-1/4">Hazard</th>
                <th className="border border-gray-300 px-2 py-1 text-center w-14">Risk</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Control Measures</th>
              </tr>
            </thead>
            <tbody>
              {hazards.map((hazard, index) => (
                <tr key={index} className="hazard-row">
                  <td className="border border-gray-300 px-2 py-1 font-medium">
                    {hazard.hazard}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <span
                      className={`px-1 py-0.5 text-[9px] font-medium ${
                        hazard.risk === "High"
                          ? "bg-red-100 text-red-800"
                          : hazard.risk === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {hazard.risk}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <ul className="list-disc list-inside">
                      {(hazard.controls || []).map((control, j) => (
                        <li key={j}>{control}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Worker Sign-off Section */}
        <div className="signoff-section mb-4">
          <p className="font-semibold mb-1 text-[11px]">Worker Sign-off:</p>
          <p className="text-[9px] text-gray-600 mb-1">
            I have read and understood this SWMS. I agree to follow the safe work procedures
            and use the required PPE.
          </p>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">Name</th>
                <th className="border border-gray-300 px-2 py-1 text-left w-28">Date/Time</th>
                <th className="border border-gray-300 px-2 py-1 text-left w-32">Signature</th>
              </tr>
            </thead>
            <tbody>
              {signoffs.map((signoff) => (
                <tr key={signoff.id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {signoff.employee_name}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-[9px]">
                    {signoff.signed_at && format(new Date(signoff.signed_at), "d MMM yyyy, HH:mm")}
                  </td>
                  <td className="border border-gray-300 px-1 py-0.5">
                    {signoff.signature_data && (
                      <img
                        src={signoff.signature_data}
                        alt="Signature"
                        className="h-8 object-contain"
                      />
                    )}
                  </td>
                </tr>
              ))}
              {/* Empty rows for additional signatures */}
              {signoffs.length < 4 &&
                Array.from({ length: 4 - signoffs.length }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-300 px-2 py-3" />
                    <td className="border border-gray-300 px-2 py-3" />
                    <td className="border border-gray-300 px-2 py-3" />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="print-footer mt-4 pt-2 border-t border-gray-300 text-[9px] text-gray-500 text-center">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableSWMS.displayName = "PrintableSWMS";
