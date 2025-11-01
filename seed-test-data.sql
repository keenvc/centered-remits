-- Seed Test Data for Centered
-- Creates test user and patients for testing

-- ============================================
-- 1. Create Test User (if not exists)
-- ============================================
-- Note: You may need to create this via the app's signup flow
-- or update the password hash with bcrypt

-- Password: test123
-- This is a placeholder - you'll need to generate proper bcrypt hash
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   'doctor@centered.test',
--   '$2a$10$XQQJJjJJJJJJJJJJJJJJJuXXXXXXXXXXXXXXXXXXXXXX', -- bcrypt hash of 'test123'
--   NOW(),
--   NOW(),
--   NOW()
-- ) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. Seed Patients with Balances
-- ============================================

-- Clear existing test patients (optional)
-- DELETE FROM patients WHERE email LIKE '%@test.com';

-- Insert test patients with positive balances
INSERT INTO patients (
  id,
  first_name,
  last_name,
  email,
  cell_phone,
  date_of_birth,
  address_line1,
  city,
  state,
  zip_code,
  balance_cents,
  billing_status,
  sync_status,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'John',
  'Doe',
  'john.doe@test.com',
  '+1-555-0101',
  '1980-01-15',
  '123 Main St',
  'Los Angeles',
  'CA',
  '90001',
  15000,  -- $150.00 balance
  'overdue',
  'synced',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Jane',
  'Smith',
  'jane.smith@test.com',
  '+1-555-0102',
  '1975-05-22',
  '456 Oak Ave',
  'San Francisco',
  'CA',
  '94102',
  25000,  -- $250.00 balance
  'current',
  'synced',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Bob',
  'Johnson',
  'bob.johnson@test.com',
  '+1-555-0103',
  '1990-11-08',
  '789 Pine Rd',
  'San Diego',
  'CA',
  '92101',
  5000,  -- $50.00 balance
  'current',
  'synced',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Alice',
  'Williams',
  'alice.williams@test.com',
  '+1-555-0104',
  '1985-03-30',
  '321 Elm St',
  'Sacramento',
  'CA',
  '95814',
  35000,  -- $350.00 balance
  'overdue',
  'synced',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Charlie',
  'Brown',
  'charlie.brown@test.com',
  '+1-555-0105',
  '1992-07-19',
  '654 Maple Dr',
  'Oakland',
  'CA',
  '94601',
  0,  -- $0.00 balance (paid)
  'paid',
  'synced',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  balance_cents = EXCLUDED.balance_cents,
  billing_status = EXCLUDED.billing_status,
  updated_at = NOW();

-- ============================================
-- 3. Add Some Test Invoices for Patients
-- ============================================

WITH patient_ids AS (
  SELECT id, email FROM patients WHERE email LIKE '%@test.com' LIMIT 3
)
INSERT INTO invoices (
  id,
  patient_id,
  invoice_number,
  date_of_service,
  due_date,
  amount_cents,
  balance_cents,
  status,
  processor,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  'INV-TEST-' || LPAD((ROW_NUMBER() OVER ())::text, 5, '0'),
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '7 days',
  10000,
  5000,
  'unpaid',
  'inbox_health',
  NOW(),
  NOW()
FROM patient_ids p
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Add Some Test Payments
-- ============================================

WITH patient_ids AS (
  SELECT id FROM patients WHERE email LIKE '%@test.com' LIMIT 2
)
INSERT INTO payments (
  id,
  patient_id,
  amount_cents,
  payment_method,
  payment_date,
  status,
  processor,
  created_at
)
SELECT
  gen_random_uuid(),
  p.id,
  5000,
  'credit_card',
  CURRENT_DATE - INTERVAL '5 days',
  'completed',
  'square',
  NOW()
FROM patient_ids p
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Verification Queries
-- ============================================

-- Check seeded patients
SELECT 
  first_name,
  last_name,
  email,
  cell_phone,
  balance_cents,
  balance_cents / 100.0 as balance_dollars,
  billing_status
FROM patients 
WHERE email LIKE '%@test.com'
ORDER BY balance_cents DESC;

-- Check total counts
SELECT 
  'Patients' as entity,
  COUNT(*) as count
FROM patients
WHERE email LIKE '%@test.com'
UNION ALL
SELECT 
  'Invoices' as entity,
  COUNT(*) as count
FROM invoices i
JOIN patients p ON i.patient_id = p.id
WHERE p.email LIKE '%@test.com'
UNION ALL
SELECT 
  'Payments' as entity,
  COUNT(*) as count
FROM payments pm
JOIN patients p ON pm.patient_id = p.id
WHERE p.email LIKE '%@test.com';
