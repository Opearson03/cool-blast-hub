import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Video } from "lucide-react";
import { format } from "date-fns";

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSubmit: (data: BookingFormData) => void;
  isSubmitting: boolean;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  quotes_per_week: string;
}

export function BookingForm({ selectedDate, selectedTime, onSubmit, isSubmitting }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    quotes_per_week: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.company.trim()) newErrors.company = "Company name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-card p-4 mb-4">
        <p className="text-sm font-medium text-foreground">
          📅 {format(selectedDate, "EEEE, d MMMM yyyy")} at {selectedTime} AEST
        </p>
        <p className="text-xs text-muted-foreground mt-1">30 minute Zoom call</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Smith"
          maxLength={100}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@company.com"
          maxLength={255}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="04XX XXX XXX"
          maxLength={20}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company Name *</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Your concrete business"
          maxLength={200}
        />
        {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quotes_per_week">How many quotes do you do per week?</Label>
        <Select
          value={formData.quotes_per_week}
          onValueChange={(val) => setFormData({ ...formData, quotes_per_week: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-5">1–5</SelectItem>
            <SelectItem value="6-10">6–10</SelectItem>
            <SelectItem value="11-20">11–20</SelectItem>
            <SelectItem value="20+">20+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Booking...
          </>
        ) : (
          <>
            <Video className="h-4 w-4 mr-2" />
            Book Zoom Call
          </>
        )}
      </Button>
    </form>
  );
}
