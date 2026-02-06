import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle } from "lucide-react";

interface SupplierRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPLIER_CATEGORIES = [
  "Concrete",
  "Reinforcement",
  "Formwork",
  "Pump hire",
  "Admixtures",
  "Testing & compliance",
  "Consumables",
];

const SERVICE_AREAS = [
  "NSW - Sydney Metro",
  "NSW - Hunter",
  "NSW - Illawarra",
  "NSW - Central Coast",
  "NSW - Regional",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
  "ACT",
];

export function SupplierRegistrationDialog({
  open,
  onOpenChange,
}: SupplierRegistrationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    abn: "",
    website: "",
    notes: "",
    categories: [] as string[],
    service_areas: [] as string[],
  });

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleServiceAreaToggle = (area: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.includes(area)
        ? prev.service_areas.filter(a => a !== area)
        : [...prev.service_areas, area],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim() || !formData.contact_name.trim() || !formData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("supplier_registrations").insert({
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        abn: formData.abn.trim() || null,
        website: formData.website.trim() || null,
        notes: formData.notes.trim() || null,
        categories: formData.categories,
        service_areas: formData.service_areas,
      });

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after dialog closes
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        abn: "",
        website: "",
        notes: "",
        categories: [],
        service_areas: [],
      });
    }, 200);
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl mb-2">Thank You!</DialogTitle>
            <DialogDescription className="text-base">
              Your interest has been registered. Our team will review your submission and be in touch soon.
            </DialogDescription>
            <Button className="mt-6" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Your Interest</DialogTitle>
          <DialogDescription>
            Tell us about your business and we'll be in touch about becoming a Preferred Supplier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Business Information</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Your Company Pty Ltd"
                  required
                  maxLength={200}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  value={formData.abn}
                  onChange={(e) => setFormData(prev => ({ ...prev, abn: e.target.value }))}
                  placeholder="12 345 678 901"
                  maxLength={14}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.yourcompany.com.au"
                maxLength={500}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Contact Information</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="John Smith"
                  required
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0400 000 000"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="sales@yourcompany.com.au"
                required
                maxLength={255}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">What do you supply?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPLIER_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={formData.categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Service Areas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_AREAS.map((area) => (
                <label
                  key={area}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={formData.service_areas.includes(area)}
                    onCheckedChange={() => handleServiceAreaToggle(area)}
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Information</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Tell us more about your business, products, or any questions you have..."
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
