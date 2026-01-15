import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface WaitlistFormProps {
  onSuccess?: () => void;
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("waiting_list")
        .insert({
          email: email.toLowerCase().trim(),
          full_name: fullName.trim() || null,
          business_name: businessName.trim() || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waiting list!");
        } else {
          throw error;
        }
        return;
      }

      setIsSuccess(true);
      toast.success("You're on the list! We'll be in touch soon.");
      onSuccess?.();
    } catch (error: any) {
      console.error("Waitlist error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary-foreground mb-2">You're on the list!</h3>
        <p className="text-muted-foreground">We'll notify you when PourHub is ready for you.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-primary-foreground">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-background/50 border-border"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-primary-foreground">Your Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="bg-background/50 border-border"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-primary-foreground">Business Name</Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Smith Concrete Pty Ltd"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="bg-background/50 border-border"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full touch-target" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Join the Waiting List"
        )}
      </Button>
    </form>
  );
}
