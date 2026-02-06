-- Remove Demo/Exempt status from Oliver's business so tier-based gating applies
UPDATE businesses 
SET subscription_exempt = false 
WHERE id = '294ca231-1d8c-458f-a48f-93d827fdb8a3';