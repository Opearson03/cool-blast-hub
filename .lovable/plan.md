

## Hide Directory Buttons (Beta Feature)

### Overview
Hide the "Search Directory" / "Find in Directory" buttons from two admin pages while keeping all directory functionality intact (routes, pages, data collection). This way the feature continues to work if accessed directly, but isn't surfaced to users yet.

### Changes

**1. `src/components/contacts/SubbiesTab.tsx`**
- Remove the `extraAction` prop being passed to `ContactList` (the "Search Directory" button)
- This removes the button from the Sub-Contractors tab on the Contacts page

**2. `src/components/jobs/tabs/JobSubbiesTab.tsx`**
- Remove the "Find in Directory" button from the empty state (line ~92-96)
- Remove the "Find in Directory" button from the header area (line ~117-121)

### What stays
- All `/admin/directory` routes remain functional
- Directory data collection continues working
- Subcontractor registration and profiles remain active
- The buttons can be re-added later when the feature is ready to publish

