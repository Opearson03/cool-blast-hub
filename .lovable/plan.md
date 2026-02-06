
# Plan: Improve Email Classification and Fix "Supplier" Label

## Two Issues to Fix

### Issue 1: Email Classification Gets It Wrong

**Current Problem**: The classification uses a first-keyword-match approach that causes frequent misclassifications. For example, an email from a supplier like Forcon Products saying "Please Price this job" might get classified as a "Plan" instead of "Supplier" because keywords like "pricing" or "slab" in the filename trigger the building_plan classification before the quote_response check.

**Root Cause**: The `detectDocumentType` function in the backend email processing:
- Checks keyword categories in a fixed order (first match wins)
- Has no awareness of who the sender is (known supplier? known client?)
- Uses single-keyword matching with no weighting
- Overlapping keywords between categories cause false positives (e.g., "pricing" appears in both quote and plan keyword lists)

**Solution**: Implement a scoring-based classification system that:
1. Scores each category instead of first-match-wins
2. Checks if the sender is a known supplier contact (strong signal)
3. Uses weighted keyword matching (exact phrase matches score higher)
4. Analyzes email body text for additional context clues

### Issue 2: Reclassification Buttons Still Say "Quote"

**Current Problem**: The inbox list correctly shows "Supplier" for quote-type items, but when you open the detail sheet, the type badge shows "Quote" and the reclassification button also says "Quote" (visible in the screenshot).

**Solution**: Update the labels in `InboxDetailSheet.tsx` to use "Supplier" consistently.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/receive-test-email/index.ts` | Replace keyword-first-match with scoring-based classification, add sender lookup |
| `src/components/contacts/InboxDetailSheet.tsx` | Change "Quote" labels to "Supplier" in `getTypeLabel` and reclassify buttons |

---

## Technical Details

### 1. Scoring-Based Classification (Edge Function)

Replace the current `detectDocumentType` function with a `scoreDocumentType` approach:

```text
For each incoming email, calculate a score for each category:

1. KNOWN SENDER CHECK (highest priority, +60 points)
   - Query supplier_contacts table for sender email
   - If sender matches a known supplier -> +60 to quote_response

2. KEYWORD SCORING (weighted)
   - Exact phrase match: +15 points (e.g., "please find attached quote")
   - Single keyword match: +5 points (e.g., "quote")
   - Subject line keywords weighted 2x vs filename keywords

3. CONTEXTUAL PATTERNS (+20 points each)
   - "RE:" or "FW:" in subject with matching RFQ -> quote_response
   - Sender domain matches known supplier -> quote_response
   - "Please price/quote" = request TO the business -> building_plan
   - "Here is our quote/pricing" = response FROM supplier -> quote_response

4. ANTI-OVERLAP RULES
   - If "pricing" appears alongside "request" or "quote" -> favor quote_response
   - If "plan" or "drawing" appears alongside "price" -> favor building_plan
   - Exclude general/misc words from triggering work categories

Pick the category with the highest score. 
If no category scores above 10, default to "general".
```

### 2. Known Supplier Lookup

Add a query at the start of email processing:

```text
Before classifying:
1. Extract sender email domain
2. Query supplier_contacts where email ILIKE sender email
3. If match found -> strong signal for quote_response classification
4. Also check purchase_orders for any active RFQ sent to this email
```

### 3. Improved Keyword Lists

Reorganize keywords with weights:

```text
BUILDING_PLAN (incoming work requests):
  Strong (15pts): "please price", "please quote", "quote request", 
                  "pricing request", "tender", "scope of works"
  Medium (10pts): "plans attached", "drawings attached", "for pricing"
  Weak (5pts):    "plan", "drawing", "architectural", "structural",
                  "floor plan", "site plan", "footing", "slab"

QUOTE_RESPONSE (supplier replies):
  Strong (15pts): "here is our quote", "attached quote", "our pricing",
                  "as requested", "please find attached"
  Medium (10pts): "quotation", "price list", "cost breakdown", "unit rates"
  Weak (5pts):    "quote", "pricing"

TEST_RESULT:
  Strong (15pts): "test result", "lab result", "compressive strength",
                  "7 day result", "28 day result"
  Medium (10pts): "mpa", "cylinder", "slump test"
  Weak (5pts):    "test", "laboratory", "strength"

DELIVERY_DOCKET:
  Strong (15pts): "delivery docket", "concrete delivery", "batch ticket"
  Medium (10pts): "docket number", "cartage note"
  Weak (5pts):    "docket", "delivery", "dispatch", "truck", "load"

GENERAL (exclusions - if these match, reduce other scores):
  "invoice", "statement", "payment", "receipt", "newsletter",
  "unsubscribe", "marketing", "promotion"
```

### 4. Fix "Supplier" Labels in InboxDetailSheet.tsx

Two simple changes:

**getTypeLabel function (line 250)**:
- Change: `case "quote": return "Quote";`
- To: `case "quote": return "Supplier";`

**Reclassify button (line 647)**:
- Change: `Quote`
- To: `Supplier`

---

## Expected Improvements

| Scenario | Before | After |
|----------|--------|-------|
| Known supplier emails pricing | Classified as "Plan" | Classified as "Supplier" (sender match) |
| "Please Price this job" from unknown | Could be Plan or wrong | Classified as "Plan" (request TO business) |
| "Here is our quote" from supplier | Sometimes "Plan" | Classified as "Supplier" (response pattern) |
| Reply to sent RFQ | Sometimes "General" | Classified as "Supplier" (RFQ match) |
| Reclassify button label | Shows "Quote" | Shows "Supplier" |
| Detail sheet type badge | Shows "Quote" | Shows "Supplier" |

---

## Deployment Note

The edge function change requires redeployment of `receive-test-email`. This will be handled automatically. No database changes are needed.
