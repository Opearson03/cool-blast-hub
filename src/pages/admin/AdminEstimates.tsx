import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Calendar, DollarSign, MoreVertical, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/seo/SEOHead";

type EstimateStatus = "draft" | "sent" | "accepted" | "declined";

interface Estimate {
  id: string;
  estimateNumber: string;
  clientName: string;
  siteAddress: string;
  description: string;
  totalAmount: number;
  status: EstimateStatus;
  createdAt: string;
  validUntil: string;
}

// Placeholder data - will be replaced with Supabase data
const mockEstimates: Estimate[] = [
  {
    id: "1",
    estimateNumber: "EST-2026-0001",
    clientName: "Smith Builders",
    siteAddress: "123 Main Street, Sydney NSW",
    description: "Residential driveway pour - 45m²",
    totalAmount: 8500,
    status: "sent",
    createdAt: "2026-01-02",
    validUntil: "2026-01-16",
  },
  {
    id: "2",
    estimateNumber: "EST-2026-0002",
    clientName: "ABC Construction",
    siteAddress: "456 Industrial Ave, Parramatta NSW",
    description: "Commercial slab - 200m²",
    totalAmount: 32000,
    status: "accepted",
    createdAt: "2026-01-01",
    validUntil: "2026-01-15",
  },
  {
    id: "3",
    estimateNumber: "EST-2026-0003",
    clientName: "HomeStart Developments",
    siteAddress: "789 Residential Rd, Blacktown NSW",
    description: "House slab foundation - 180m²",
    totalAmount: 28500,
    status: "draft",
    createdAt: "2026-01-03",
    validUntil: "2026-01-17",
  },
];

const statusConfig: Record<EstimateStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  sent: { label: "Sent", variant: "default", icon: Send },
  accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
  declined: { label: "Declined", variant: "destructive", icon: XCircle },
};

export default function AdminEstimates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [estimates] = useState<Estimate[]>(mockEstimates);

  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.siteAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <SEOHead
        title="Estimates | PourHub"
        description="Create and manage job estimates and quotes"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Estimates</h1>
            <p className="text-muted-foreground">Create and manage job quotes</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Estimate
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Estimates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estimates.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estimates.filter(e => e.status === "sent").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{estimates.filter(e => e.status === "accepted").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(estimates.reduce((sum, e) => sum + e.totalAmount, 0))}</p>
            </CardContent>
          </Card>
        </div>

        {/* Estimates List - Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {filteredEstimates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No estimates found
              </CardContent>
            </Card>
          ) : (
            filteredEstimates.map((estimate) => {
              const StatusIcon = statusConfig[estimate.status].icon;
              return (
                <Card key={estimate.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{estimate.estimateNumber}</p>
                        <p className="text-sm text-muted-foreground">{estimate.clientName}</p>
                      </div>
                      <Badge variant={statusConfig[estimate.status].variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[estimate.status].label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm">{estimate.description}</p>
                    <p className="text-xs text-muted-foreground">{estimate.siteAddress}</p>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(estimate.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatCurrency(estimate.totalAmount)}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Send to Client</DropdownMenuItem>
                          <DropdownMenuItem>Convert to Job</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Estimates List - Desktop Table */}
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">Estimate #</th>
                  <th className="p-4 font-medium text-muted-foreground">Client</th>
                  <th className="p-4 font-medium text-muted-foreground">Description</th>
                  <th className="p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-muted-foreground">Created</th>
                  <th className="p-4 font-medium text-muted-foreground">Valid Until</th>
                  <th className="p-4 font-medium text-muted-foreground sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No estimates found
                    </td>
                  </tr>
                ) : (
                  filteredEstimates.map((estimate) => {
                    const StatusIcon = statusConfig[estimate.status].icon;
                    return (
                      <tr key={estimate.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="p-4 font-medium">{estimate.estimateNumber}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{estimate.clientName}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{estimate.siteAddress}</p>
                          </div>
                        </td>
                        <td className="p-4 max-w-[250px] truncate">{estimate.description}</td>
                        <td className="p-4 font-semibold">{formatCurrency(estimate.totalAmount)}</td>
                        <td className="p-4">
                          <Badge variant={statusConfig[estimate.status].variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[estimate.status].label}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{formatDate(estimate.createdAt)}</td>
                        <td className="p-4 text-muted-foreground">{formatDate(estimate.validUntil)}</td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem>Send to Client</DropdownMenuItem>
                              <DropdownMenuItem>Convert to Job</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
