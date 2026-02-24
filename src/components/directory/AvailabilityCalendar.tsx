import { useMemo } from "react";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface AvailabilityCalendarProps {
  unavailableDates: string[];
}

export function AvailabilityCalendar({ unavailableDates }: AvailabilityCalendarProps) {
  const { year, month, today, days, startOffset, monthLabel } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const todayStr = now.toISOString().slice(0, 10);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    // Monday = 0 .. Sunday = 6
    const firstDayOfWeek = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysArr = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { day: d, dateStr };
    });
    return {
      year: y,
      month: m,
      today: todayStr,
      days: daysArr,
      startOffset: firstDayOfWeek,
      monthLabel: now.toLocaleString("default", { month: "short", year: "numeric" }),
    };
  }, []);

  const busySet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground text-center">
        {monthLabel}
      </p>
      <div className="grid grid-cols-7 gap-px">
        {DAY_LABELS.map((label, i) => (
          <span
            key={i}
            className="text-[9px] font-medium text-muted-foreground text-center leading-none"
          >
            {label}
          </span>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map(({ day, dateStr }) => {
          const isToday = dateStr === today;
          const isBusy = busySet.has(dateStr);
          const isPast = dateStr < today;
          return (
            <span
              key={dateStr}
              className={`
                text-[9px] leading-none text-center rounded-sm aspect-square flex items-center justify-center
                ${isPast ? "text-muted-foreground/40" : ""}
                ${isBusy && !isPast ? "bg-destructive/20 text-destructive" : ""}
                ${!isBusy && !isPast ? "text-foreground" : ""}
                ${isToday ? "ring-1 ring-primary font-bold" : ""}
              `}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
