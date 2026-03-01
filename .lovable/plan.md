

## Create PourHub Demo Business Account

Use the existing `create-demo-account` edge function to provision the account with these details:

- **Email**: admin@pourhub.com.au
- **Password**: Demo123
- **Owner Name**: Admin
- **Business Name**: Pourhub Demo Business
- **Subscription Exempt**: Yes (handled by the function)

### Steps
1. Call the `create-demo-account` edge function with the required parameters
2. Seed the `pourhub_staff` role for this user using the `seed-staff-users` function (if needed for internal access)
3. Verify the account was created successfully by querying the database

### Technical Detail
The `create-demo-account` function already sets `subscription_exempt: true` and `onboarding_completed: false`, creates the business, profile, and assigns the admin role -- so no custom code changes are needed.

