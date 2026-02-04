# Memory: features/quotes/revision-workflow
Updated: now

Finalized and sent quotes are easily editable via a prominent 'Revise' button in the EstimateDetailSheet. This button opens the full estimating wizard while maintaining the quote's 'pending' status, allowing users to quickly modify pricing or scopes and resend the updated version without reverting to a draft.

**User Override Persistence:** To prevent quote totals from changing when reopening a quote for revision, the system persists `userOverrides` (a map of module ID → array of manually-edited field IDs) alongside `moduleAnswers`, `doneModules`, and other scope state. When the calculator remounts, it initializes from `initialUserOverrides` so that `deriveFrom` auto-calculations skip manually-adjusted fields. This ensures prices and values remain exactly as saved.
