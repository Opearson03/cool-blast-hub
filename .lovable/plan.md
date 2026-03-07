

## Fix: Sub-Trade Invite "non-2xx" Error Handling

### Root Cause
When the `send-subtrade-invite` edge function returns a 409 (duplicate invite), `supabase.functions.invoke()` puts the HTTP error in its `error` field as a generic `FunctionsHttpError` with the message "Edge Function returned a non-2xx status code". The JSON body containing the actual error message and `DUPLICATE_INVITE` code is lost.

The same issue affects `send-batch-subtrade-invite`.

### Fix

**1. Update `useSendSubTradeInvite` hook** (`src/hooks/useSubTradeInvites.ts`)

Change the `mutationFn` to handle non-2xx responses by reading the response body from the error object. `FunctionsHttpError` has a `.context` property containing the original `Response`, which can be parsed to extract the error message and code.

```typescript
const { data: result, error } = await supabase.functions.invoke(...);

if (error) {
  // Try to extract the JSON body from FunctionsHttpError
  try {
    const errorBody = await error.context.json();
    const err = new Error(errorBody.error || error.message) as any;
    err.code = errorBody.code;
    throw err;
  } catch {
    throw error;
  }
}
```

Apply the same pattern to `useSendBatchSubTradeInvite`.

**2. Add DUPLICATE_INVITE handling to SubTradeInviteDialog** (`src/components/jobs/SubTradeInviteDialog.tsx`)

In both `handleSendExistingSubbie` and `onSubmit` catch blocks, check for `error.code === "DUPLICATE_INVITE"` and show a user-friendly toast instead of the generic error.

**3. Add DUPLICATE_INVITE handling to ScheduleSubbieDialog** (`src/components/schedule/ScheduleSubbieDialog.tsx`)

Same pattern -- show a clear "already invited" message when the duplicate code is detected.

### Impact
- All invite flows will show clear "already has an active invite" messages instead of cryptic errors
- No edge function changes needed -- only client-side error parsing

