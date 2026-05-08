Remove the Team Feed widget from the employee dashboard.

Technical details:
- Remove `FeedWidget` import from `src/pages/employee/EmployeeDashboard.tsx`
- Remove the `<FeedWidget businessId={businessId} userId={userId} />` block rendered between the Expiring Tickets Alert and Upcoming Work sections