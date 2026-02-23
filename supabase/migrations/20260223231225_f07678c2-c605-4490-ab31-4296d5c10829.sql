-- Prevent duplicate contacts by email within a business
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractors_business_email
  ON subcontractors (business_id, LOWER(email))
  WHERE email IS NOT NULL;

-- Prevent duplicate contacts by phone within a business  
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcontractors_business_phone
  ON subcontractors (business_id, phone)
  WHERE phone IS NOT NULL;