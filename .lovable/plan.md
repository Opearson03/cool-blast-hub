

## Add Platform Disclaimer and Role-Specific Acknowledgements

### Overview
Add legal disclaimers to three places: the Terms and Conditions page, the subcontractor signup flow, and the business (user) signup flow. These protect PourHub by clearly establishing it as a technology platform only -- not an employer, recruiter, or labour hire company.

### 1. Terms and Conditions Page (`src/pages/TermsConditions.tsx`)

Add two new sections after the existing "Service Description" (section 2):

**Section 3: Platform Role and Disclaimer**
- PourHub does not employ, engage, recommend, assign or supply subcontractors to any user.
- PourHub operates solely as a technology platform that enables independent users to connect and enter into their own commercial arrangements.
- All agreements for the provision of services are made directly between users.

**Section 4: Subcontractor Directory**
- The Subcontractor Directory is a listing service only. Inclusion in the directory does not constitute an endorsement, recommendation, or guarantee of any subcontractor's qualifications, insurance, or work quality.
- Users engage subcontractors at their own risk and are responsible for conducting their own due diligence.

All subsequent sections will be renumbered (current sections 3-12 become 5-14). The "Last updated" date will change to February 2025.

### 2. Subcontractor Signup (`src/pages/subcontractors/SubcontractorSignup.tsx`)

Add a mandatory acknowledgement checkbox on **Step 4** (the final step, before "Complete Profile"):

The checkbox text will read:

> I acknowledge that I am an independent contractor and not employed, engaged or supplied by PourHub. I am solely responsible for my own insurance, licensing, WHS compliance, tax obligations, and superannuation.

- New state variable `independentAcknowledged` (boolean, default false)
- The "Complete Profile" button will be disabled until this checkbox is ticked
- The responsibilities will be displayed as a styled list for readability

### 3. Business Signup (`src/pages/Signup.tsx`)

Update the existing terms checkbox area to include an additional acknowledgement. Below the existing "I agree to Terms and Privacy Policy" checkbox, add a second mandatory checkbox:

> You acknowledge that any subcontractor contacted via PourHub is independently engaged by you and not supplied by PourHub. You are solely responsible for site safety, induction, supervision, insurance, and WHS obligations.

- New state variable `directoryAcknowledged` (boolean, default false)
- The "Continue to Payment" button will be disabled until both checkboxes are ticked
- Responsibilities displayed as a compact list

### Technical Details

**Files to modify:**
- `src/pages/TermsConditions.tsx` -- add 2 new sections, renumber existing ones, update date
- `src/pages/subcontractors/SubcontractorSignup.tsx` -- add acknowledgement checkbox + state on step 4
- `src/pages/Signup.tsx` -- add second acknowledgement checkbox + state

**No database changes required.** These are purely frontend/legal content additions. The acknowledgements are enforced via disabled submit buttons (same pattern as the existing terms checkbox on the business signup).

