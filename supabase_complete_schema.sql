-- ============================================================================
-- YED FEL YED (يد في يد) — MASTER SUPABASE DATABASE SCHEMA & MIGRATION
-- Project : https://rmlmovunysnwotwynpsj.supabase.co
-- Target  : Supabase PostgreSQL (Production & Demo Ready)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ENUMS (TYPES ÉNUMÉRÉS)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE institutional_role AS ENUM (
    'national_admin',
    'wilaya_admin',
    'local_coordinator',
    'mission_lead',
    'national_auditor'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE institutional_user_status AS ENUM (
    'active',
    'pending_activation',
    'suspended',
    'deactivated'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE operation_workflow_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'published',
    'in_progress',
    'completed',
    'closed',
    'rejected',
    'suspended',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. TABLES DE BASE DU SITE (CMS & CONTENU PUBLIC)
-- ============================================================================

-- 3.1 Événements
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    institution TEXT NOT NULL,
    image_data_url TEXT,
    category_id TEXT,
    requires_registration BOOLEAN NOT NULL DEFAULT true,
    published BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'open',
    hours TEXT,
    conditions TEXT,
    capacity INT DEFAULT 30,
    registered_count INT DEFAULT 0,
    wilaya_code INT,
    commune TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Annonces officielles
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    open_from TEXT,
    open_until TEXT,
    max_slots INT DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT true,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Activités des maisons de jeunes
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    day TEXT,
    month TEXT,
    location TEXT NOT NULL,
    institution TEXT NOT NULL,
    image_data_url TEXT,
    category_id TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'open',
    hours TEXT,
    conditions TEXT,
    capacity INT DEFAULT 25,
    registered_count INT DEFAULT 0,
    wilaya_code INT,
    commune TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 Établissements & Maisons de jeunes
CREATE TABLE IF NOT EXISTS public.institutions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT,
    image_data_url TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    wilaya_code INT,
    commune TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    structure_kind TEXT,
    authority TEXT,
    is_verified BOOLEAN DEFAULT true,
    email TEXT,
    hours TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 Actualités
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT NOT NULL,
    category_id TEXT,
    date TEXT NOT NULL,
    image_data_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT true,
    wilaya_code INT,
    commune TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 Inscrits / Émargements simples
CREATE TABLE IF NOT EXISTS public.registrants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    qr_code TEXT UNIQUE NOT NULL,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    birth_date TEXT,
    birth_place TEXT,
    national_id TEXT,
    points INT NOT NULL DEFAULT 0,
    announcement_id TEXT,
    event_id TEXT,
    activity_id TEXT,
    is_demo BOOLEAN DEFAULT false,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 Associations partenaires
CREATE TABLE IF NOT EXISTS public.associations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    logo_data_url TEXT,
    sector_id TEXT NOT NULL,
    ccp_account TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 Sites de collecte SOS
CREATE TABLE IF NOT EXISTS public.sos_collection_sites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    phone TEXT,
    responsible_name TEXT,
    aid_categories TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    admin_note TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.9 Sites sinistrés SOS
CREATE TABLE IF NOT EXISTS public.sos_damaged_sites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    damage_type TEXT,
    severity TEXT,
    aid_categories TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    admin_note TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.10 Participations bénévoles
CREATE TABLE IF NOT EXISTS public.participations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    fingerprint TEXT NOT NULL,
    volunteer_id TEXT NOT NULL,
    activity_title TEXT NOT NULL,
    activity_date DATE NOT NULL,
    category_id TEXT NOT NULL,
    activity_type_id TEXT NOT NULL DEFAULT 'standard',
    duration_id TEXT NOT NULL DEFAULT 'h2_4',
    responsibility_id TEXT NOT NULL DEFAULT 'participant',
    hours_counted NUMERIC(5, 2) NOT NULL DEFAULT 0,
    points_awarded INT NOT NULL DEFAULT 0,
    original_points INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'validated',
    author_id TEXT,
    author_name TEXT,
    author_role TEXT,
    author_wilaya_code INT,
    changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 4. MODULE DES BÉNÉVOLES, POINTS & GAMIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.volunteer_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    birth_date DATE,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    volunteer_code TEXT UNIQUE NOT NULL,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    accepted_terms_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    public_profile_consent BOOLEAN DEFAULT true,
    show_wilaya_in_leaderboard BOOLEAN DEFAULT true,
    completed_challenges TEXT[] DEFAULT '{}',
    special_awards TEXT[] DEFAULT '{}',
    earned_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    avatar_url TEXT,
    bio TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.volunteer_point_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    volunteer_id TEXT NOT NULL REFERENCES public.volunteer_accounts(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    reason TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual_adjustment',
    mission_title TEXT,
    reference_id TEXT,
    participation_id TEXT,
    corrected_transaction_id TEXT,
    admin_note TEXT,
    author_id TEXT,
    author_name TEXT,
    author_role TEXT,
    author_wilaya_code INT,
    status TEXT NOT NULL DEFAULT 'validated',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 5. MODULE SOS EXTENSION (APPELS D'URGENCE & BESOINS MATÉRIELS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sos_material_needs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reference TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    required_quantity NUMERIC(12, 2) NOT NULL CHECK (required_quantity > 0),
    unit TEXT NOT NULL DEFAULT 'unités',
    received_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    deadline DATE,
    status TEXT NOT NULL DEFAULT 'validated',
    admin_note TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sos_donations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    material_need_id TEXT NOT NULL REFERENCES public.sos_material_needs(id) ON DELETE CASCADE,
    donor_name TEXT NOT NULL,
    donor_phone TEXT NOT NULL,
    donor_email TEXT,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    quantity_pledged NUMERIC(12, 2) NOT NULL CHECK (quantity_pledged > 0),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sos_calls (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reference TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mission_type TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    volunteers_needed INT NOT NULL CHECK (volunteers_needed > 0),
    volunteers_registered INT NOT NULL DEFAULT 0,
    volunteers_present INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TEXT,
    end_time TEXT,
    required_skills TEXT[] DEFAULT '{}',
    urgency TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'active',
    supervising_authority TEXT DEFAULT 'DJS',
    admin_note TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sos_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    call_id TEXT NOT NULL REFERENCES public.sos_calls(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    experience_notes TEXT,
    qr_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    volunteer_account_id TEXT,
    points_awarded INT DEFAULT 0,
    admin_notes TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sos_interventions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    mission_type TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    volunteers_count INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    supervising_authority TEXT DEFAULT 'DJS',
    description TEXT,
    lead_name TEXT,
    lead_phone TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 6. GOUVERNANCE & TRAÇABILITÉ INSTITUTIONNELLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.institutional_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role institutional_role NOT NULL,
    status institutional_user_status NOT NULL DEFAULT 'active',
    wilaya_code INT CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT,
    service_department TEXT,
    appointed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_by TEXT,
    created_by_name TEXT,
    created_by_role TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.institutional_operations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    operation_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    lead_user_id TEXT REFERENCES public.institutional_users(id) ON DELETE SET NULL,
    lead_name TEXT NOT NULL,
    workflow_status operation_workflow_status NOT NULL DEFAULT 'approved',
    required_volunteers INT NOT NULL DEFAULT 10,
    mobilized_volunteers INT NOT NULL DEFAULT 0,
    budget_allocated NUMERIC(12, 2) DEFAULT 0,
    budget_consumed NUMERIC(12, 2) DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.digital_attestations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    attestation_serial TEXT UNIQUE NOT NULL,
    volunteer_id TEXT NOT NULL,
    volunteer_name TEXT NOT NULL,
    operation_id TEXT REFERENCES public.institutional_operations(id) ON DELETE CASCADE,
    operation_title TEXT NOT NULL,
    total_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
    issued_by_user_id TEXT REFERENCES public.institutional_users(id),
    issued_by_name TEXT NOT NULL,
    issued_by_role TEXT NOT NULL,
    qr_verification_code TEXT UNIQUE NOT NULL,
    is_demo BOOLEAN DEFAULT false,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_registry (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    wilaya_code INT,
    payload_hash TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT false
);

-- ============================================================================
-- 7. ÉCOSYSTÈME CONNECTÉ (POINTAGE QR, RAPPORTS DE MISSION & NOTIFICATIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.presence_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    volunteer_id TEXT NOT NULL,
    volunteer_name TEXT NOT NULL,
    volunteer_code TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_title TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out_at TIMESTAMPTZ,
    hours_calculated NUMERIC(5, 2) DEFAULT 0,
    points_awarded INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'checked_in',
    validated_by_id TEXT,
    validated_by_name TEXT,
    validation_mode TEXT DEFAULT 'qr_scan',
    notes TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mission_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mission_id TEXT NOT NULL,
    mission_title TEXT NOT NULL,
    mission_type TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune TEXT NOT NULL,
    date DATE NOT NULL,
    summary TEXT NOT NULL,
    achievements TEXT NOT NULL,
    difficulties TEXT,
    participants_count INT NOT NULL DEFAULT 0,
    hours_spent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_audit',
    auditor_id TEXT,
    auditor_name TEXT,
    audited_at TIMESTAMPTZ,
    audit_notes TEXT,
    reward_points_granted INT DEFAULT 0,
    is_demo BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    volunteer_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    points INT,
    badge_id TEXT,
    tier_id TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 8. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_collection_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_damaged_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_material_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique (Permettre aux visiteurs et au frontend de charger les données)
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public Read Activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public Read Institutions" ON public.institutions FOR SELECT USING (true);
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public Read Associations" ON public.associations FOR SELECT USING (true);
CREATE POLICY "Public Read Sos Collection Sites" ON public.sos_collection_sites FOR SELECT USING (true);
CREATE POLICY "Public Read Sos Damaged Sites" ON public.sos_damaged_sites FOR SELECT USING (true);
CREATE POLICY "Public Read Participations" ON public.participations FOR SELECT USING (true);
CREATE POLICY "Public Read Volunteer Accounts" ON public.volunteer_accounts FOR SELECT USING (true);
CREATE POLICY "Public Read Point Transactions" ON public.volunteer_point_transactions FOR SELECT USING (true);
CREATE POLICY "Public Read Sos Material Needs" ON public.sos_material_needs FOR SELECT USING (true);
CREATE POLICY "Public Read Sos Calls" ON public.sos_calls FOR SELECT USING (true);
CREATE POLICY "Public Read Sos Interventions" ON public.sos_interventions FOR SELECT USING (true);
CREATE POLICY "Public Read Operations" ON public.institutional_operations FOR SELECT USING (true);
CREATE POLICY "Public Read Attestations" ON public.digital_attestations FOR SELECT USING (true);
CREATE POLICY "Public Read Audit" ON public.audit_registry FOR SELECT USING (true);
CREATE POLICY "Public Read Presence Records" ON public.presence_records FOR SELECT USING (true);
CREATE POLICY "Public Read Mission Reports" ON public.mission_reports FOR SELECT USING (true);
CREATE POLICY "Public Read Notifications" ON public.notifications FOR SELECT USING (true);

-- Politiques d'écriture pour l'application (Dons, Inscriptions, Signalements, Comptes)
CREATE POLICY "Public Insert Registrants" ON public.registrants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Insert Donations" ON public.sos_donations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Insert Applications" ON public.sos_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Needs" ON public.sos_material_needs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Accounts" ON public.volunteer_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Transactions" ON public.volunteer_point_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage News" ON public.news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Participations" ON public.participations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Presence" ON public.presence_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Reports" ON public.mission_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Institutional Users" ON public.institutional_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Operations" ON public.institutional_operations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Attestations" ON public.digital_attestations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Manage Audit Registry" ON public.audit_registry FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKETS (AVATARS, EVENTS, REPORTS, ATTESTATIONS)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('events', 'events', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('reports', 'reports', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('attestations', 'attestations', true, 5242880, ARRAY['application/pdf', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politiques de sécurité pour les fichiers Storage
DO $$ BEGIN
  CREATE POLICY "Public Read Events Bucket" ON storage.objects FOR SELECT USING (bucket_id IN ('events', 'avatars', 'attestations'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public Insert Events Bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('events', 'avatars', 'reports'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public Update Events Bucket" ON storage.objects FOR UPDATE USING (bucket_id IN ('events', 'avatars'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 10. SYNCHRONISATION SUPABASE AUTH -> COMPTES BÉNÉVOLES (TRIGGER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.volunteer_accounts (
    id,
    email,
    first_name,
    last_name,
    phone,
    wilaya_code,
    commune,
    volunteer_code,
    points,
    status,
    is_verified
  ) VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', 'Bénévole'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE((new.raw_user_meta_data->>'wilaya_code')::int, 6),
    COALESCE(new.raw_user_meta_data->>'commune', 'Béjaïa'),
    'YFY-VOL-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4)),
    0,
    'active',
    true
  )
  ON CONFLICT (email) DO UPDATE
  SET id = EXCLUDED.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 11. PROCÉDURES STOCKÉES SÉCURISÉES (FONCTIONS BACKEND)
-- ============================================================================

-- 11.1 Attribution atomique et idempotente des points
CREATE OR REPLACE FUNCTION public.award_volunteer_points(
    p_volunteer_id TEXT,
    p_amount INT,
    p_reason TEXT,
    p_source TEXT DEFAULT 'manual_adjustment',
    p_reference_id TEXT DEFAULT NULL,
    p_mission_title TEXT DEFAULT NULL,
    p_admin_note TEXT DEFAULT NULL,
    p_author_id TEXT DEFAULT NULL,
    p_author_name TEXT DEFAULT NULL,
    p_author_role TEXT DEFAULT NULL,
    p_author_wilaya INT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_points INT;
    v_new_points INT;
    v_transaction_id TEXT;
    v_existing_tx TEXT;
BEGIN
    -- Idempotence : si une transaction avec cette référence existe déjà, ne rien faire
    IF p_reference_id IS NOT NULL THEN
        SELECT id INTO v_existing_tx FROM public.volunteer_point_transactions
        WHERE volunteer_id = p_volunteer_id AND reference_id = p_reference_id
        LIMIT 1;
        
        IF v_existing_tx IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'TRANSACTION_ALREADY_EXISTS',
                'transaction_id', v_existing_tx
            );
        END IF;
    END IF;

    -- Verrouillage de ligne pour mise à jour atomique sans collision
    SELECT points INTO v_current_points FROM public.volunteer_accounts
    WHERE id = p_volunteer_id
    FOR UPDATE;

    IF v_current_points IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'VOLUNTEER_NOT_FOUND');
    END IF;

    v_new_points := GREATEST(0, v_current_points + p_amount);

    UPDATE public.volunteer_accounts
    SET points = v_new_points, updated_at = timezone('utc'::text, now())
    WHERE id = p_volunteer_id;

    INSERT INTO public.volunteer_point_transactions (
        volunteer_id,
        amount,
        balance_after,
        reason,
        source,
        reference_id,
        mission_title,
        admin_note,
        author_id,
        author_name,
        author_role,
        author_wilaya_code,
        status
    ) VALUES (
        p_volunteer_id,
        p_amount,
        v_new_points,
        p_reason,
        p_source,
        p_reference_id,
        p_mission_title,
        p_admin_note,
        p_author_id,
        p_author_name,
        p_author_role,
        p_author_wilaya,
        'validated'
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'previous_points', v_current_points,
        'new_points', v_new_points
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11.2 Validation serveur du pointage présence QR Code
CREATE OR REPLACE FUNCTION public.process_qr_attendance(
    p_volunteer_code TEXT,
    p_target_type TEXT,
    p_target_id TEXT,
    p_target_title TEXT,
    p_wilaya_code INT,
    p_commune TEXT,
    p_action TEXT DEFAULT 'check_in',
    p_validator_id TEXT DEFAULT NULL,
    p_validator_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_vol public.volunteer_accounts;
    v_existing_presence public.presence_records;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_hours NUMERIC(5, 2) := 0;
    v_points INT := 10;
    v_rec_id TEXT;
BEGIN
    SELECT * INTO v_vol FROM public.volunteer_accounts
    WHERE volunteer_code = p_volunteer_code OR id = p_volunteer_code
    LIMIT 1;

    IF v_vol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'VOLUNTEER_CODE_INVALID');
    END IF;

    SELECT * INTO v_existing_presence FROM public.presence_records
    WHERE volunteer_id = v_vol.id AND target_id = p_target_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF p_action = 'check_in' THEN
        IF v_existing_presence.id IS NOT NULL AND v_existing_presence.status = 'checked_in' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'ALREADY_CHECKED_IN',
                'record_id', v_existing_presence.id,
                'check_in_at', v_existing_presence.check_in_at
            );
        END IF;

        INSERT INTO public.presence_records (
            volunteer_id,
            volunteer_name,
            volunteer_code,
            target_type,
            target_id,
            target_title,
            wilaya_code,
            commune,
            check_in_at,
            status,
            points_awarded,
            validated_by_id,
            validated_by_name,
            validation_mode
        ) VALUES (
            v_vol.id,
            v_vol.first_name || ' ' || v_vol.last_name,
            v_vol.volunteer_code,
            p_target_type,
            p_target_id,
            p_target_title,
            p_wilaya_code,
            p_commune,
            v_now,
            'checked_in',
            v_points,
            p_validator_id,
            p_validator_name,
            'qr_scan'
        ) RETURNING id INTO v_rec_id;

        -- Attribution automatique des 10 points
        PERFORM public.award_volunteer_points(
            v_vol.id,
            v_points,
            'Présence confirmée par QR : ' || p_target_title,
            'event_participation',
            'qr-presence-' || v_rec_id,
            p_target_title
        );

        -- Notification automatique
        INSERT INTO public.notifications (
            volunteer_id,
            type,
            title,
            message,
            points,
            link
        ) VALUES (
            v_vol.id,
            'presence_confirmed',
            'Présence validée (+10 pts)',
            'Votre présence à l''action "' || p_target_title || '" a été confirmée avec succès.',
            v_points,
            '/mon-espace'
        );

        RETURN jsonb_build_object(
            'success', true,
            'action', 'check_in',
            'record_id', v_rec_id,
            'volunteer_name', v_vol.first_name || ' ' || v_vol.last_name,
            'points_awarded', v_points
        );
    ELSE
        -- Sortie / Check-out
        IF v_existing_presence.id IS NULL OR v_existing_presence.status != 'checked_in' THEN
            RETURN jsonb_build_object('success', false, 'error', 'NO_ACTIVE_CHECKIN');
        END IF;

        v_hours := ROUND(EXTRACT(EPOCH FROM (v_now - v_existing_presence.check_in_at)) / 3600.0, 2);

        UPDATE public.presence_records
        SET 
            check_out_at = v_now,
            hours_calculated = v_hours,
            status = 'checked_out'
        WHERE id = v_existing_presence.id;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'check_out',
            'record_id', v_existing_presence.id,
            'hours', v_hours
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11.3 Validation de rapport de mission par l'Auditeur avec attribution de récompenses
CREATE OR REPLACE FUNCTION public.audit_mission_report(
    p_report_id TEXT,
    p_decision TEXT,
    p_auditor_id TEXT,
    p_auditor_name TEXT,
    p_audit_notes TEXT,
    p_reward_points INT DEFAULT 15
)
RETURNS JSONB AS $$
DECLARE
    v_report public.mission_reports;
    v_points_to_grant INT := 0;
BEGIN
    SELECT * INTO v_report FROM public.mission_reports
    WHERE id = p_report_id
    FOR UPDATE;

    IF v_report.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'REPORT_NOT_FOUND');
    END IF;

    IF v_report.status != 'pending_audit' THEN
        RETURN jsonb_build_object('success', false, 'error', 'REPORT_ALREADY_AUDITED', 'current_status', v_report.status);
    END IF;

    IF p_decision = 'approved' THEN
        v_points_to_grant := COALESCE(p_reward_points, 15);

        UPDATE public.mission_reports
        SET 
            status = 'validated',
            auditor_id = p_auditor_id,
            auditor_name = p_auditor_name,
            audited_at = timezone('utc'::text, now()),
            audit_notes = p_audit_notes,
            reward_points_granted = v_points_to_grant,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_report_id;

        PERFORM public.award_volunteer_points(
            v_report.author_id,
            v_points_to_grant,
            'Rapport de mission validé par l''audit : ' || v_report.mission_title,
            'sos_mission',
            'report-audit-' || p_report_id,
            v_report.mission_title,
            p_audit_notes,
            p_auditor_id,
            p_auditor_name,
            'national_auditor',
            v_report.wilaya_code
        );

        INSERT INTO public.notifications (
            volunteer_id,
            type,
            title,
            message,
            points,
            link
        ) VALUES (
            v_report.author_id,
            'report_validated',
            'Rapport validé (+ ' || v_points_to_grant || ' pts)',
            'Votre rapport pour "' || v_report.mission_title || '" a été approuvé par l''audit.',
            v_points_to_grant,
            '/mon-espace'
        );

        RETURN jsonb_build_object('success', true, 'status', 'validated', 'points_granted', v_points_to_grant);
    ELSE
        UPDATE public.mission_reports
        SET 
            status = 'rejected',
            auditor_id = p_auditor_id,
            auditor_name = p_auditor_name,
            audited_at = timezone('utc'::text, now()),
            audit_notes = p_audit_notes,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_report_id;

        INSERT INTO public.notifications (
            volunteer_id,
            type,
            title,
            message,
            link
        ) VALUES (
            v_report.author_id,
            'report_rejected',
            'Rapport nécessitant révision',
            'Remarque de l''auditeur : ' || COALESCE(p_audit_notes, 'Critères non remplis'),
            '/mon-espace'
        );

        RETURN jsonb_build_object('success', true, 'status', 'rejected');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DE LA MIGRATION COMPLÈTE
-- ============================================================================

