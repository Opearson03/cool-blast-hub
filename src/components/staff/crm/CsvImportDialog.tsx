import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

const CRM_FIELDS = [
  { value: "email", label: "Email" },
  { value: "full_name", label: "Full Name" },
  { value: "company_name", label: "Company" },
  { value: "phone", label: "Phone" },
  { value: "notes", label: "Notes" },
  { value: "__skip", label: "Skip" },
];

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });

  return { headers, rows };
}

function autoMapColumn(header: string): string {
  const h = header.toLowerCase();
  if (h.includes("email")) return "email";
  if (h.includes("name")) return "full_name";
  if (h.includes("company") || h.includes("business")) return "company_name";
  if (h.includes("phone") || h.includes("mobile")) return "phone";
  if (h.includes("note")) return "notes";
  return "__skip";
}

export function CsvImportDialog({ open, onOpenChange, onImportComplete }: CsvImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      setHeaders(h);
      setRows(r);

      const autoMap: Record<string, string> = {};
      h.forEach((col) => {
        autoMap[col] = autoMapColumn(col);
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const emailCol = Object.entries(mapping).find(([, v]) => v === "email")?.[0];
    if (!emailCol) {
      toast.error("You must map an Email column");
      return;
    }

    setImporting(true);
    try {
      const leads = rows
        .filter((r) => r[emailCol]?.trim())
        .map((r) => {
          const lead: Record<string, string | null> = { email: r[emailCol].trim() };
          Object.entries(mapping).forEach(([col, field]) => {
            if (field !== "__skip" && field !== "email") {
              lead[field] = r[col]?.trim() || null;
            }
          });
          return lead;
        });

      const { data, error } = await supabase.rpc("import_crm_leads", {
        _leads: JSON.stringify(leads),
      });

      if (error) throw error;

      const res = data as unknown as { inserted: number; skipped: number; total: number };
      setResult({ inserted: res.inserted, skipped: res.skipped });
      toast.success(`Imported ${res.inserted} leads (${res.skipped} skipped)`);
      onImportComplete();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setHeaders([]);
      setRows([]);
      setMapping({});
      setResult(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
        </DialogHeader>

        {headers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Select a CSV file to import leads</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Column mapping */}
            <div>
              <p className="text-sm font-medium mb-2">Map your CSV columns:</p>
              <div className="grid grid-cols-2 gap-2">
                {headers.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <span className="text-sm truncate w-28">{h}</span>
                    <Select value={mapping[h] || "__skip"} onValueChange={(v) => setMapping({ ...mapping, [h]: v })}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg overflow-x-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 5).map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="text-xs">{r[h]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing {Math.min(5, rows.length)} of {rows.length} rows
            </p>

            {result && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                ✅ {result.inserted} imported, {result.skipped} skipped (duplicates)
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import {rows.length} Rows
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
