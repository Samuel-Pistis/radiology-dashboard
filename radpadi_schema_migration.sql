-- ============================================
-- RadPadi Complete Schema Migration (FIXED)
-- Safe to run against existing database
-- ============================================

-- CENTRES
CREATE TABLE IF NOT EXISTS centres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES 
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'radiographer', 'radiology_user')),
  centre_id UUID REFERENCES centres(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if profiles already existed before and was missing them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS centre_id UUID REFERENCES centres(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- MODALITIES (referenced by AppContext)
-- ============================================
CREATE TABLE IF NOT EXISTS modalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATIONS (referenced by AppContext)
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRAST TYPES (referenced by AppContext)
-- ============================================
CREATE TABLE IF NOT EXISTS contrast_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY ACTIVITY LOGS (referenced by AppContext as daily_activity_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE,
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
-- DAILY CONTRAST RECORDS (referenced by AppContext as daily_contrast_records)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_contrast_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  morning JSONB DEFAULT '{}',
  afternoon JSONB DEFAULT '{}',
  night JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEEKLY OPERATIONS LOGS (referenced by AppContext as weekly_operations_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_operations_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE,
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

-- CENTRE SETTINGS
CREATE TABLE IF NOT EXISTS centre_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE UNIQUE NOT NULL,
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

-- ACTIVITY LOGS (shift-level)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
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
  UNIQUE(centre_id, date, shift)
);

-- CONTRAST LOGS (shift-level)
CREATE TABLE IF NOT EXISTS contrast_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  shift TEXT NOT NULL,
  logged_by UUID REFERENCES profiles(id) NOT NULL,
  logged_by_name TEXT NOT NULL,
  entries JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(centre_id, date, shift)
);

-- WEEKLY LOGS (legacy, keep for backwards compat)
CREATE TABLE IF NOT EXISTS weekly_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
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

-- STAFF LOGS
CREATE TABLE IF NOT EXISTS staff_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
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
  UNIQUE(centre_id, date, shift, staff_id)
);

-- EQUIPMENT LOGS (with columns the frontend expects)
CREATE TABLE IF NOT EXISTS equipment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
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

-- HANDOVER NOTES
CREATE TABLE IF NOT EXISTS handover_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_activity_logs_centre_date ON activity_logs(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_contrast_logs_centre_date ON contrast_logs(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_logs_centre_date ON staff_logs(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_logs_staff_date ON staff_logs(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_centre ON equipment_logs(centre_id, is_ongoing);
CREATE INDEX IF NOT EXISTS idx_handover_notes_centre ON handover_notes(centre_id, date, acknowledged);
CREATE INDEX IF NOT EXISTS idx_weekly_logs_centre ON weekly_logs(centre_id, start_date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_logs_date ON daily_activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_contrast_records_date ON daily_contrast_records(date);
CREATE INDEX IF NOT EXISTS idx_weekly_operations_logs_dates ON weekly_operations_logs(week_start_date);
CREATE INDEX IF NOT EXISTS idx_modalities_centre ON modalities(centre_id);
CREATE INDEX IF NOT EXISTS idx_locations_centre ON locations(centre_id);
CREATE INDEX IF NOT EXISTS idx_contrast_types_centre ON contrast_types(centre_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;
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

-- Helper function
CREATE OR REPLACE FUNCTION get_user_centre_id()
RETURNS UUID AS $$
  SELECT centre_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Admins read centre profiles" ON profiles;
CREATE POLICY "Admins read centre profiles" ON profiles FOR SELECT USING (
  centre_id = get_user_centre_id()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Centre Settings
DROP POLICY IF EXISTS "Centre members read settings" ON centre_settings;
CREATE POLICY "Centre members read settings" ON centre_settings FOR SELECT USING (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Admins manage settings" ON centre_settings;
CREATE POLICY "Admins manage settings" ON centre_settings FOR ALL USING (
  centre_id = get_user_centre_id()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Activity Logs
DROP POLICY IF EXISTS "Centre members read activity logs" ON activity_logs;
CREATE POLICY "Centre members read activity logs" ON activity_logs FOR SELECT USING (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Centre members insert activity logs" ON activity_logs;
CREATE POLICY "Centre members insert activity logs" ON activity_logs FOR INSERT WITH CHECK (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Authors or admins update activity logs" ON activity_logs;
CREATE POLICY "Authors or admins update activity logs" ON activity_logs FOR UPDATE USING (
  centre_id = get_user_centre_id()
  AND (logged_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
);

-- Contrast Logs
DROP POLICY IF EXISTS "Centre members read contrast logs" ON contrast_logs;
CREATE POLICY "Centre members read contrast logs" ON contrast_logs FOR SELECT USING (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Centre members insert contrast logs" ON contrast_logs;
CREATE POLICY "Centre members insert contrast logs" ON contrast_logs FOR INSERT WITH CHECK (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Authors or admins update contrast logs" ON contrast_logs;
CREATE POLICY "Authors or admins update contrast logs" ON contrast_logs FOR UPDATE USING (
  centre_id = get_user_centre_id()
  AND (logged_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
);

-- Weekly Logs (legacy table)
DROP POLICY IF EXISTS "Centre members read weekly logs" ON weekly_logs;
CREATE POLICY "Centre members read weekly logs" ON weekly_logs FOR SELECT USING (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Admins manage weekly logs" ON weekly_logs;
CREATE POLICY "Admins manage weekly logs" ON weekly_logs FOR ALL USING (
  centre_id = get_user_centre_id()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Staff Logs
DROP POLICY IF EXISTS "Staff read own logs" ON staff_logs;
CREATE POLICY "Staff read own logs" ON staff_logs FOR SELECT USING (
  centre_id = get_user_centre_id() AND staff_id = auth.uid()
);
DROP POLICY IF EXISTS "Admins read all staff logs" ON staff_logs;
CREATE POLICY "Admins read all staff logs" ON staff_logs FOR SELECT USING (
  centre_id = get_user_centre_id()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
DROP POLICY IF EXISTS "Staff insert own logs" ON staff_logs;
CREATE POLICY "Staff insert own logs" ON staff_logs FOR INSERT WITH CHECK (
  centre_id = get_user_centre_id() AND staff_id = auth.uid()
);
DROP POLICY IF EXISTS "Staff update own logs" ON staff_logs;
CREATE POLICY "Staff update own logs" ON staff_logs FOR UPDATE USING (
  centre_id = get_user_centre_id() AND staff_id = auth.uid()
);

-- Equipment Logs
DROP POLICY IF EXISTS "Centre members read equipment logs" ON equipment_logs;
CREATE POLICY "Centre members read equipment logs" ON equipment_logs FOR SELECT USING (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Centre members insert equipment logs" ON equipment_logs;
CREATE POLICY "Centre members insert equipment logs" ON equipment_logs FOR INSERT WITH CHECK (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Centre members update equipment logs" ON equipment_logs;
CREATE POLICY "Centre members update equipment logs" ON equipment_logs FOR UPDATE USING (centre_id = get_user_centre_id());

-- Handover Notes
DROP POLICY IF EXISTS "Centre members read handover notes" ON handover_notes;
CREATE POLICY "Centre members read handover notes" ON handover_notes FOR SELECT USING (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Centre members insert handover notes" ON handover_notes;
CREATE POLICY "Centre members insert handover notes" ON handover_notes FOR INSERT WITH CHECK (centre_id = get_user_centre_id());
DROP POLICY IF EXISTS "Centre members update handover notes" ON handover_notes;
CREATE POLICY "Centre members update handover notes" ON handover_notes FOR UPDATE USING (centre_id = get_user_centre_id());

-- ============================================
-- NEW TABLE RLS POLICIES
-- ============================================

-- Modalities: all authenticated users can read, admins can manage
DROP POLICY IF EXISTS "Authenticated users read modalities" ON modalities;
CREATE POLICY "Authenticated users read modalities" ON modalities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage modalities" ON modalities;
CREATE POLICY "Admins manage modalities" ON modalities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Locations: all authenticated users can read
DROP POLICY IF EXISTS "Authenticated users read locations" ON locations;
CREATE POLICY "Authenticated users read locations" ON locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage locations" ON locations;
CREATE POLICY "Admins manage locations" ON locations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Contrast Types: all authenticated users can read
DROP POLICY IF EXISTS "Authenticated users read contrast types" ON contrast_types;
CREATE POLICY "Authenticated users read contrast types" ON contrast_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage contrast types" ON contrast_types;
CREATE POLICY "Admins manage contrast types" ON contrast_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Daily Activity Logs: all authenticated users can read and insert
DROP POLICY IF EXISTS "Authenticated users read daily activity logs" ON daily_activity_logs;
CREATE POLICY "Authenticated users read daily activity logs" ON daily_activity_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users insert daily activity logs" ON daily_activity_logs;
CREATE POLICY "Authenticated users insert daily activity logs" ON daily_activity_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users update daily activity logs" ON daily_activity_logs;
CREATE POLICY "Authenticated users update daily activity logs" ON daily_activity_logs FOR UPDATE USING (true);

-- Daily Contrast Records: all authenticated users can read and manage
DROP POLICY IF EXISTS "Authenticated users read contrast records" ON daily_contrast_records;
CREATE POLICY "Authenticated users read contrast records" ON daily_contrast_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users insert contrast records" ON daily_contrast_records;
CREATE POLICY "Authenticated users insert contrast records" ON daily_contrast_records FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users update contrast records" ON daily_contrast_records;
CREATE POLICY "Authenticated users update contrast records" ON daily_contrast_records FOR UPDATE USING (true);

-- Weekly Operations Logs: all authenticated users can read, manage
DROP POLICY IF EXISTS "Authenticated users read weekly ops logs" ON weekly_operations_logs;
CREATE POLICY "Authenticated users read weekly ops logs" ON weekly_operations_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users insert weekly ops logs" ON weekly_operations_logs;
CREATE POLICY "Authenticated users insert weekly ops logs" ON weekly_operations_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users update weekly ops logs" ON weekly_operations_logs;
CREATE POLICY "Authenticated users update weekly ops logs" ON weekly_operations_logs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Authenticated users delete weekly ops logs" ON weekly_operations_logs;
CREATE POLICY "Authenticated users delete weekly ops logs" ON weekly_operations_logs FOR DELETE USING (true);
