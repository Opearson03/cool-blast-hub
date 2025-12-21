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
            <h2 className="text-lg font-bold">INSPECTION & TEST PLAN</h2>
            <p className="text-sm text-gray-600">
              Date: {format(new Date(itp.created_at!), "d MMM yyyy")}
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

        {/* Checklist Items with Photos - Each item gets its own section */}
        {checklistData.map((item, index) => (
          <div 
            key={item.id} 
            className="mb-8 border border-gray-300 rounded-lg overflow-hidden"
            style={{ pageBreakInside: item.photo_url ? "avoid" : "auto" }}
          >
            {/* Item Header */}
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center gap-3">
              <span className="font-bold text-lg">#{index + 1}</span>
              <span className="flex-1 font-medium">
                {item.item}
                {item.required && <span className="text-red-600 ml-1">*</span>}
              </span>
              <span className={`font-bold text-lg ${item.checked ? "text-green-600" : "text-gray-400"}`}>
                {item.checked ? "✓ PASS" : "○ PENDING"}
              </span>
            </div>

            {/* Item Content */}
            <div className="p-4">
              {/* Comment */}
              {item.comment && (
                <div className="mb-4">
                  <p className="font-semibold text-sm text-gray-600 mb-1">Comments:</p>
                  <p className="text-sm bg-gray-50 p-2 rounded border border-gray-200">{item.comment}</p>
                </div>
              )}

              {/* Photo - Large size for printing (half page) */}
              {item.photo_url && (
                <div className="mt-2">
                  <p className="font-semibold text-sm text-gray-600 mb-2">Photo Evidence:</p>
                  <img
                    src={item.photo_url}
                    alt={`Photo for ${item.item}`}
                    className="w-full max-h-[45vh] object-contain border border-gray-300 rounded"
                    style={{ 
                      maxWidth: "100%",
                      height: "auto",
                      minHeight: "200px",
                      maxHeight: "45vh"
                    }}
                  />
                </div>
              )}

              {/* No photo placeholder */}
              {!item.photo_url && !item.comment && (
                <p className="text-sm text-gray-400 italic">No comments or photos</p>
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="text-sm mb-6 p-4 bg-gray-100 rounded border border-gray-300">
          <p>
            <strong>Completion:</strong> {completedCount}/{checklistData.length} items checked
          </p>
        </div>

        {/* Notes */}
        {itp.notes && (
          <div className="mb-6 text-sm">
            <p className="font-semibold mb-1">Additional Notes:</p>
            <p className="border border-gray-300 p-3 min-h-[40px] bg-gray-50 rounded">{itp.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8 border-t-2 border-black pt-6">
          <div>
            <p className="font-semibold mb-2">Employee Signature:</p>
            {itp.employee_signature ? (
              <div className="border border-gray-300 rounded p-2 bg-green-50">
                <img
                  src={itp.employee_signature}
                  alt="Employee signature"
                  className="h-20 mx-auto"
                />
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Signed: {itp.employee_signed_at && format(new Date(itp.employee_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-24 border border-gray-300 rounded flex items-center justify-center text-gray-400">
                Not signed
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold mb-2">Site Supervisor Signature:</p>
            {itp.supervisor_signature ? (
              <div className="border border-gray-300 rounded p-2 bg-green-50">
                <img
                  src={itp.supervisor_signature}
                  alt="Supervisor signature"
                  className="h-20 mx-auto"
                />
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Signed: {itp.supervisor_signed_at && format(new Date(itp.supervisor_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-24 border border-gray-300 rounded flex items-center justify-center text-gray-400">
                Not signed
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableITP.displayName = "PrintableITP";
