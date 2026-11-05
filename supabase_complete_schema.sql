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
-- FIN DE LA MIGRATION COMPLÈTE
-- ============================================================================
