-- ============================================
-- RadPadi Single-Centre Schema Migration
-- Safe to run against existing database
-- ============================================

-- PROFILES 
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'radiographer', 'radiology_user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if profiles already existed before and was missing them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- MODALITIES
-- ============================================
CREATE TABLE IF NOT EXISTS modalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATIONS 
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRAST TYPES
-- ============================================
CREATE TABLE IF NOT EXISTS contrast_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY ACTIVITY LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  modality_id UUID REFERENCES modalities(id),
  location_id UUID REFERENCES locations(id),
  total_investigations INTEGER DEFAULT 0,
  film_10x12_used INTEGER DEFAULT 0,
  film_14x17_used INTEGER DEFAULT 0,
  revenue_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY CONTRAST RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_contrast_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  morning JSONB DEFAULT '{}',
  afternoon JSONB DEFAULT '{}',
  night JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEEKLY OPERATIONS LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_operations_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  challenges TEXT DEFAULT '',
  resolutions TEXT DEFAULT '',
  revenue JSONB DEFAULT '{}',
  investigations JSONB DEFAULT '[]',
  films JSONB DEFAULT '[]',
  contrast JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CENTRE SETTINGS (The single global settings row)
-- ============================================
CREATE TABLE IF NOT EXISTS centre_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT 'My Radiology Centre',
  address TEXT DEFAULT '',
  contact_info TEXT DEFAULT '',
  modalities JSONB DEFAULT '["CT","MRI","X-ray","Ultrasound","Fluoroscopy","Mammography"]',
  contrast_types JSONB DEFAULT '[
    {"name":"Jodascan","default_bottle_ml":50,"unit_cost":0},
    {"name":"Jodascan 300","default_bottle_ml":100,"unit_cost":0},
    {"name":"Hexopack 350","default_bottle_ml":100,"unit_cost":0},
    {"name":"Gastrolux","default_bottle_ml":250,"unit_cost":0},
    {"name":"MRI Contrast","default_bottle_ml":15,"unit_cost":0}
  ]',
  film_sizes JSONB DEFAULT '["14x17","10x12","8x10"]',
  shifts JSONB DEFAULT '[
    {"name":"Morning","start_time":"08:00","end_time":"16:00"},
    {"name":"Afternoon","start_time":"16:00","end_time":"00:00"},
    {"name":"Night","start_time":"00:00","end_time":"08:00"}
  ]',
  contrast_alerts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist in case the table is already present
ALTER TABLE centre_settings 
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'My Radiology Centre',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_info TEXT DEFAULT '';

-- ============================================
-- ACTIVITY LOGS (shift-level)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift TEXT NOT NULL,
  logged_by UUID REFERENCES profiles(id) NOT NULL,
  logged_by_name TEXT NOT NULL,
  investigations JSONB NOT NULL DEFAULT '[]',
  films JSONB NOT NULL DEFAULT '[]',
  challenges TEXT DEFAULT '',
  resolutions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, shift)
);

-- ============================================
-- CONTRAST LOGS (shift-level)
-- ============================================
CREATE TABLE IF NOT EXISTS contrast_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift TEXT NOT NULL,
  logged_by UUID REFERENCES profiles(id) NOT NULL,
  logged_by_name TEXT NOT NULL,
  entries JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, shift)
);

-- ============================================
-- WEEKLY LOGS (legacy)
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  logged_by UUID REFERENCES profiles(id) NOT NULL,
  investigations_summary JSONB DEFAULT '[]',
  films_summary JSONB DEFAULT '[]',
  contrast_summary JSONB DEFAULT '[]',
  revenue_summary JSONB DEFAULT '[]',
  challenges TEXT DEFAULT '',
  resolutions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS staff_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  staff_name TEXT NOT NULL,
  shift TEXT NOT NULL,
  procedures_performed JSONB NOT NULL DEFAULT '[]',
  total_procedures INTEGER DEFAULT 0,
  repeats JSONB DEFAULT '[]',
  total_repeats INTEGER DEFAULT 0,
  repeat_rate NUMERIC(5,2) DEFAULT 0,
  contrast_administered JSONB DEFAULT '[]',
  films_printed INTEGER DEFAULT 0,
  issues_encountered TEXT DEFAULT '',
  issues_resolved TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, shift, staff_id)
);

-- ============================================
-- EQUIPMENT LOGS 
-- ============================================
CREATE TABLE IF NOT EXISTS equipment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modality_id UUID REFERENCES modalities(id),
  modality_name TEXT,
  modality TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_ongoing BOOLEAN DEFAULT TRUE,
  reason_category TEXT CHECK (reason_category IN (
    'Mechanical failure','Electrical issue','Software error',
    'Scheduled maintenance','Calibration','Parts awaiting','Other'
  )),
  description TEXT DEFAULT '',
  resolution TEXT DEFAULT '',
  logged_by UUID REFERENCES profiles(id) NOT NULL,
  logged_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if equipment_logs already existed
ALTER TABLE equipment_logs ADD COLUMN IF NOT EXISTS modality_id UUID;
ALTER TABLE equipment_logs ADD COLUMN IF NOT EXISTS modality_name TEXT;
ALTER TABLE equipment_logs ADD COLUMN IF NOT EXISTS logged_by_name TEXT;

-- ============================================
-- HANDOVER NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS handover_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  from_shift TEXT NOT NULL,
  to_shift TEXT NOT NULL,
  flagged_by UUID REFERENCES profiles(id) NOT NULL,
  flagged_by_name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'Equipment issue','Pending procedure','Low stock','Patient follow-up','Other'
  )),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_contrast_logs_date ON contrast_logs(date);
CREATE INDEX IF NOT EXISTS idx_staff_logs_date ON staff_logs(date);
CREATE INDEX IF NOT EXISTS idx_staff_logs_staff_date ON staff_logs(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_ongoing ON equipment_logs(is_ongoing);
CREATE INDEX IF NOT EXISTS idx_handover_notes_date ON handover_notes(date, acknowledged);
CREATE INDEX IF NOT EXISTS idx_weekly_logs_start_date ON weekly_logs(start_date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_logs_date ON daily_activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_contrast_records_date ON daily_contrast_records(date);
CREATE INDEX IF NOT EXISTS idx_weekly_operations_logs_dates ON weekly_operations_logs(week_start_date);

-- ============================================
-- Drop foreign keys & columns for centre_id if they exist from before
-- ============================================
DO $$ 
DECLARE row record;
BEGIN
    FOR row IN 
        SELECT table_name, constraint_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = 'public' 
        AND table_name IN ('profiles', 'modalities', 'locations', 'contrast_types', 'daily_activity_logs', 'daily_contrast_records', 'weekly_operations_logs', 'centre_settings', 'activity_logs', 'contrast_logs', 'weekly_logs', 'staff_logs', 'equipment_logs', 'handover_notes')
    LOOP
        -- This is a blunt approach but effectively tries to drop constraints that *might* be on centre_id.
        -- We just drop the column later which cascades to drop the constraint anyway if we use CASCADE, but PostgreSQL syntax requires altering table drop column.
    END LOOP;
END $$;

-- Drop centre_id columns from tables
ALTER TABLE profiles DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE modalities DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE locations DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE contrast_types DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE daily_activity_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE daily_contrast_records DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE weekly_operations_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE centre_settings DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE contrast_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE weekly_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE staff_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE equipment_logs DROP COLUMN IF EXISTS centre_id CASCADE;
ALTER TABLE handover_notes DROP COLUMN IF EXISTS centre_id CASCADE;

-- Drop centres table entirely if it exists
DROP TABLE IF EXISTS centres CASCADE;

-- ============================================
-- ROW LEVEL SECURITY
-- All authenticated users can read/write data for a single-centre setup
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrast_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_contrast_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_operations_logs ENABLE ROW LEVEL SECURITY;

-- Helper function no longer needed
DROP FUNCTION IF EXISTS get_user_centre_id();

-- ============================================
-- RLS POLICIES (Simplified for Single Centre)
-- ============================================

-- Profiles: Users read all profiles (needed for logs, lookups), users update own, admins update all
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins read centre profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users read profiles" ON profiles;
CREATE POLICY "Authenticated users read profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Centre Settings (Global)
DROP POLICY IF EXISTS "Centre members read settings" ON centre_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON centre_settings;
DROP POLICY IF EXISTS "Authenticated users read settings" ON centre_settings;
CREATE POLICY "Authenticated users read settings" ON centre_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage global settings" ON centre_settings;
CREATE POLICY "Admins manage global settings" ON centre_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- For all operational data: allow read/insert/update/delete for authenticated users
-- (More granular policies could be added later, but this unblocks the single-centre app instantly)

DO $$ 
DECLARE
  t text;
  tables text[] := ARRAY['activity_logs', 'contrast_logs', 'weekly_logs', 'staff_logs', 'equipment_logs', 'handover_notes', 'modalities', 'locations', 'contrast_types', 'daily_activity_logs', 'daily_contrast_records', 'weekly_operations_logs'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "All authenticated users read %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "All authenticated users manage %I" ON %I;', t, t);
    
    EXECUTE format('CREATE POLICY "All authenticated users read %I" ON %I FOR SELECT USING (true);', t, t);
    EXECUTE format('CREATE POLICY "All authenticated users manage %I" ON %I FOR ALL USING (true);', t, t);
  END LOOP;
END $$;
