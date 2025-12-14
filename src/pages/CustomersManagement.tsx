import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Building2, User, Phone, Mail, MapPin, Filter, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Customer = {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  customer_type: string;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
};

type Job = {
  id: string;
  job_number: string | null;
  title: string;
  status: string;
  scheduled_date: string | null;
  quoted_amount: number | null;
  created_at: string;
};

export default function CustomersManagement() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    contactName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    customerType: "retail" as "retail" | "industrial",
    notes: "",
    tags: "",
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, [typeFilter]);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["admin", "staff"])
      .single();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/admin");
      return;
    }

    setAuthorized(true);
    await fetchCustomers();
    setLoading(false);
  };

  const fetchCustomers = async () => {
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (typeFilter !== "all") {
      query = query.eq("customer_type", typeFilter as "retail" | "industrial");
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customers.",
        variant: "destructive",
      });
    } else {
      setCustomers(data || []);
    }
  };

  const fetchCustomerJobs = async (customerId: string) => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customer jobs.",
        variant: "destructive",
      });
    } else {
      setCustomerJobs(data || []);
    }
  };

  const createCustomer = async () => {
    try {
      const tags = newCustomer.tags
        ? newCustomer.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : null;

      const { error } = await supabase
        .from("customers")
        .insert([{
          contact_name: newCustomer.contactName,
          company_name: newCustomer.companyName || null,
          email: newCustomer.email || null,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          customer_type: newCustomer.customerType,
          notes: newCustomer.notes || null,
          tags: tags,
        }]);

      if (error) throw error;

      toast({
        title: "Customer Created",
        description: "New customer has been added successfully.",
      });

      setShowCreateDialog(false);
      setNewCustomer({
        contactName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        customerType: "retail",
        notes: "",
        tags: "",
      });
      await fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerJobs(customer.id);
    setShowDetailsDialog(true);
  };

  const getTypeColor = (type: string) => {
    return type === "industrial" ? "bg-blue-500" : "bg-green-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "quoted":
        return "bg-yellow-500";
      case "scheduled":
        return "bg-blue-500";
      case "in_progress":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      case "invoiced":
        return "bg-teal-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Customers
                </CardTitle>
                <CardDescription>Manage customer information and relationships</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Customer</DialogTitle>
                      <DialogDescription>Add a new customer to the system</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contactName">Contact Name *</Label>
                        <Input
                          id="contactName"
                          value={newCustomer.contactName}
                          onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={newCustomer.companyName}
                          onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                          placeholder="ABC Manufacturing"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customerType">Customer Type *</Label>
                        <Select
                          value={newCustomer.customerType}
                          onValueChange={(value: "retail" | "industrial") => setNewCustomer({ ...newCustomer, customerType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            placeholder="+61 400 000 000"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={newCustomer.address}
                          onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                          placeholder="123 Main St, City, State"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tags">Tags (comma separated)</Label>
                        <Input
                          id="tags"
                          value={newCustomer.tags}
                          onChange={(e) => setNewCustomer({ ...newCustomer, tags: e.target.value })}
                          placeholder="VIP, Regular, Preferred"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newCustomer.notes}
                          onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                          placeholder="Additional information about the customer..."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createCustomer} disabled={!newCustomer.contactName || !newCustomer.phone}>
                          Create Customer
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{customer.contact_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.company_name ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {customer.company_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(customer.customer_type)}>
                          {customer.customer_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${customer.phone}`} className="hover:underline">
                                {customer.phone}
                              </a>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${customer.email}`} className="hover:underline text-xs">
                                {customer.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.tags && customer.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(customer.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewCustomerDetails(customer)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedCustomer && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
                <DialogDescription>Complete information and job history</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="jobs">Job History ({customerJobs.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Name:</span>
                          <span>{selectedCustomer.contact_name}</span>
                        </div>
                        {selectedCustomer.company_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Company:</span>
                            <span>{selectedCustomer.company_name}</span>
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Phone:</span>
                            <a href={`tel:${selectedCustomer.phone}`} className="hover:underline">
                              {selectedCustomer.phone}
                            </a>
                          </div>
                        )}
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Email:</span>
                            <a href={`mailto:${selectedCustomer.email}`} className="hover:underline">
                              {selectedCustomer.email}
                            </a>
                          </div>
                        )}
                        {selectedCustomer.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="font-medium">Address:</span>
                              <p className="text-muted-foreground">{selectedCustomer.address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Customer Details</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          <Badge className={getTypeColor(selectedCustomer.customer_type)}>
                            {selectedCustomer.customer_type}
                          </Badge>
                        </p>
                        {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                          <div>
                            <span className="font-medium">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedCustomer.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <p>
                          <span className="font-medium">Added:</span>{" "}
                          {format(new Date(selectedCustomer.created_at), "MMMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedCustomer.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                        {selectedCustomer.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="jobs">
                  {customerJobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No jobs found for this customer
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerJobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                  {job.job_number || "Pending"}
                                </span>
                                <Badge className={getStatusColor(job.status)}>
                                  {job.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <h4 className="font-semibold mb-1">{job.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {job.scheduled_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(job.scheduled_date), "MMM dd, yyyy")}
                                  </div>
                                )}
                                {job.quoted_amount && (
                                  <span className="font-medium text-foreground">
                                    ${job.quoted_amount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
