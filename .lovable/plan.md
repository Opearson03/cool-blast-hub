
## Update CRM Reply-To Address

The goal is to update the `replyTo` address in the CRM email sending function to `hello@pourhub.au`.

### 1. Update `send-crm-email` Edge Function
I will modify the `send-crm-email` function to use the new reply-to address.

*   **File**: `supabase/functions/send-crm-email/index.ts`
*   **Change**: Update `replyTo: "info@pourhub.com.au"` to `replyTo: "hello@pourhub.au"` on line 105.

### 2. Inbox Integration Considerations
As noted in previous updates, for replies to appear in the **Staff Dashboard Inbox**, the domain must be configured in Resend with appropriate MX records. 

*   Since the `from` address is also `hello@pourhub.au`, this change makes the sender and reply-to addresses identical.
*   If `hello@pourhub.au` is your primary business mailbox (e.g., managed by Google Workspace), replies will land in your standard inbox. They will only appear in the CRM Dashboard Inbox if Resend is configured to receive those inbound emails (which usually requires a subdomain for the dashboard inbox to avoid breaking your main email service).

I will proceed with the requested change to `hello@pourhub.au`.

### Technical Details
*   Modify line 105 in `supabase/functions/send-crm-email/index.ts`.
*   The function will be redeployed automatically.
