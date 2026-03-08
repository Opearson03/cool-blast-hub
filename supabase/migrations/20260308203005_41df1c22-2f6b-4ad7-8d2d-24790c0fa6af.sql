INSERT INTO crm_leads (email, full_name, company_name, phone, source)
SELECT b.email, b.name, b.company, b.phone, 'booking'
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM crm_leads cl WHERE cl.email = b.email);