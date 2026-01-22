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
            
            .checklist-item {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .signature-section {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 20px;
            }
            
            .print-header {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .print-summary {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            img {
              max-height: 120px !important;
              object-fit: contain;
            }
            
            .print-footer {
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
        <div className="print-header flex items-start justify-between border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-3">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt="Company logo"
                className="max-h-10 max-w-[80px] w-auto h-auto object-contain"
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 flex items-center justify-center text-gray-500 text-[10px]">
                Logo
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold">{business?.name || "Company Name"}</h1>
              {business?.abn && <p className="text-[10px]">ABN: {business.abn}</p>}
              {business?.phone && <p className="text-[10px]">Ph: {business.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold">INSPECTION & TEST PLAN</h2>
            <p className="text-[10px] text-gray-600">
              Date: {format(new Date(itp.created_at!), "d MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Job Details - Compact */}
        <div className="grid grid-cols-2 gap-1 mb-3 text-[10px] border border-gray-300 p-2 rounded">
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
        <div className="space-y-2">
          {checklistData.map((item, index) => (
            <div 
              key={item.id} 
              className="checklist-item border border-gray-300 rounded overflow-hidden"
            >
              {/* Item Header */}
              <div className="bg-gray-100 px-2 py-1 border-b border-gray-300 flex items-center gap-2">
                <span className="font-bold text-[10px]">#{index + 1}</span>
                <span className="flex-1 text-[10px]">
                  {item.item}
                  {item.required && <span className="text-red-600 ml-1">*</span>}
                </span>
                <span className={`font-bold text-[10px] ${item.checked ? "text-green-600" : "text-gray-400"}`}>
                  {item.checked ? "✓ PASS" : "○ PENDING"}
                </span>
              </div>

              {/* Item Content */}
              <div className="p-1.5">
                {item.comment && (
                  <div className="mb-1">
                    <p className="text-[9px] text-gray-600 mb-0.5">Comments:</p>
                    <p className="text-[10px] bg-gray-50 p-1 rounded border border-gray-200">{item.comment}</p>
                  </div>
                )}

                {item.photo_url && (
                  <div>
                    <p className="text-[9px] text-gray-600 mb-0.5">Photo:</p>
                    <img
                      src={item.photo_url}
                      alt={`Photo for ${item.item}`}
                      className="max-w-full h-auto border border-gray-300 rounded"
                      style={{ maxHeight: "100px", objectFit: "contain" }}
                    />
                  </div>
                )}

                {!item.photo_url && !item.comment && (
                  <p className="text-[9px] text-gray-400 italic">No comments or photos</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="print-summary text-[10px] my-3 p-2 bg-gray-100 rounded border border-gray-300">
          <p>
            <strong>Completion:</strong> {completedCount}/{checklistData.length} items checked
            ({checklistData.length > 0 ? Math.round((completedCount / checklistData.length) * 100) : 0}%)
          </p>
        </div>

        {/* Notes */}
        {itp.notes && (
          <div className="mb-3 text-[10px]">
            <p className="font-semibold mb-0.5">Additional Notes:</p>
            <p className="border border-gray-300 p-1.5 bg-gray-50 rounded">{itp.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="signature-section grid grid-cols-2 gap-4 mt-3 border-t-2 border-black pt-3">
          <div>
            <p className="font-semibold text-[10px] mb-1">Employee Signature:</p>
            {itp.employee_signature ? (
              <div className="border border-gray-300 rounded p-1.5 bg-green-50">
                <img
                  src={itp.employee_signature}
                  alt="Employee signature"
                  className="h-10 mx-auto"
                  style={{ maxHeight: "40px" }}
                />
                <p className="text-[9px] text-gray-600 mt-0.5 text-center">
                  Signed: {itp.employee_signed_at && format(new Date(itp.employee_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-14 border border-gray-300 rounded flex items-center justify-center text-gray-400 text-[9px]">
                Not signed
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-[10px] mb-1">Site Supervisor Signature:</p>
            {itp.supervisor_signature ? (
              <div className="border border-gray-300 rounded p-1.5 bg-green-50">
                <img
                  src={itp.supervisor_signature}
                  alt="Supervisor signature"
                  className="h-10 mx-auto"
                  style={{ maxHeight: "40px" }}
                />
                <p className="text-[9px] text-gray-600 mt-0.5 text-center">
                  Signed: {itp.supervisor_signed_at && format(new Date(itp.supervisor_signed_at), "d MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : (
              <div className="h-14 border border-gray-300 rounded flex items-center justify-center text-gray-400 text-[9px]">
                Not signed
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer mt-4 pt-2 border-t border-gray-300 text-[9px] text-gray-500 text-center">
          <p>Generated by PourHub • {format(new Date(), "d MMM yyyy, HH:mm")}</p>
        </div>
      </div>
    );
  }
);

PrintableITP.displayName = "PrintableITP";
