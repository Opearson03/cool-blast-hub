import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Save, Plus, X, Upload, Image, CreditCard, ExternalLink, Lock, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PriceListSection } from "@/components/settings/PriceListSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSubscription } from "@/hooks/useSubscription";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;

export default function AdminSettings() {
  const [name, setName] = useState("");
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState("");
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const subscription = useSubscription();

  const { data: business, isLoading } = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      
      // First check if user owns a business
      const { data: ownedBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userData.user?.id)
        .maybeSingle();

      if (ownedBusiness) return ownedBusiness as Business;

      // Otherwise check their profile's business
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userData.user?.id)
        .single();

      if (!profile?.business_id) return null;

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.business_id)
        .single();

      return data as Business;
    },
  });

  useEffect(() => {
    if (business) {
      setName(business.name || "");
      setAbn(business.abn || "");
      setAddress(business.address || "");
      setPhone(business.phone || "");
      setEmail(business.email || "");
      setLogoUrl(business.logo_url || null);
      setSuppliers((business.preferred_suppliers as string[]) || []);
    }
  }, [business]);

  const handleLogoUpload = async (file: File) => {
    if (!business) {
      toast({ title: "Please save business details first", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${business.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("business-logos").remove([`${business.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("business-logos")
        .getPublicUrl(filePath);

      const newLogoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setLogoUrl(newLogoUrl);

      // Update business record
      await supabase
        .from("businesses")
        .update({ logo_url: newLogoUrl })
        .eq("id", business.id);

      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!business) {
        // Create new business
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("businesses")
          .insert({
            name,
            abn: abn || null,
            address: address || null,
            phone: phone || null,
            email: email || null,
            preferred_suppliers: suppliers,
            owner_id: userData.user?.id,
          })
          .select()
          .single();
        
        if (error) throw error;

        // Link business to profile
        await supabase
          .from("profiles")
          .update({ business_id: data.id })
          .eq("id", userData.user?.id);

        return data;
      } else {
        // Update existing business
        const { error } = await supabase
          .from("businesses")
          .update({
            name,
            abn: abn || null,
            address: address || null,
            phone: phone || null,
            email: email || null,
            preferred_suppliers: suppliers,
          })
          .eq("id", business.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast({ title: "Settings saved" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Please enter a business name", variant: "destructive" });
      return;
    }
    updateMutation.mutate();
  };

  const addSupplier = () => {
    if (newSupplier.trim() && !suppliers.includes(newSupplier.trim())) {
      setSuppliers([...suppliers, newSupplier.trim()]);
      setNewSupplier("");
    }
  };

  const removeSupplier = (supplier: string) => {
    setSuppliers(suppliers.filter((s) => s !== supplier));
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground">Manage your business information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your PourHub subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : subscription.isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {subscription.tierConfig?.name || subscription.tier}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Employee Limit:</span>
                    <span className="text-sm font-medium">
                      {subscription.employeeLimit === 999 ? "Unlimited" : subscription.employeeLimit}
                    </span>
                  </div>
                  {subscription.subscriptionEnd && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Renews:</span>
                      <span className="text-sm">
                        {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => subscription.openCustomerPortal()}
                    className="touch-target"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No active subscription found.
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => window.location.href = "/pricing"}
                    className="touch-target"
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Business Logo
              </CardTitle>
              <CardDescription>
                Your logo will appear on ITPs, SWMS, and other documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Business logo"
                    className="h-20 w-20 object-contain border rounded-lg bg-white"
                  />
                ) : (
                  <div className="h-20 w-20 border rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !business}
                    className="touch-target"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {!business && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Save business details first to upload logo
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Details
              </CardTitle>
              <CardDescription>Your company information for documents and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Smith Concreting Pty Ltd"
                  className="touch-target"
                />
              </div>

              <div>
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  placeholder="e.g., 12 345 678 901"
                  className="touch-target"
                />
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, Sydney NSW 2000"
                  className="touch-target"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 0412 345 678"
                    className="touch-target"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., admin@company.com"
                    className="touch-target"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferred Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Suppliers</CardTitle>
              <CardDescription>
                Your go-to concrete and material suppliers for quick selection on jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  placeholder="Add a supplier..."
                  className="touch-target"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSupplier();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSupplier} className="touch-target">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {suppliers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suppliers.map((supplier) => (
                    <Badge key={supplier} variant="secondary" className="gap-1 py-1 px-3">
                      {supplier}
                      <button
                        type="button"
                        onClick={() => removeSupplier(supplier)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No suppliers added yet</p>
              )}
            </CardContent>
          </Card>

          {/* My Price List */}
          <PriceListSection />

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Account Security
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="touch-target"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="touch-target"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardHeader>
              <CardTitle>Legal</CardTitle>
              <CardDescription>Privacy policy and terms of service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
              <br />
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link to="/terms">Terms and Conditions</Link>
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto touch-target"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>

          {/* Hidden Danger Zone - Collapsible at the very bottom */}
          {subscription.isSubscribed && (
            <div className="mt-16 pt-8">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <ChevronDown className="w-3 h-3" />
                    <span>Advanced options</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Card className="border-destructive/20">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel your PourHub subscription. You'll lose access to premium features at the end of your current billing period. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => subscription.openCustomerPortal()}
                            >
                              Proceed to Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
