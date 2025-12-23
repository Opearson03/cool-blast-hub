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
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 0;
            }
            
            .print-page-break {
              page-break-before: always;
            }
            
            .print-avoid-break {
              page-break-inside: avoid;
            }
            
            .print-header {
              page-break-after: avoid;
            }
            
            .checklist-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .checklist-item-with-photo {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .signature-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            img {
              max-height: 200px !important;
              object-fit: contain;
            }
          }
          
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
          }
        `}</style>

        {/* Header */}
        <div className="print-header flex items-start justify-between border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt="Company logo"
                className="h-12 w-12 object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                Logo
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold">{business?.name || "Company Name"}</h1>
              {business?.abn && <p className="text-xs">ABN: {business.abn}</p>}
              {business?.phone && <p className="text-xs">Ph: {business.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold">INSPECTION & TEST PLAN</h2>
            <p className="text-xs text-gray-600">
              Date: {format(new Date(itp.created_at!), "d MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Job Details - Compact */}
        <div className="print-avoid-break grid grid-cols-2 gap-2 mb-4 text-xs border border-gray-300 p-3 rounded">
          <div>
            <span className="font-semibold">Job: </span>
            <span>{jobName}</span>
          </div>
          <div>
            <span className="font-semibold">ITP Type: </span>
            <span className="capitalize">{itp.itp_type.replace("_", " ")}</span>
          </div>
          <div>
            <span className="font-semibold">Site: </span>
            <span>{jobAddress}</span>
          </div>
          <div>
            <span className="font-semibold">Status: </span>
            <span className="capitalize font-medium">{itp.status}</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold">ITP Name: </span>
            <span>{itp.name}</span>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          {checklistData.map((item, index) => (
            <div 
              key={item.id} 
              className={`border border-gray-300 rounded overflow-hidden ${item.photo_url ? 'checklist-item-with-photo' : 'checklist-item'}`}
            >
              {/* Item Header */}
              <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300 flex items-center gap-2">
                <span className="font-bold text-sm">#{index + 1}</span>
                <span className="flex-1 text-sm">
                  {item.item}
                  {item.required && <span className="text-red-600 ml-1">*</span>}
                </span>
                <span className={`font-bold text-sm ${item.checked ? "text-green-600" : "text-gray-400"}`}>
                  {item.checked ? "✓ PASS" : "○ PENDING"}
                </span>
              </div>

              {/* Item Content */}
              <div className="p-2">
                {item.comment && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-0.5">Comments:</p>
                    <p className="text-xs bg-gray-50 p-1.5 rounded border border-gray-200">{item.comment}</p>
                  </div>
                )}

                {item.photo_url && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Photo Evidence:</p>
                    <img
                      src={item.photo_url}
                      alt={`Photo for ${item.item}`}
                      className="max-w-full h-auto border border-gray-300 rounded"
                      style={{ 
                        maxHeight: "180px",
                        objectFit: "contain"
                      }}
                    />
                  </div>
                )}

                {!item.photo_url && !item.comment && (
                  <p className="text-xs text-gray-400 italic">No comments or photos</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="print-avoid-break text-xs my-4 p-3 bg-gray-100 rounded border border-gray-300">
          <p>
            <strong>Completion:</strong> {completedCount}/{checklistData.length} items checked
            ({checklistData.length > 0 ? Math.round((completedCount / checklistData.length) * 100) : 0}%)
          </p>
        </div>

        {/* Notes */}
        {itp.notes && (
          <div className="print-avoid-break mb-4 text-xs">
            <p className="font-semibold mb-1">Additional Notes:</p>
            <p className="border border-gray-300 p-2 bg-gray-50 rounded">{itp.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="signature-section grid grid-cols-2 gap-6 mt-4 border-t-2 border-black pt-4">
          <div>
            <p className="font-semibold text-sm mb-2">Employee Signature:</p>
            {itp.employee_signature ? (
              <div className="border border-gray-300 rounded p-2 bg-green-50">
                <img
                  src={itp.employee_signature}
                  alt="Employee signature"
                  className="h-16 mx-auto"
                  style={{ maxHeight: "60px" }}
                />
                <p className="text-xs text-gray-600 mt-1 text-center">
                  Signed: {itp.employee_signed_at && format(new Date(itp.employee_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-20 border border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                Not signed
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm mb-2">Site Supervisor Signature:</p>
            {itp.supervisor_signature ? (
              <div className="border border-gray-300 rounded p-2 bg-green-50">
                <img
                  src={itp.supervisor_signature}
                  alt="Supervisor signature"
                  className="h-16 mx-auto"
                  style={{ maxHeight: "60px" }}
                />
                <p className="text-xs text-gray-600 mt-1 text-center">
                  Signed: {itp.supervisor_signed_at && format(new Date(itp.supervisor_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-20 border border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                Not signed
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableITP.displayName = "PrintableITP";
