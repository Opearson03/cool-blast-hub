import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, MoreHorizontal, Eye, CheckCircle, XCircle, Clock, ExternalLink, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface SupplierRegistration {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  abn: string | null;
  categories: string[];
  service_areas: string[];
  website: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

export function SupplierRegistrationsTable() {
  const queryClient = useQueryClient();
  const [selectedRegistration, setSelectedRegistration] = useState<SupplierRegistration | null>(null);

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["staff-supplier-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupplierRegistration[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("supplier_registrations")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-supplier-registrations"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "contacted":
        return <Badge variant="secondary" className="gap-1"><Mail className="h-3 w-3" /> Contacted</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-primary text-primary-foreground"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Supplier Registrations</CardTitle>
          <CardDescription>
            Businesses interested in becoming Preferred Suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!registrations?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              No registrations yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                     <TableHead className="hidden md:table-cell">Categories</TableHead>
                     <TableHead className="hidden md:table-cell">Service Areas</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="hidden md:table-cell">Submitted</TableHead>
                     <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="font-medium">{reg.company_name}</div>
                        {reg.abn && (
                          <div className="text-xs text-muted-foreground">ABN: {reg.abn}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{reg.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{reg.email}</div>
                        {reg.phone && (
                          <div className="text-xs text-muted-foreground">{reg.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {reg.categories.slice(0, 2).map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {reg.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{reg.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {reg.service_areas.slice(0, 2).map((area) => (
                            <Badge key={area} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {reg.service_areas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{reg.service_areas.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {format(new Date(reg.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedRegistration(reg)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "contacted" })}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Mark Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "approved" })}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "rejected" })}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRegistration && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRegistration.company_name}</DialogTitle>
                <DialogDescription>
                  Submitted {format(new Date(selectedRegistration.created_at), "dd MMMM yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedRegistration.status)}
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p>{selectedRegistration.contact_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p>
                        <a
                          href={`mailto:${selectedRegistration.email}`}
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {selectedRegistration.email}
                          <Mail className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                    {selectedRegistration.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p>
                          <a
                            href={`tel:${selectedRegistration.phone}`}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {selectedRegistration.phone}
                            <Phone className="h-3 w-3" />
                          </a>
                        </p>
                      </div>
                    )}
                    {selectedRegistration.abn && (
                      <div>
                        <span className="text-muted-foreground">ABN:</span>
                        <p>{selectedRegistration.abn}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Website */}
                {selectedRegistration.website && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Website</h4>
                    <a
                      href={selectedRegistration.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {selectedRegistration.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Categories */}
                {selectedRegistration.categories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegistration.categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Areas */}
                {selectedRegistration.service_areas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Service Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegistration.service_areas.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedRegistration.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Additional Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRegistration.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedRegistration.id, status: "contacted" });
                      setSelectedRegistration(null);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Mark Contacted
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedRegistration.id, status: "approved" });
                      setSelectedRegistration(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedRegistration.id, status: "rejected" });
                      setSelectedRegistration(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
