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
        className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-6"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt="Company logo"
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                Logo
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{business?.name || "Company Name"}</h1>
              {business?.abn && <p className="text-sm">ABN: {business.abn}</p>}
              {business?.address && <p className="text-sm">{business.address}</p>}
              {business?.phone && <p className="text-sm">Ph: {business.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">SAFE WORK METHOD STATEMENT</h2>
            <p className="text-sm text-gray-600">
              Date: {format(new Date(swms.created_at!), "d MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
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
          <div className="mb-6 text-sm">
            <p className="font-semibold mb-1">Scope of Work:</p>
            <p className="border border-gray-300 p-2">{content.scope}</p>
          </div>
        )}

        {/* PPE Required */}
        {ppeRequired.length > 0 && (
          <div className="mb-6 text-sm">
            <p className="font-semibold mb-2">Personal Protective Equipment (PPE) Required:</p>
            <div className="flex flex-wrap gap-2">
              {ppeRequired.map((ppe: string, i: number) => (
                <span key={i} className="border border-gray-400 px-2 py-1 text-xs">
                  {ppe}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hazards Table */}
        <div className="mb-6">
          <p className="font-semibold mb-2 text-sm">Hazard Identification & Risk Control:</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left w-1/4">Hazard</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-16">Risk</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Control Measures</th>
              </tr>
            </thead>
            <tbody>
              {hazards.map((hazard, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">
                    {hazard.hazard}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium ${
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
                  <td className="border border-gray-300 px-3 py-2">
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
        <div className="mb-6">
          <p className="font-semibold mb-2 text-sm">Worker Sign-off:</p>
          <p className="text-xs text-gray-600 mb-2">
            I have read and understood this SWMS. I agree to follow the safe work procedures
            and use the required PPE.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left w-32">Date/Time</th>
                <th className="border border-gray-300 px-3 py-2 text-left w-40">Signature</th>
              </tr>
            </thead>
            <tbody>
              {signoffs.map((signoff) => (
                <tr key={signoff.id}>
                  <td className="border border-gray-300 px-3 py-2">
                    {signoff.employee_name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs">
                    {signoff.signed_at && format(new Date(signoff.signed_at), "d MMM yyyy, HH:mm")}
                  </td>
                  <td className="border border-gray-300 px-1 py-1">
                    {signoff.signature_data && (
                      <img
                        src={signoff.signature_data}
                        alt="Signature"
                        className="h-10 object-contain"
                      />
                    )}
                  </td>
                </tr>
              ))}
              {/* Empty rows for additional signatures */}
              {signoffs.length < 5 &&
                Array.from({ length: 5 - signoffs.length }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-300 px-3 py-4" />
                    <td className="border border-gray-300 px-3 py-4" />
                    <td className="border border-gray-300 px-3 py-4" />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableSWMS.displayName = "PrintableSWMS";
