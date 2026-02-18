
## Add Churn Rate Tracker to Staff Dashboard

### Current State

The `business_subscriptions` table tracks `status` (active, canceled, past_due) but has no `canceled_at` timestamp. Without knowing *when* subscriptions were canceled, we can only show a lifetime total — not a meaningful monthly churn rate.

The `get_subscription_stats` RPC also doesn't return any cancellation data at all.

---

### What "Churn Rate" Will Show

- **Monthly churn rate** = cancellations this month ÷ active subscribers at start of month × 100
- **30-day cancellation count** — how many subscriptions went to `canceled` in the last 30 days
- **Month-over-month trend** — a small bar chart showing cancellations per month for the past 6 months
- **Net growth** = new subscriptions − cancellations (this month)

---

### Technical Plan

#### 1. Database Migration — Add `canceled_at` column + backfill

```sql
-- Add canceled_at to track when subscriptions were canceled
ALTER TABLE public.business_subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

-- Auto-set canceled_at via trigger when status changes to 'canceled'
CREATE OR REPLACE FUNCTION public.set_canceled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    NEW.canceled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_canceled_at
BEFORE UPDATE ON public.business_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_canceled_at();
```

#### 2. New RPC — `get_churn_stats`

A new Postgres function (staff-only, SECURITY DEFINER) that returns:
- `canceled_30d` — subscriptions canceled in last 30 days
- `canceled_7d` — subscriptions canceled in last 7 days  
- `new_30d` — new subscriptions in last 30 days
- `net_growth_30d` — new minus canceled
- `churn_rate_pct` — percentage churn rate this month
- `monthly_trend` — JSON array of `{ month, new_count, canceled_count }` for last 6 months

#### 3. New Component — `ChurnMetrics.tsx`

A new card in `src/components/staff/ChurnMetrics.tsx` that:
- Shows the monthly churn rate prominently (with color — green if low, red if high)
- Shows net growth (new subs minus cancellations) for the past 30 days
- Renders a bar chart (using Recharts, already installed) with 6 months of new vs. canceled subscriptions side-by-side

#### 4. Update `StaffDashboard.tsx`

- Add `get_churn_stats` RPC call alongside the existing `get_subscription_stats` query
- Add `ChurnMetrics` to the **Overview** tab alongside `SignupTrends` and `SubscriptionMetrics`
- Extend the real-time subscription to invalidate the new query when `business_subscriptions` changes (already subscribed to that table)

---

### Files to Change

| File | Change |
|---|---|
| New database migration | Add `canceled_at` column + trigger to `business_subscriptions`; create `get_churn_stats` RPC |
| `src/components/staff/ChurnMetrics.tsx` | New component — churn rate card with bar chart |
| `src/pages/staff/StaffDashboard.tsx` | Add `get_churn_stats` query + render `ChurnMetrics` in Overview tab |

---

### Note on Current Data

Since there are currently 0 canceled subscriptions, the churn rate will show 0% — which is correct. The moment a subscription is canceled via Stripe webhook (which already updates `status` to `canceled`), the trigger will fire and set `canceled_at`, and the dashboard will reflect it in real time.
