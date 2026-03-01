

## Delete Test Account: Olivers Concrete (OLIVER@CONCRETE.COM.AU)

### What Will Be Deleted
- **Business**: Olivers Concrete (`302211e5-7b2c-4fb4-a5e0-a936c7f72364`)
- **Users** (2):
  - Oliver Pearson (owner/admin) — `bc61c3c0-4b7a-4366-b160-2c0d8cdf1989`
  - Jake Thompson (staff) — `3166a290-8c27-4f0b-950a-360478607b68`
- **Subscription**: Pro plan, active (`81f2d18a-c621-4bf4-bb49-461e65f30dc1`)
  - Stripe customer: `cus_TnZp4xL7gXO9oA` / subscription: `sub_1Spyg1S7UIjxyz7VXBitioJv`

### Data to Remove (cascading order)
All data is scoped to this business only. Deletion order respects foreign key dependencies:

1. **takeoff_page_scales** (2 rows) -- depends on takeoff_files
2. **takeoff_markups** (5 rows) -- depends on estimate_takeoffs
3. **takeoff_files** (2 rows) -- depends on estimate_takeoffs
4. **estimate_takeoffs** (2 rows) -- depends on estimates
5. **estimate_items** (2 rows) -- depends on estimates
6. **estimates** (10 rows)
7. **pour_employees** (35 rows) -- depends on job_pours
8. **pour_equipment** (4 rows) -- depends on job_pours
9. **job_pours** (56 rows) -- depends on jobs
10. **project_startup** (8 rows) -- depends on jobs
11. **purchase_orders** (9 rows)
12. **jobs** (22 rows)
13. **crew_members** (2 rows) -- depends on crews
14. **crews** (3 rows)
15. **employee_tickets** (6 rows) -- depends on user profiles
16. **pending_plans** (5 rows)
17. **documents** (17 rows)
18. **equipment** (31 rows)
19. **price_list_items** (173 rows)
20. **supplier_contacts** (3 rows)
21. **subcontractors** (1 row)
22. **business_subscriptions** (1 row)
23. **user_roles** (2 rows)
24. **profiles** (2 rows)
25. **businesses** (1 row)
26. **auth.users** (2 users)

### Approach
Same pattern as the previous deletion: create a temporary edge function `delete-test-account` with hardcoded IDs that uses the service role key to bypass RLS. The function will delete all rows in the correct dependency order, then delete both auth user accounts. After confirming success, the function code will be removed from the project.

### Important
- Only data belonging to business `302211e5-7b2c-4fb4-a5e0-a936c7f72364` is touched
- No other accounts or businesses are affected
- The Stripe subscription/customer will remain in Stripe (can be cancelled separately if needed)

