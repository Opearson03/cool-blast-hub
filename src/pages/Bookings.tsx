import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { BookingForm, type BookingFormData } from "@/components/bookings/BookingForm";
import { BookingConfirmation } from "@/components/bookings/BookingConfirmation";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
      // Build booking_time in AEST
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(hours, minutes, 0, 0);

      // Convert to AEST ISO string
      // The date was selected as a local date, we need to create the AEST equivalent
      const aestOffset = "+10:00"; // AEST
      const year = bookingDate.getFullYear();
      const month = String(bookingDate.getMonth() + 1).padStart(2, "0");
      const day = String(bookingDate.getDate()).padStart(2, "0");
      const h = String(hours).padStart(2, "0");
      const m = String(minutes).padStart(2, "0");
      const bookingTimeISO = `${year}-${month}-${day}T${h}:${m}:00${aestOffset}`;

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

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/">
              <Logo className="h-8" />
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
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
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Book a free PourHub onboarding call
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Book a quick 30 minute Zoom call with our team. We'll show you how to
                  create quotes with PourHub and help you set up your first job.
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
                  <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
                    <p className="text-muted-foreground text-center">
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
    </>
  );
}
