-- ============================================
-- RadPadi Complete Schema Migration
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

-- ACTIVITY LOGS 
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

-- CONTRAST LOGS
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

-- WEEKLY LOGS
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

-- STAFF LOGS (NEW)
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

-- EQUIPMENT LOGS (NEW)
CREATE TABLE IF NOT EXISTS equipment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID REFERENCES centres(id) ON DELETE CASCADE NOT NULL,
  modality TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HANDOVER NOTES (NEW)
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_activity_logs_centre_date ON activity_logs(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_contrast_logs_centre_date ON contrast_logs(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_logs_centre_date ON staff_logs(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_logs_staff_date ON staff_logs(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_centre ON equipment_logs(centre_id, is_ongoing);
CREATE INDEX IF NOT EXISTS idx_handover_notes_centre ON handover_notes(centre_id, date, acknowledged);
CREATE INDEX IF NOT EXISTS idx_weekly_logs_centre ON weekly_logs(centre_id, start_date);

-- ROW LEVEL SECURITY
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_centre_id()
RETURNS UUID AS $$
  SELECT centre_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS POLICIES (Using DO blocks to skip if they already exist, or just DROP IF EXISTS and CREATE)
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

-- Weekly Logs
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
