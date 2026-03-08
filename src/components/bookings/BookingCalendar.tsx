import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays, isWeekend, isBefore, startOfDay, setHours, setMinutes, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  bookedSlots: string[]; // ISO strings of booked times
  timezone: string;
}

const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 17;
const SLOT_DURATION = 30; // minutes

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < BUSINESS_HOURS_END || SLOT_DURATION === 30) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return slots;
}

export function BookingCalendar({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  bookedSlots,
  timezone,
}: BookingCalendarProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const isSlotBooked = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    // Create the booking time in AEST context
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    return bookedSlots.some((booked) => {
      const bookedDate = new Date(booked);
      return isSameDay(bookedDate, slotDate) && 
        bookedDate.getHours() === hours && 
        bookedDate.getMinutes() === minutes;
    });
  };

  const isSlotPast = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    return isBefore(slotDate, new Date());
  };

  const disabledDays = (date: Date) => {
    return isWeekend(date) || isBefore(startOfDay(date), startOfDay(new Date()));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Select a date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={disabledDays}
          className="rounded-lg border bg-card p-3 pointer-events-auto"
          fromDate={new Date()}
          toDate={addDays(new Date(), 60)}
        />
      </div>

      {selectedDate && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">
            Available times — {format(selectedDate, "EEEE, d MMMM")}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Times shown in AEST (Australia/Sydney)
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlots.map((time) => {
              const booked = isSlotBooked(selectedDate, time);
              const past = isSlotPast(selectedDate, time);
              const disabled = booked || past;
              const selected = selectedTime === time;

              return (
                <Button
                  key={time}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => onTimeSelect(time)}
                  className={cn(
                    "text-sm",
                    disabled && "opacity-40 cursor-not-allowed",
                    selected && "bg-primary text-primary-foreground"
                  )}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {time}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
