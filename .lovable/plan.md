

## Refine Waitlist Offer: Simple "Free Months" Referral System

### New Offer (replacing the old ranking/VIP system)
- **Join the waitlist** = 1 month FREE when PourHub launches
- **Refer a mate** (who signs up to the waitlist) = they get 1 month FREE, you get an additional month FREE
- **No cap** -- every referral earns another free month
- **No more**: VIP status, spots jumped, position ranking, progress bars, bonus quotes

### Files to Update

**1. `src/components/waitlist/WaitlistForm.tsx`** (success screen)
- Remove the "Your Progress" section (position, spots jumped, VIP badge, progress bar)
- Remove the milestone cards ("Refer 1 mate = jump 50 spots", "Refer 3 mates = VIP")
- Replace with a simple summary: "You've earned **X free months** (1 for joining + Y referrals)"
- Keep the referral code display, email invite form, and share buttons (WhatsApp/SMS/Link)
- Update share messages to: "Join me on PourHub! We'll both get a month FREE."
- Remove unused imports: `Progress`, `Crown`, `Zap`, `TrendingUp`, `Rocket`
- Remove `WaitlistStatus` interface and the `get_waitlist_status` RPC call
- Simplify to just track `referral_count` from the `get_waitlist_status` response (or remove entirely since it's only shown post-signup)

**2. `src/pages/WaitlistStatus.tsx`** (status lookup page)
- Remove "Position Card" (effective position, spots jumped)
- Remove VIP badge section and founder badge section
- Remove "Progress to VIP" progress bar and milestone cards
- Replace with simple display: "Free months earned: X" (1 base + referral count)
- Keep the referral code, share buttons
- Update share messages to match new offer

**3. `supabase/functions/send-waitlist-welcome/index.ts`** (welcome email)
- Remove "Move up the list" / "jump ahead in the queue" copy
- Remove milestone cards ("Refer 1 mate = jump 50 spots", "Refer 3 mates = VIP")
- Replace with: "You've locked in your first month FREE! Refer a mate and you'll both get an extra month FREE."
- Keep referral code and link

**4. `supabase/functions/notify-referral-success/index.ts`** (referral notification email)
- Remove VIP progress section and spots-jumped references
- Update to: "You've earned another free month! You now have X free months total."
- Remove VIP countdown messaging

**5. `src/pages/Pricing.tsx`** (minor)
- Update badge text if needed (currently says "One month free trial")

### What stays the same
- The referral code system and `referral_count` column in the database
- The email invite functionality
- The WhatsApp/SMS/Link sharing
- The `join_waitlist` RPC and `get_referrer_by_code` RPC
- The database trigger that increments `referral_count` on the referrer

### No database changes needed
The existing `referral_count` column already tracks exactly what we need. The VIP/position columns can stay in the DB (harmless) -- we just stop using them in the UI.
