import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileUp, X, FileText } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ConcreteTest = Tables<"concrete_tests">;

const testSchema = z.object({
  test_id: z.string().min(1, "Test ID is required"),
  test_type: z.enum(["7_day", "14_day", "28_day", "slump", "cylinder", "air", "other"]),
  pour_id: z.string().optional(),
  pour_date: z.string().optional(),
  test_date: z.string().optional(),
  supplier: z.string().optional(),
  target_strength: z.string().optional(),
  actual_strength: z.string().optional(),
  sample_count: z.string().optional(),
  notes: z.string().optional(),
});

type TestFormData = z.infer<typeof testSchema>;

interface TestResultFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  editTest?: ConcreteTest | null;
}

export function TestResultFormDialog({
  open,
  onOpenChange,
  jobId,
  editTest,
}: TestResultFormDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [labReportUrl, setLabReportUrl] = useState<string | null>(
    editTest?.lab_report_url || null
  );

  // Fetch pours for this job
  const { data: pours = [] } = useQuery({
    queryKey: ["job-pours", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date")
        .eq("job_id", jobId)
        .order("pour_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      test_id: "",
      test_type: "28_day",
      pour_id: "",
      pour_date: "",
      test_date: "",
      supplier: "",
      target_strength: "",
      actual_strength: "",
      sample_count: "",
      notes: "",
    },
    values: editTest
      ? {
          test_id: editTest.test_id,
          test_type: editTest.test_type,
          pour_id: (editTest as any).pour_id || "",
          pour_date: editTest.pour_date || "",
          test_date: editTest.test_date || "",
          supplier: editTest.supplier || "",
          target_strength: editTest.target_strength?.toString() || "",
          actual_strength: editTest.actual_strength?.toString() || "",
          sample_count: editTest.sample_count?.toString() || "",
          notes: editTest.notes || "",
        }
      : undefined,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${jobId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("test-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("test-documents")
        .getPublicUrl(fileName);

      setLabReportUrl(urlData.publicUrl);
      toast.success("Lab report uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFile = async () => {
    if (labReportUrl) {
      // Extract file path from URL
      const pathMatch = labReportUrl.match(/test-documents\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("test-documents").remove([pathMatch[1]]);
      }
    }
    setLabReportUrl(null);
  };

  const mutation = useMutation({
    mutationFn: async (data: TestFormData) => {
      const targetStrength = data.target_strength ? parseFloat(data.target_strength) : null;
      const actualStrength = data.actual_strength ? parseFloat(data.actual_strength) : null;

      // Auto-calculate passed status
      let passed: boolean | null = null;
      if (targetStrength && actualStrength) {
        passed = actualStrength >= targetStrength;
      }

      const testData = {
        job_id: jobId,
        test_id: data.test_id,
        test_type: data.test_type,
        pour_id: data.pour_id || null,
        pour_date: data.pour_date || null,
        test_date: data.test_date || null,
        supplier: data.supplier || null,
        target_strength: targetStrength,
        actual_strength: actualStrength,
        sample_count: data.sample_count ? parseInt(data.sample_count) : null,
        notes: data.notes || null,
        lab_report_url: labReportUrl,
        passed,
      };

      if (editTest) {
        const { error } = await supabase
          .from("concrete_tests")
          .update(testData)
          .eq("id", editTest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("concrete_tests").insert(testData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concrete-tests", jobId] });
      toast.success(editTest ? "Test result updated" : "Test result added");
      onOpenChange(false);
      form.reset();
      setLabReportUrl(null);
    },
    onError: () => {
      toast.error("Failed to save test result");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTest ? "Edit Test Result" : "Add Test Result"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="test_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="test_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="7_day">7-Day</SelectItem>
                        <SelectItem value="14_day">14-Day</SelectItem>
                        <SelectItem value="28_day">28-Day</SelectItem>
                        <SelectItem value="slump">Slump</SelectItem>
                        <SelectItem value="cylinder">Cylinder</SelectItem>
                        <SelectItem value="air">Air Content</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {pours.length > 0 && (
              <FormField
                control={form.control}
                name="pour_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Pour</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pour (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific pour</SelectItem>
                        {pours.map((pour) => (
                          <SelectItem key={pour.id} value={pour.id}>
                            {pour.pour_name}
                            {pour.pour_date && ` (${pour.pour_date})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pour_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pour Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="test_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Testing lab / supplier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="target_strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target MPa</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actual_strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual MPa</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sample_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Samples</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lab Report Upload */}
            <div className="space-y-2">
              <FormLabel>Lab Report (PDF)</FormLabel>
              {labReportUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm flex-1 truncate">Lab report uploaded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingFile ? "Uploading..." : "Click to upload PDF"}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editTest ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
