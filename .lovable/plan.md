

## Change PourHub Pro Price from $240 to $199

### What needs to change

**1. Create a new Stripe price** for the Pro product (`prod_TvWGfsM4uQs4od`) at $199/month (19900 cents AUD). The current price (`price_1SxfE0S7UIjxyz7Vdj3W8vBx`) is $240/month. Stripe prices are immutable, so a new price must be created and the old one archived.

**2. Update code references** (6 files):

| File | Change |
|------|--------|
| `src/lib/subscription-tiers.ts` | `price: 240` → `price: 199`, update `price_id` to new price, update comment |
| `supabase/functions/create-checkout/index.ts` | Update `PRICE_IDS.pro` to new price ID, update comment |
| `src/components/staff/SubscriptionMetrics.tsx` | `$240/mo` labels → `$199/mo`, MRR calc `proPaid * 240` → `proPaid * 199` |
| `src/pages/Pricing.tsx` | SEO description `$240` → `$199`, value prop `$240` → `$199` |
| `src/pages/AffiliateRegistration.tsx` | Example earnings text `$240/mo` → `$199/mo`, recalculate example ($1,990) |
| `supabase/functions/send-waitlist-invite/index.ts` | `"$240"` → `"$199"` |

### Existing subscribers
Existing Pro subscribers on the $240 price will remain on $240 until they cancel/re-subscribe, unless you want to migrate them (that would be a separate Stripe action). New signups will use the $199 price.

### Steps
1. Create new Stripe price on `prod_TvWGfsM4uQs4od` at 19900 AUD/month recurring
2. Update all 6 code files with the new price ID and $199 amount
3. Optionally archive the old $240 price in Stripe

