

## Delete Test Account: oliver@wattledigital.com

### What Will Be Deleted
- **User**: Oliver Pearson (oliver@wattledigital.com)
- **User ID**: `40804101-be90-4cf4-b300-340b31c7830a`
- **Business**: Wattle Infrastructure (`294ca231-1d8c-458f-a48f-93d827fdb8a3`)
- **Subscription**: `1050924a-dde2-4d7c-abeb-f5307635b465` (estimating tier)
- **User role**: 1 role entry
- **No estimates or other users** are tied to this business, so it's safe to fully remove.

### Approach
Create a temporary backend function that:
1. Deletes `business_subscriptions` for the business
2. Deletes `user_roles` for the user
3. Deletes `profiles` for the user
4. Deletes `businesses` record
5. Deletes the auth user account
6. Returns confirmation

After confirming deletion, the temporary function will be removed from the codebase.

### Technical Detail
- A new edge function `delete-test-account` will be created with hardcoded IDs for safety
- It will use the service role key to bypass RLS
- After successful execution, the function file will be deleted from the project
