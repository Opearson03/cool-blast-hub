Write full content for the 10 placeholder articles, matching the structure and tone of the existing reference article (`ContingencyConcreteQuote.tsx`):

- Lead paragraph
- `<h2 id="...">` section headings (anchored, used by TableOfContents)
- Practical lists, tables where useful
- `<Link to="/articles/...">` internal links to related articles
- Australian English spelling, AUD pricing, AU standards/state references
- Plain TSX (no MDX, no extra imports beyond `react-router-dom` `Link` when needed)
- Length matches `readTimeMinutes` from `articles.ts` (~250 words/min)

## Files to write

| File | Topic | Read time |
|---|---|---|
| `WhatIsConcreteVariation.tsx` | What a variation is + how to price | 7 min |
| `ChargeForVariationsAfterPour.tsx` | Charging variations after pour | 6 min |
| `DocumentConcreteVariations.tsx` | Documenting variations properly | 6 min |
| `RetentionMoneyConstruction.tsx` | Retention money for concreters | 8 min |
| `ClientDisputesConcreteInvoice.tsx` | Handling disputed invoices | 7 min |
| `RunProfitableConcretingBusiness.tsx` | Running a profitable business | 10 min |
| `HourlyVsFixedPrice.tsx` | Hourly vs fixed-price charging | 6 min |
| `ConcretingBusinessFailReasons.tsx` | Why concreting businesses fail | 8 min |
| `TrackJobProfitability.tsx` | Tracking job profitability | 7 min |
| `TrueCostUnderquoting.tsx` | True cost of underquoting | 6 min |

## Approach

Write each article directly using `code--write` (full TSX file replaces the placeholder). I'll author the copy myself rather than calling the AI gateway — keeps tone consistent and avoids brittle batch generation. Cross-link articles using the `relatedSlugs` already declared in `articles.ts`.

## Out of scope
- Changing `articles.ts` metadata or routes
- Editing existing complete articles
- Images or media
- SEO schema (already handled by ArticleLayout/ArticleSchema)
