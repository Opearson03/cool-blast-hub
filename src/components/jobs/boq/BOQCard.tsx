import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, ChevronDown, ChevronUp, Printer, Pencil, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BOQItem, BOQ_CATEGORIES, JobBOQ } from "./BOQTypes";
import { BOQEditDialog } from "./BOQEditDialog";
import { PrintableBOQ } from "./PrintableBOQ";
import { createPortal } from "react-dom";

interface BOQCardProps {
  jobId: string;
  jobName: string;
  jobNumber?: string;
}

export function BOQCard({ jobId, jobName, jobNumber }: BOQCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch business branding for the printed BOQ
  const { data: business } = useQuery({
    queryKey: ["business-branding-boq"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();
      
      if (!profile?.business_id) return null;
      
      const { data, error } = await supabase
        .from("businesses")
        .select("name, logo_url, quote_primary_color, quote_font")
        .eq("id", profile.business_id)
        .maybeSingle();
      
      if (error) throw error;
      return data ? {
        name: data.name,
        logo_url: data.logo_url,
        primary_color: data.quote_primary_color,
        font: data.quote_font,
      } : null;
    },
  });

  const { data: boq, isLoading } = useQuery({
    queryKey: ["job-boq", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_boq")
        .select("*")
        .eq("job_id", jobId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      // Parse the JSONB items field
      const parsedItems = Array.isArray(data.items) ? data.items : [];
      
      return {
        ...data,
        items: parsedItems as unknown as BOQItem[],
      } as JobBOQ;
    },
  });

  const createBOQMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("job_boq")
        .insert({
          job_id: jobId,
          items: [],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-boq", jobId] });
      setIsEditOpen(true);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const groupedItems = boq?.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BOQItem[]>) || {};

  const totalValue = boq?.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Bill of Quantities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!boq) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Bill of Quantities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              No Bill of Quantities has been created for this job yet.
            </p>
            <Button onClick={() => createBOQMutation.mutate()} disabled={createBOQMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Create BOQ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Bill of Quantities
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </Button>
              </CollapsibleTrigger>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} disabled={boq.items.length === 0}>
                  <Printer className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              {boq.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items in the Bill of Quantities. Click Edit to add items.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={BOQ_CATEGORIES[category as keyof typeof BOQ_CATEGORIES]?.color || 'bg-gray-100'}>
                          {BOQ_CATEGORIES[category as keyof typeof BOQ_CATEGORIES]?.label || category}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right w-24">Qty</TableHead>
                              <TableHead className="w-20">Unit</TableHead>
                              <TableHead className="text-right w-28">Unit Price</TableHead>
                              <TableHead className="text-right w-28">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right">
                                  {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                    </div>
                  </div>

                  {boq.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{boq.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <BOQEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        boq={boq}
        jobId={jobId}
      />

      {isPrinting && createPortal(
        <PrintableBOQ 
          boq={boq} 
          jobName={jobName} 
          jobNumber={jobNumber}
          business={business}
        />,
        document.body
      )}
    </>
  );
}
