import { forwardRef } from "react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type JobITP = Tables<"job_itps">;

interface ChecklistItem {
  id: number;
  item: string;
  required: boolean;
  checked: boolean;
  comment: string;
  photo_url: string | null;
}

interface PrintableITPProps {
  itp: JobITP;
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

export const PrintableITP = forwardRef<HTMLDivElement, PrintableITPProps>(
  ({ itp, jobName, jobAddress, business }, ref) => {
    const checklistData = (itp.checklist_data || []) as unknown as ChecklistItem[];
    const completedCount = checklistData.filter((item) => item.checked).length;

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
              margin: 15mm;
            }
            .print-container {
              width: 210mm;
              max-width: 210mm;
              margin: 0 auto;
            }
            .page-break-before {
              page-break-before: always;
            }
            .avoid-break {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 15mm;
            }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-6 avoid-break">
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
            <h2 className="text-lg font-bold">INSPECTION & TEST PLAN</h2>
            <p className="text-sm text-gray-600">
              Date: {format(new Date(itp.created_at!), "d MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm avoid-break">
          <div>
            <p className="font-semibold">Job Name:</p>
            <p>{jobName}</p>
          </div>
          <div>
            <p className="font-semibold">ITP Type:</p>
            <p className="capitalize">{itp.itp_type.replace("_", " ")}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold">Site Address:</p>
            <p>{jobAddress}</p>
          </div>
          <div>
            <p className="font-semibold">ITP Name:</p>
            <p>{itp.name}</p>
          </div>
          <div>
            <p className="font-semibold">Status:</p>
            <p className="capitalize">{itp.status}</p>
          </div>
        </div>

        {/* Checklist Table */}
        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left w-12">#</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Inspection Item</th>
              <th className="border border-gray-300 px-3 py-2 text-center w-16">Pass</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Comments</th>
            </tr>
          </thead>
          <tbody>
            {checklistData.map((item, index) => (
              <tr key={item.id} className="avoid-break">
                <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {item.item}
                  {item.required && <span className="text-red-600 ml-1">*</span>}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {item.checked ? "✓" : "○"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {item.comment || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-sm mb-6 avoid-break">
          <p>
            <strong>Completion:</strong> {completedCount}/{checklistData.length} items checked
          </p>
        </div>

        {/* Notes */}
        {itp.notes && (
          <div className="mb-6 text-sm avoid-break">
            <p className="font-semibold mb-1">Additional Notes:</p>
            <p className="border border-gray-300 p-2 min-h-[40px]">{itp.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8 avoid-break">
          <div>
            <p className="font-semibold mb-2">Employee Signature:</p>
            {itp.employee_signature ? (
              <div>
                <img
                  src={itp.employee_signature}
                  alt="Employee signature"
                  className="h-16 border-b border-black"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Signed: {itp.employee_signed_at && format(new Date(itp.employee_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-16 border-b border-black" />
            )}
          </div>
          <div>
            <p className="font-semibold mb-2">Supervisor Signature:</p>
            {itp.supervisor_signature ? (
              <div>
                <img
                  src={itp.supervisor_signature}
                  alt="Supervisor signature"
                  className="h-16 border-b border-black"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Signed: {itp.supervisor_signed_at && format(new Date(itp.supervisor_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-16 border-b border-black" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center avoid-break">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableITP.displayName = "PrintableITP";
