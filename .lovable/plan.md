
## Update CRM Reply-To Address

The goal is to update the `replyTo` address for CRM campaigns to `info@pourhub.com.au` while maintaining the `hello@pourhub.au` sender identity.

### 1. Update `send-crm-email` Edge Function
I will modify the `send-crm-email` function to use the new reply-to address.

*   **File**: `supabase/functions/send-crm-email/index.ts`
*   **Change**: Update `replyTo: "crm@pourhub.au"` to `replyTo: "info@pourhub.com.au"`.

### 2. Critical Configuration for the In-App Inbox
As explained in the previous step, for these replies to appear in your **Staff Dashboard Inbox**, the domain `pourhub.com.au` must be configured in Resend to handle inbound emails.

**WARNING**: If `info@pourhub.com.au` is your primary business email (managed by Google Workspace, Microsoft 365, etc.), you **should not** point your main domain's MX records to Resend, as this will stop your regular emails from arriving in your normal inbox.

**Recommended Approaches**:
*   **Option A (Separate Inbox)**: If you want replies to go to your real mailbox (`info@pourhub.com.au`) and you **don't** need them to show up in the dashboard, this change is all you need.
*   **Option B (In-App Inbox)**: If you want the dashboard inbox to work, we should use a subdomain (e.g., `info@crm.pourhub.com.au`). This allows you to point MX records for the `crm` subdomain to Resend without affecting your main business email.

I will proceed with the update to `info@pourhub.com.au` as requested, but please be aware of the "No replies yet" behavior if the MX records aren't set up.

### Technical Details
*   Modify line 105 in `supabase/functions/send-crm-email/index.ts`.
*   Redeploy the edge function.
