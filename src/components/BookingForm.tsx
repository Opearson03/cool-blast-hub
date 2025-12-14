import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Mail, Phone, User, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const BookingForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    serviceType: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.phone || !formData.serviceType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Insert booking into database
      const { error } = await supabase
        .from('bookings')
        .insert([{
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          preferred_date: formData.date || null,
          service_type: formData.serviceType as 'industrial' | 'automotive' | 'restoration' | 'other',
          message: formData.message || null,
          status: 'pending' as const
        }]);

      if (error) throw error;

      toast({
        title: "Booking Request Received!",
        description: "We'll contact you shortly to confirm your booking.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        serviceType: "",
        message: ""
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="booking" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            BOOK YOUR <span className="text-primary">SERVICE</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get in touch to schedule your dry ice blasting service
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card border-border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Phone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                    required
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Preferred Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">
                    Service Type *
                  </Label>
                  <select
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground"
                  >
                    <option value="">Select a service</option>
                    <option value="industrial">Industrial Cleaning</option>
                    <option value="automotive">Automotive/4WD</option>
                    <option value="restoration">Restoration Project</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Additional Details
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your project..."
                  rows={4}
                  className="bg-secondary border-border"
                />
              </div>

              <Button 
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg"
              >
                Submit Booking Request
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border p-6">
              <h3 className="text-2xl font-bold mb-4">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <a href="tel:+61400000000" className="text-muted-foreground hover:text-primary transition-colors">
                      0400 000 000
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href="mailto:info@hunterdryice.com.au" className="text-muted-foreground hover:text-primary transition-colors">
                      info@hunterdryice.com.au
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-secondary border-border p-6">
              <h3 className="text-xl font-bold mb-2">Service Areas</h3>
              <p className="text-muted-foreground">
                Hunter Valley, Newcastle, Central Coast, and surrounding regions
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
