

# Articles / SEO Content Hub for PourHub

## Overview

Create a `/articles` section on the public website with 22 individual SEO-optimised article pages, plus an articles index page. Each article will be a standalone page with full SEO meta tags, structured content, internal linking, and a consistent layout.

## Architecture

### New Files

**1. Shared Article Layout Component**
- `src/components/articles/ArticleLayout.tsx` -- Reusable wrapper with header, back link, table of contents sidebar, article body, related articles footer, and CTA (non-salesy, e.g. "Explore PourHub")
- `src/components/articles/ArticleCard.tsx` -- Card component for the index page listing
- `src/components/articles/TableOfContents.tsx` -- Auto-generated from headings for long-form content
- `src/components/articles/RelatedArticles.tsx` -- Shows 2-3 related articles at the bottom

**2. Article Data File**
- `src/data/articles.ts` -- Central registry of all articles with metadata (slug, title, description, keywords, category, publishDate, readTime). This keeps routing and the index page data-driven.

**3. Articles Index Page**
- `src/pages/Articles.tsx` -- Lists all articles grouped by category (Quoting, Standards, Technical, Variations, Business). Includes SEO head, filtering by category, and clean card-based layout.

**4. Individual Article Pages (22 files)**

Each article will be its own page component under `src/pages/articles/`:

**Category 1: Quoting and Pricing (6 articles)**
- `HowToQuoteConcreteSlab.tsx` -- /articles/how-to-quote-concrete-slab-australia
- `ConcretePricingPerSqm.tsx` -- /articles/concrete-pricing-per-square-metre-australia
- `WhatConcretersForgetInQuotes.tsx` -- /articles/what-concreters-forget-in-quotes
- `StripFootingsVsRaftSlabs.tsx` -- /articles/strip-footings-vs-raft-slabs-quoting
- `ContingencyConcreteQuote.tsx` -- /articles/contingency-concrete-quote
- `FixedPriceConcreteQuotes.tsx` -- /articles/fixed-price-concrete-quotes

**Category 2: Australian Standards (5 articles)**
- `AustralianStandardsResidentialConcrete.tsx` -- /articles/australian-standards-residential-concrete
- `AS2870ExplainedSimply.tsx` -- /articles/as-2870-explained-simply
- `EngineerConcreteSlabNSW.tsx` -- /articles/do-you-need-engineer-concrete-slab-nsw
- `ConcreteSlumpTesting.tsx` -- /articles/concrete-slump-testing-requirements-australia
- `ConcreteStrengthCompliance.tsx` -- /articles/concrete-strength-compliance-responsibility

**Category 3: Technical and Calculations (5 articles)**
- `HowMuchConcreteDoINeed.tsx` -- /articles/how-much-concrete-do-i-need
- `ConcreteStrengthGrades.tsx` -- /articles/concrete-strength-grades-australia
- `SteelReinforcementSlab.tsx` -- /articles/steel-reinforcement-required-for-slab
- `WafflePodSlabs.tsx` -- /articles/waffle-pod-slabs-pros-cons-cost
- `ConcreteWasteAllowance.tsx` -- /articles/concrete-waste-allowance

**Category 4: Variations, Contracts and Getting Paid (5 articles)**
- `WhatIsConcreteVariation.tsx` -- /articles/what-is-concrete-variation
- `ChargeForVariationsAfterPour.tsx` -- /articles/charge-for-variations-after-pour
- `DocumentConcreteVariations.tsx` -- /articles/document-concrete-variations
- `RetentionMoneyConstruction.tsx` -- /articles/retention-money-construction-concreters
- `ClientDisputesConcreteInvoice.tsx` -- /articles/client-disputes-concrete-invoice

**Category 5: Business Operations (5 articles)**
- `RunProfitableConcretingBusiness.tsx` -- /articles/run-profitable-concreting-business-australia
- `HourlyVsFixedPrice.tsx` -- /articles/concreters-hourly-vs-fixed-price
- `ConcretingBusinessFailReasons.tsx` -- /articles/concreting-business-fail-reasons
- `TrackJobProfitability.tsx` -- /articles/track-job-profitability-concrete
- `TrueCostUnderquoting.tsx` -- /articles/true-cost-underquoting-concrete-jobs

### Routing Changes

**`src/App.tsx`** -- Add routes:
- `/articles` -- Articles index
- `/articles/:slug` -- Individual article pages (using a single route with slug-based lookup, or 22 explicit routes)

The cleanest approach: use a single `ArticlePage.tsx` that reads the slug from the URL and renders the matching article content from the data file. This avoids 22 separate route entries.

### SEO Optimisation Per Article

Each article will include:
- **SEOHead** with `type="article"`, unique title (under 60 chars), meta description (under 155 chars), targeted keywords, and canonical path
- **Structured data** (JSON-LD) for Article schema markup (headline, author "PourHub", datePublished, description)
- **H1** matching the search intent exactly
- **H2/H3 subheadings** using related long-tail keywords
- **Internal links** to related articles within the content
- **Australian English spelling** throughout (e.g. "optimise", "organise", "labour")
- **Read time estimate** displayed at the top
- **Last updated date** for freshness signals

### Sitemap and Robots Updates

**`public/sitemap.xml`** -- Add entries for `/articles` and all 22 individual article URLs with appropriate priority (0.8 for index, 0.7 for individual articles).

### Content Approach

- Each article will be 800-1,500 words of genuinely helpful, plain-English content
- No hard selling of PourHub -- articles give real advice
- Subtle PourHub mentions only where naturally relevant (e.g. "Tools like job management software can help track this")
- Tables, bullet points, and clear structure for featured snippet eligibility
- Australian-specific data, standards references, and terminology

## Implementation Sequence

Due to the volume (22 articles + infrastructure), this should be broken into batches:

1. **Batch 1**: Article infrastructure (layout components, data file, index page, routing, JSON-LD component)
2. **Batch 2**: Category 1 articles (Quoting and Pricing -- 6 articles)
3. **Batch 3**: Category 2 articles (Australian Standards -- 5 articles)
4. **Batch 4**: Category 3 articles (Technical and Calculations -- 5 articles)
5. **Batch 5**: Category 4 articles (Variations and Contracts -- 5 articles)
6. **Batch 6**: Category 5 articles (Business Operations -- 5 articles)
7. **Batch 7**: Sitemap update, final cross-linking, and review

Each batch would be a separate prompt to keep changes manageable and reviewable.

## Technical Details

### Article Data Structure
```typescript
interface Article {
  slug: string;
  title: string;
  metaTitle: string; // SEO-optimised, under 60 chars
  metaDescription: string; // Under 155 chars
  keywords: string;
  category: 'quoting' | 'standards' | 'technical' | 'variations' | 'business';
  categoryLabel: string;
  publishDate: string;
  lastUpdated: string;
  readTimeMinutes: number;
  content: React.ComponentType; // The article body component
}
```

### JSON-LD Schema Component
A new `ArticleSchema.tsx` component that injects structured data:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Organization", "name": "PourHub" },
  "datePublished": "...",
  "dateModified": "...",
  "publisher": { "@type": "Organization", "name": "PourHub" }
}
```

### Article Layout Features
- Responsive: single column on mobile, content + sidebar TOC on desktop
- Breadcrumbs: Home > Articles > [Category] > [Article Title]
- Share buttons (optional)
- "Back to Articles" navigation
- Related articles section at the bottom (2-3 cards)
- Consistent header/footer matching the public site style (dark charcoal theme)

