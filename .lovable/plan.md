

## Unified Login + Subcontractor Landing Page Section

### Part 1: Unified Login for All User Types

Currently, the `/auth` login page only recognises `admin` and `staff` roles. If a subcontractor logs in there, they get "Access Denied" and are signed out. 

**Changes to `src/pages/Auth.tsx`:**
- Update `redirectBasedOnRole` to also check the `subcontractor` role via `supabase.rpc("is_subcontractor", { _user_id: userId })`
- If the user is a subcontractor, redirect to `/sub-contractors/dashboard`
- The check order will be: admin -> staff -> subcontractor -> try accept-invite -> re-check all three -> sign out with "Access Denied"

This means admins, employees, and subcontractors can all sign in from the same login page and get sent to the right place automatically.

### Part 2: Subcontractor Free Signup CTA on Landing Page

**Changes to `src/pages/Index.tsx`:**

Add a new section between the App Showcase and the final CTA section, styled to match the existing landing page design. This section will:

- Have a heading like "Are You a Tradie? Join the Free Directory"
- Explain the free benefits subcontractors get:
  - **Free directory listing** visible to local concreting businesses
  - **ABN-verified profile** to build trust and credibility
  - **Job invitations** directly from businesses in your area
  - **Availability calendar** so businesses know when you're free
  - **Work management dashboard** to track invited jobs and schedules
- Include a prominent "Sign Up Free" button linking to `/sub-contractors/signup`
- Use the existing dark section styling (bg-background) to contrast with adjacent sections

### Files Modified
1. **`src/pages/Auth.tsx`** - Add subcontractor role check in `redirectBasedOnRole`
2. **`src/pages/Index.tsx`** - Add new "For Tradies" section with free signup CTA

### No Database Changes Required
The `is_subcontractor` RPC function already exists and works correctly.

