

## Enterprise Quoting Tool (Internal — Staff Dashboard)

A live, in-meeting quoting tool inside `/staff` that lets you build a custom PourHub Enterprise quote on the fly. Modelled directly on Wattle Workspace's quoting tool, but adapted to PourHub Enterprise's actual offering (concreting ops platform — not a generic agency).

### Where it lives
- New tab on the Staff Dashboard: **"Quoting"** (between CRM and Partners)
- Routes:
  - `/staff/quotes` — list of saved quotes
  - `/staff/quotes/new` — live quote builder (the main meeting tool)
  - `/staff/quotes/:id` — quote detail / share view

### The builder UI (sticky 2-column layout)

**Left column — selections (collapsible cards):**

A. **Client details** — Business name, contact, email, phone, est. team size, # of crews, # of concurrent jobs, region.

B. **Base platform tier** (price range, pick one):
- Enterprise Starter — $25k–$40k setup
- Enterprise Standard — $45k–$75k setup
- Enterprise Custom Build — $80k–$150k+ setup

C. **Module add-ons** (multi-select, each adds to subtotal):
Estimating at scale, Multi-site scheduling, Plant & vehicle tracking, Tool/equipment logs, Concrete testing & ITP compliance, Subbie marketplace integration, Custom dashboards & reporting, White-label client portal, Mobile crew app, Document management, Safety/SWMS module.

D. **Integrations** (multi-select, each with simple/moderate/advanced complexity):
Xero, MYOB, QuickBooks, Microsoft Teams, Procore, Aconex, Boral Connect, Heidelberg Hub, Employment Hero, Connecteam, Deputy, Dropbox, custom ERP.

E. **Complexity & urgency multipliers:**
- Complexity: Low (×1.0), Medium (×1.25), High (×1.5)
- Urgency: Standard (×1.0), Fast-track (×1.2), Rush (×1.4)

F. **Strategic / one-off fees:** Discovery & scoping, Data migration, Onboarding & training, Custom branding pack.

G. **Ongoing monthly support / SaaS plan:**
- Standard ($1,500/mo), Premium ($3,000/mo), White-glove ($5,000+/mo)

H. **Internal notes** — confidence rating, profit margin %, est. dev hours.

**Right column — sticky live calculation panel** showing:
- Base tier range
- Modules subtotal
- Integrations subtotal
- Multipliers applied
- Strategic fees
- **Estimate range** (low–high)
- **Recommended fixed setup quote** (bold, primary colour)
- **Monthly recurring** (support plan)

Mobile: calculation panel docks to bottom bar with the recommended quote always visible.

### Actions
- **Save as draft** — persists to DB
- **Save & view summary** — shareable internal summary page
- **Export PDF** (phase 2 — not in v1)
- **Quick-start templates** — pre-filled common configurations (e.g. "Mid-size 50-crew commercial", "Multi-state operator")

### Database (1 migration)

**`enterprise_quote_pricing_config`** — single config row, staff-editable later:
- `tiers`, `modules`, `integrations`, `support_plans`, `strategic_fees`, `complexity_multipliers`, `urgency_multipliers` (all JSONB)
- Seeded with defaults above

**`enterprise_quotes`** — saved quotes:
- Client fields, all selections (JSONB), all calculated totals, status, `created_by`, timestamps
- RLS: staff-only (uses existing `is_pourhub_staff()`)

**`enterprise_quote_templates`** — quick-start presets (JSONB selections + name)

### Files

**New:**
- `src/hooks/useEnterpriseQuotePricing.ts` — fetches config
- `src/hooks/useEnterpriseQuoteCalculation.ts` — pure calc logic (mirrors Wattle's)
- `src/components/staff/quotes/QuotingTab.tsx` — entry tab (recent quotes + "New Quote" CTA)
- `src/components/staff/quotes/QuoteBuilder.tsx` — main builder (left column)
- `src/components/staff/quotes/QuoteCalculationPanel.tsx` — sticky right panel
- `src/components/staff/quotes/sections/` — `ClientDetailsSection`, `TierSelector`, `ModuleSelector`, `IntegrationSelector`, `ComplexityControls`, `StrategicFeesSelector`, `SupportPlanSelector`
- `src/pages/staff/QuotesListPage.tsx`, `NewQuotePage.tsx`, `QuoteDetailPage.tsx`

**Modified:**
- `src/pages/staff/StaffDashboard.tsx` — add "Quoting" tab with `Calculator` icon
- `src/App.tsx` — add 3 staff quote routes (protected by existing staff guard)

### Calculation logic (same shape as Wattle)
```
buildLow  = (tierLow + modulesTotal + integrationsTotal) × complexity × urgency
buildHigh = (tierHigh + modulesTotal + integrationsTotal) × complexity × urgency
estimateLow  = round(buildLow × 0.9)
estimateHigh = round(buildHigh × 1.15)
recommendedQuote = round((buildLow + buildHigh) / 2 + strategicFees)
monthlySupport = selected support plan price
```

### Out of scope for v1
- Public-facing quote page / signature capture
- PDF export (placeholder button only)
- Editing pricing config via UI (edit rows directly in DB for now; admin UI is phase 2)

