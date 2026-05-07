import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { BookingForm, type BookingFormData } from "@/components/bookings/BookingForm";
import { BookingConfirmation } from "@/components/bookings/BookingConfirmation";
import { SEOHead } from "@/components/seo/SEOHead";
import { LandingShell } from "@/components/landing/LandingShell";
import { toast } from "sonner";

export default function Bookings() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    bookingTime: Date;
    zoomLink?: string;
    name: string;
    email: string;
    company: string;
  } | null>(null);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Fetch existing bookings to show availability
  const { data: existingBookings } = useQuery({
    queryKey: ["public-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_time, status")
        .in("status", ["booked"])
        .gte("booking_time", new Date().toISOString());

      if (error) throw error;
      return data ?? [];
    },
  });

  const bookedSlots = useMemo(
    () => (existingBookings ?? []).map((b) => b.booking_time),
    [existingBookings]
  );

  const handleSubmit = async (formData: BookingFormData) => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      // Build booking_time in Australia/Sydney timezone (handles AEST/AEDT automatically)
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const h = String(hours).padStart(2, "0");
      const m = String(minutes).padStart(2, "0");

      // Determine the real UTC offset for Australia/Sydney on the selected date
      const tempDate = new Date(`${year}-${month}-${day}T${h}:${m}:00`);
      const sydneyParts = new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Sydney",
        timeZoneName: "shortOffset",
      }).formatToParts(tempDate);
      const offsetPart = sydneyParts.find((p) => p.type === "timeZoneName")?.value || "+10";
      // offsetPart is like "GMT+11" or "GMT+10" — extract the numeric offset
      const offsetMatch = offsetPart.match(/([+-]?\d+)/);
      const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : 10;
      const sydneyOffset = `${offsetHours >= 0 ? "+" : "-"}${String(Math.abs(offsetHours)).padStart(2, "0")}:00`;

      const bookingTimeISO = `${year}-${month}-${day}T${h}:${m}:00${sydneyOffset}`;

      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          company: formData.company.trim(),
          quotes_per_week: formData.quotes_per_week || null,
          booking_time: bookingTimeISO,
          timezone: userTimezone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConfirmation({
        bookingTime: new Date(bookingTimeISO),
        zoomLink: data?.zoom_link,
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
      });

      toast.success("Your call has been booked!");
    } catch (err: any) {
      console.error("Booking error:", err);
      if (err.message?.includes("already booked")) {
        toast.error("That time slot is no longer available. Please choose another.");
        setSelectedTime(undefined);
      } else {
        toast.error("Failed to create booking. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Book a Free Onboarding Call | PourHub"
        description="Book a free 30 minute Zoom call with the PourHub team. We'll show you how to create quotes and help you set up your first job."
        canonicalPath="/bookings"
      />

      <LandingShell ctaHref="/signup?tier=pro" ctaLabel="Get started" secondaryHref="/" secondaryLabel="Home">
        <div className="bg-charcoal-dark text-primary-foreground">
          <main className="container mx-auto px-4 py-12 max-w-5xl">
            {confirmation ? (
              <BookingConfirmation
                bookingTime={confirmation.bookingTime}
                zoomLink={confirmation.zoomLink}
                name={confirmation.name}
                email={confirmation.email}
                company={confirmation.company}
              />
            ) : (
              <>
                {/* Hero */}
                <div className="text-center mb-12">
                  <span className="eyebrow">Free walkthrough</span>
                  <h1 className="font-display text-4xl md:text-5xl font-bold mt-4 leading-tight">
                    Book a free PourHub<br />
                    <span className="text-primary">onboarding call.</span>
                  </h1>
                  <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto mt-5">
                    A quick 30-minute Zoom with our team. We'll show you how to create quotes
                    in PourHub and help you set up your first job.
                  </p>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <BookingCalendar
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(undefined);
                    }}
                    onTimeSelect={setSelectedTime}
                    bookedSlots={bookedSlots}
                    timezone="Australia/Sydney"
                  />

                  {selectedDate && selectedTime ? (
                    <BookingForm
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  ) : (
                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/40 backdrop-blur p-8">
                      <p className="text-primary-foreground/60 text-center">
                        {!selectedDate
                          ? "Select a date to see available times"
                          : "Select a time slot to continue"}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </LandingShell>
    </>
  );
}
