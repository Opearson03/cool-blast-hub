
# Fix: Remove Bar Chairs from Waffle Pod Topping Slab

## The Problem

Your boss is right -- bar chairs are being included on waffle pod estimates where they shouldn't be. On a waffle pod slab, the topping mesh sits directly on the pods and is supported by pod rails. There's no need for separate bar chairs to hold the mesh up.

Here's what's happening in the code:

1. The field `bar_chairs_count` is being auto-calculated as `pods x 3` (line 888-893 in ModularCalculator)
2. The reinforcement module then prices this as "Bar Chairs 25-40mm" line items on the estimate (lines 594-610 in reinforcement-raft.ts)
3. This adds unnecessary cost to every waffle pod quote

There's also a secondary bug: the same `bar_chairs_count` field is being calculated **twice** -- once as "pod rails = pods x 2" (line 871-877), then immediately overwritten as "bar chairs = pods x 3" (line 888-893). The pod rails calculation never takes effect because the bar chairs one runs right after and overwrites it.

## The Fix

### 1. Remove the bar chairs auto-calculation for waffle pods

In `ModularCalculator.tsx`, remove the "bar chairs: pods x 3" auto-calculation block (lines 888-894). The `bar_chairs_count` field should only be used for pod rails (pods x 2), which is already handled by the block at lines 871-877.

### 2. Remove the bar chairs line item from the reinforcement module

In `reinforcement-raft.ts`, remove the "Bar Chairs" accessories block (lines 594-610) that prices `barChairsCount` as bar chairs. These are not needed on waffle pod topping slabs because the pods and pod rails provide all the mesh support.

Pod rails are already correctly handled by the **Pods module** (`pods.ts`), so there's no gap -- rails are still quoted, just in the right place.

### 3. Clean up the UI label

In `WafflePodConfigCard.tsx`, the field currently labeled "Bar Chairs" with formula "pods x 3" should either be removed entirely (since pod rails are managed in the Pods module) or relabeled to match its actual purpose. Since pod rails are already handled by the Pods module with correct pricing, the cleanest approach is to remove this field from the accessories section.

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Remove the "bar chairs = pods x 3" auto-calc block (lines 888-894) |
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Remove the bar chairs line item block (lines 594-610) |
| `src/components/estimates/calculators/WafflePodConfigCard.tsx` | Remove the "Bar Chairs" input field from the accessories section |

## What stays the same

- **TM Chairs** for perimeter beams -- these are still needed and correctly calculated (perimeter / 1.2)
- **Pod Rails** -- still correctly handled by the Pods module with proper pack-of-20 pricing
- **Edge beam chairs** -- still correctly handled per-beam in the reinforcement module
- **4-way and 2-way spacers** -- unchanged, handled by the Pods module

## Risk Assessment

Low risk. These changes only remove an incorrect line item. No other calculations depend on `bar_chairs_count` downstream. The pod rails that `bar_chairs_count` was originally meant to track are already covered by the Pods module (`pod_rail_packs`), so removing this redundant field causes no gap.
