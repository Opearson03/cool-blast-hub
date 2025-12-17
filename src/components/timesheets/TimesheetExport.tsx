import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface TimesheetExportProps {
  businessId: string;
}

export function TimesheetExport({ businessId }: TimesheetExportProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: business } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("name, logo_url")
        .eq("id", businessId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const fetchTimesheets = async () => {
    const { data, error } = await supabase
      .from("timesheets")
      .select(`
        *,
        profiles!timesheets_employee_id_fkey(full_name),
        job_pours(pour_name, jobs(name))
      `)
      .eq("business_id", businessId)
      .gte("clock_in", `${startDate}T00:00:00`)
      .lte("clock_in", `${endDate}T23:59:59`)
      .order("clock_in", { ascending: true });

    if (error) throw error;
    return data;
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const timesheets = await fetchTimesheets();
      
      const headers = ["Employee", "Date", "Clock In", "Clock Out", "Duration (mins)", "Job", "Pour", "Notes"];
      const rows = timesheets.map((ts: any) => [
        ts.profiles?.full_name || "",
        format(new Date(ts.clock_in), "yyyy-MM-dd"),
        format(new Date(ts.clock_in), "HH:mm"),
        ts.clock_out ? format(new Date(ts.clock_out), "HH:mm") : "",
        ts.clock_out ? differenceInMinutes(new Date(ts.clock_out), new Date(ts.clock_in)) : "",
        ts.job_pours?.jobs?.name || "",
        ts.job_pours?.pour_name || "",
        ts.notes || "",
      ]);

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheets_${startDate}_to_${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "CSV exported successfully" });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const timesheets = await fetchTimesheets();

      // Group by employee
      const byEmployee: Record<string, any[]> = {};
      timesheets.forEach((ts: any) => {
        const name = ts.profiles?.full_name || "Unknown";
        if (!byEmployee[name]) byEmployee[name] = [];
        byEmployee[name].push(ts);
      });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Timesheet Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #f97316; margin-bottom: 5px; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
            .period { color: #666; font-size: 14px; }
            .employee-section { margin-bottom: 30px; page-break-inside: avoid; }
            .employee-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .total { font-weight: bold; background: #fef3e7; }
            .logo { max-height: 50px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${business?.logo_url ? `<img src="${business.logo_url}" class="logo" />` : ""}
            <h1>${business?.name || "Timesheet Report"}</h1>
            <p class="period">Period: ${format(new Date(startDate), "d MMM yyyy")} - ${format(new Date(endDate), "d MMM yyyy")}</p>
          </div>
          
          ${Object.entries(byEmployee).map(([name, entries]) => {
            const totalMins = entries.reduce((acc, ts) => {
              if (!ts.clock_out) return acc;
              return acc + differenceInMinutes(new Date(ts.clock_out), new Date(ts.clock_in));
            }, 0);
            
            return `
              <div class="employee-section">
                <p class="employee-name">${name}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Duration</th>
                      <th>Job/Pour</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${entries.map((ts: any) => {
                      const duration = ts.clock_out
                        ? differenceInMinutes(new Date(ts.clock_out), new Date(ts.clock_in))
                        : 0;
                      const hours = Math.floor(duration / 60);
                      const mins = duration % 60;
                      return `
                        <tr>
                          <td>${format(new Date(ts.clock_in), "EEE, d MMM")}</td>
                          <td>${format(new Date(ts.clock_in), "h:mm a")}</td>
                          <td>${ts.clock_out ? format(new Date(ts.clock_out), "h:mm a") : "—"}</td>
                          <td>${ts.clock_out ? `${hours}h ${mins}m` : "In progress"}</td>
                          <td>${ts.job_pours?.pour_name || "—"}</td>
                        </tr>
                      `;
                    }).join("")}
                    <tr class="total">
                      <td colspan="3">Total</td>
                      <td colspan="2">${Math.floor(totalMins / 60)}h ${totalMins % 60}m</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          }).join("")}
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }

      toast({ title: "PDF ready for printing" });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Timesheets</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={exportCSV}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={exportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}