Bring `/articles` (index) and individual article pages in line with the new landing-page design language (font-display headings, eyebrow chips, primary accents, LandingShell chrome).

## Scope

Two files only — presentation changes, no data/routing changes.

### 1. `src/pages/Articles.tsx`
- Wrap content in `<LandingShell ctaHref="/signup" ctaLabel="Try PourHub free">` — removes bespoke header + footer.
- Hero:
  - Add eyebrow chip above h1: `<span className="eyebrow text-primary">Knowledge base</span>`
  - Add `font-display` to h1, bump weight/tracking to match landing hero scale.
- Category filter pills: keep functionality, restyle to match landing pill style (rounded-full, border, hover states using semantic tokens).
- Article grid: unchanged structure, but `ArticleCard` gets a light refresh (below).

### 2. `src/components/articles/ArticleCard.tsx`
- Add `font-display` to the card title.
- Replace `bg-primary/10` category chip with the `eyebrow` style for consistency.
- Slightly stronger hover (border + subtle lift) to match landing card treatment.

### 3. `src/components/articles/ArticleLayout.tsx` (individual article pages)
- Replace bespoke header with the same sticky header pattern used in LandingShell (Logo + wordmark + small "All Articles" link on the right). Cannot use LandingShell directly because article pages need the "All Articles" link instead of a CTA button — so mirror its styling inline.
- Add `font-display` to h1 and to prose `h2`/`h3` (via prose class overrides).
- Restyle category chip in article header to `eyebrow` style.
- Footer: simplify to match LandingShell footer (copyright left, Privacy/Terms right).
- Bottom CTA strip: keep, but restyle heading with `font-display` and use `bg-primary` accent button matching EOFY/landing CTA section.

## Out of scope
- Article body content (MDX/TSX article files)
- TOC, RelatedArticles, ArticleSchema components
- Routing, SEO metadata, data in `src/data/articles.ts`
- Any new images
