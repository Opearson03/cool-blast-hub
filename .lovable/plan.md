

## Improve Directory Location Search with Postcode Radius Filtering

### Problem
Currently, searching by postcode does an exact text match. A subcontractor based in 2000 (Sydney CBD) with a 50km radius won't show up if you search for 2010 (Surry Hills, 1km away). The `service_radius_km` field is stored but completely unused.

### Solution
Add a dedicated "Postcode" filter that calculates actual geographic distance between the searcher's postcode and each subcontractor's base postcode, then filters using each subcontractor's `service_radius_km`.

### Step 1 -- Australian Postcode Coordinates Table

Create a new database table `au_postcode_coords` with columns:
- `postcode` (text, primary key)
- `locality` (text) -- suburb/town name
- `lat` (numeric)
- `lng` (numeric)

Seed it with Australian postcode coordinate data (~2,800 postcodes). This is static reference data from the Australia Post / ABS dataset.

### Step 2 -- New RPC: `get_directory_profiles_near_postcode`

Create a server-side function that:
1. Looks up the lat/lng of the searcher's input postcode
2. Calculates the Haversine distance between that point and each subcontractor's `base_postcode`
3. Returns only subcontractors where the distance is within their `service_radius_km`
4. Falls back to showing all profiles if the postcode isn't found

```text
Input:  _postcode text (e.g. "2010")
Output: Same columns as get_public_directory_profiles + distance_km
Logic:
  1. Lookup lat/lng for _postcode from au_postcode_coords
  2. Lookup lat/lng for each subcontractor's base_postcode
  3. Calculate Haversine distance
  4. Filter: distance <= subcontractor's service_radius_km
  5. Order by distance ASC
```

### Step 3 -- Update Directory Filters

Add a dedicated **"Your Postcode"** input field to `DirectoryFilters`:
- A small text input (4-digit, Australian format)
- When populated, triggers the radius-based RPC instead of the basic one
- Shows distance on each card (e.g. "12km away")
- Clear button to reset back to showing all

### Step 4 -- Update Directory Page Logic

In `SubcontractorDirectory.tsx`:
- When a postcode is entered, call the new `get_directory_profiles_near_postcode` RPC
- When no postcode is entered, use the existing `get_public_directory_profiles` RPC
- Display distance badge on each card when postcode filtering is active

### Step 5 -- Show Distance on Cards

When postcode search is active, display a small badge like "12km away" on each `DirectoryCard` to help the user understand proximity.

---

### Technical Details

**Haversine formula in SQL:**
```text
-- Calculates distance in km between two lat/lng points
2 * 6371 * asin(sqrt(
  sin(radians(lat2 - lat1) / 2) ^ 2 +
  cos(radians(lat1)) * cos(radians(lat2)) *
  sin(radians(lng2 - lng1) / 2) ^ 2
))
```

**Postcode data source:** Australian Bureau of Statistics publishes postcode-to-coordinate mappings. We'll seed the table with ~2,800 rows covering all valid Australian postcodes.

**Privacy:** No new personal data is exposed. The searcher's postcode is only used for distance calculation server-side and isn't stored.

**Fallback behaviour:** If a subcontractor hasn't set a `service_radius_km`, default to 50km. If the entered postcode isn't found in the lookup table, show all results with a small info message.

### Files to Create/Modify
- **New migration**: Create `au_postcode_coords` table + seed data + new RPC
- **New hook**: `src/hooks/useDirectoryByPostcode.ts`
- **Edit**: `src/components/directory/DirectoryFilters.tsx` -- add postcode input
- **Edit**: `src/pages/directory/SubcontractorDirectory.tsx` -- conditional RPC logic
- **Edit**: `src/components/directory/DirectoryCard.tsx` -- optional distance badge
