

## Add "Book a Call" Button Below CTA Buttons

**File: `src/pages/Index.tsx` (lines 147-159)**

Add a centered "Book a Call" button below the existing two-button row, using a `Link` to `/bookings` with a `Phone` or `CalendarDays` icon.

```tsx
<div className="flex flex-col sm:flex-row gap-3 w-full">
  {/* existing Get Started + View Pricing buttons */}
</div>
<div className="flex justify-center w-full mt-3">
  <Link to="/bookings">
    <Button size="lg" variant="ghost" className="text-lg px-8 py-6 touch-target transition-all duration-300 hover:scale-[1.02]">
      <CalendarDays className="mr-2 w-5 h-5" />
      Book a Call
    </Button>
  </Link>
</div>
```

Single file change, ~6 lines added after the existing button `div`.

