

# Fix: Quote Valid Date Not Showing in Top Section

## Problem

The quote "Valid Until" date shows correctly at the bottom of the quote (Page 2 payment terms says "This quote is valid for 14 days from the date of issue") but shows "-" in the top section of both Classic and Simple templates.

## Root Cause

Two separate fields exist:
- `quote_validity_days` (e.g. 14) -- set by the user in the Payment Terms section of the estimate form
- `valid_until` (an actual date) -- never auto-calculated from `quote_validity_days`

The top section displays `valid_until` (which is null), while the bottom section uses `quote_validity_days` (which has a value). They are never connected.

## Solution

**Auto-calculate `valid_until` from `quote_validity_days` when saving the estimate.** This ensures the actual date is always populated when the user sets a validity period.

Additionally, add a fallback in the PrintableEstimate so that if `valid_until` is still null (e.g. for older estimates), it computes the date from `created_at + quote_validity_days`.

## Technical Details

### File 1: `src/components/estimates/EstimateFormDialog.tsx`

In the save function (around line 1365), replace:
```
valid_until: formData.valid_until || null,
```
with logic that auto-computes valid_until from `created_at + quoteValidityDays` if the user hasn't manually entered a date. This covers all new and edited estimates going forward.

### File 2: `src/components/estimates/PrintableEstimate.tsx`

Add a computed `validUntilDate` near the top of the render function (around line 727) that falls back to `created_at + quote_validity_days` when `valid_until` is null. Then use this computed date in both templates:

- **Simple template** (line 850): Use the computed date instead of raw `estimate.valid_until`
- **Classic template** (line 1129): Use the computed date instead of raw `estimate.valid_until`

This ensures older estimates without a stored `valid_until` still display the correct date based on `quote_validity_days`.

### No database changes needed

The `valid_until` column already exists and accepts date strings. This is purely a front-end logic fix.
