-- ============================================================================
-- MIGRATION EXTENSION MODULE SOS — YED FEL YED (يد في يد)
-- Version : 1.0.0
-- Description : Extension rétrocompatible du module SOS (Besoins matériels,
--               Appels à mobilisation, Candidatures, Équipes, Interventions,
--               Pointage QR et contrôle atomique de capacité).
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES DU MODULE SOS
-- ============================================================================

-- Table 2.1 : Besoins matériels humanitaires
CREATE TABLE IF NOT EXISTS public.sos_material_needs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'food_water', 'clothing_blankets', 'medical_supplies',
        'hygiene_products', 'construction_materials', 'technical_equipment',
        'shelter_housing', 'other'
    )),
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune VARCHAR(100) NOT NULL,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    required_quantity NUMERIC(12, 2) NOT NULL CHECK (required_quantity > 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'unités',
    received_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'validated' CHECK (status IN ('pending', 'validated', 'fulfilled', 'closed', 'rejected')),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.2 : Contributions et dons matériels
CREATE TABLE IF NOT EXISTS public.sos_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_need_id UUID NOT NULL REFERENCES public.sos_material_needs(id) ON DELETE CASCADE,
    donor_name VARCHAR(150) NOT NULL,
    donor_phone VARCHAR(30) NOT NULL,
    donor_email VARCHAR(150),
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    quantity_pledged NUMERIC(12, 2) NOT NULL CHECK (quantity_pledged > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('pledged', 'received', 'cancelled')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.3 : Appels à mobilisation (Professionnels & Bénévoles)
CREATE TABLE IF NOT EXISTS public.sos_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('professional', 'volunteer')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    profession_category VARCHAR(50) CHECK (profession_category IN (
        'health', 'construction_technical', 'transport', 'social', 'other'
    )),
    profession_id VARCHAR(50),
    custom_profession_title VARCHAR(150),
    mandatory_qualifications BOOLEAN NOT NULL DEFAULT false,
    required_slots INT NOT NULL CHECK (required_slots > 0),
    accepted_count INT NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
    received_count INT NOT NULL DEFAULT 0 CHECK (received_count >= 0),
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune VARCHAR(100) NOT NULL,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    start_date DATE NOT NULL,
    end_date DATE,
    time_schedule VARCHAR(100),
    estimated_duration VARCHAR(100),
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'urgent' CHECK (urgency_level IN ('critical', 'urgent', 'moderate', 'low')),
    conditions TEXT,
    required_equipment TEXT,
    coordinator_name VARCHAR(150) NOT NULL,
    coordinator_contact VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'suspended', 'closed')),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_capacity_integrity CHECK (accepted_count <= required_slots OR status = 'full')
);

-- Table 2.4 : Candidatures (Applications)
CREATE TABLE IF NOT EXISTS public.sos_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    call_id UUID NOT NULL REFERENCES public.sos_calls(id) ON DELETE CASCADE,
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('professional', 'volunteer')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    national_id VARCHAR(18) CHECK (national_id ~ '^\d{18}$' OR national_id IS NULL),
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune VARCHAR(100) NOT NULL,
    profession_id VARCHAR(50),
    custom_profession VARCHAR(150),
    experience_years INT CHECK (experience_years >= 0),
    qualifications TEXT,
    certificate_url TEXT,
    has_transport BOOLEAN DEFAULT false,
    skills_notes TEXT,
    availability VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'waitlist', 'rejected', 'cancelled')),
    is_waitlisted BOOLEAN NOT NULL DEFAULT false,
    admin_note TEXT,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    points_awarded INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.5 : Interventions sur le terrain
CREATE TABLE IF NOT EXISTS public.sos_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    call_id UUID REFERENCES public.sos_calls(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    coordinator_name VARCHAR(150) NOT NULL,
    coordinator_phone VARCHAR(50),
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune VARCHAR(100) NOT NULL,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'preparation' CHECK (status IN ('preparation', 'in_progress', 'suspended', 'completed', 'cancelled')),
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.6 : Équipes d'intervention
CREATE TABLE IF NOT EXISTS public.sos_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID NOT NULL REFERENCES public.sos_interventions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    leader_name VARCHAR(150) NOT NULL,
    leader_phone VARCHAR(50) NOT NULL,
    mission TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.7 : Membres d'équipe
CREATE TABLE IF NOT EXISTS public.sos_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.sos_teams(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.sos_applications(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member', 'specialist')),
    profession VARCHAR(150),
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.8 : Pointage et présences terrain (Attendance)
CREATE TABLE IF NOT EXISTS public.sos_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.sos_applications(id) ON DELETE CASCADE,
    call_id UUID NOT NULL REFERENCES public.sos_calls(id) ON DELETE CASCADE,
    national_id VARCHAR(18),
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMPTZ,
    hours_counted NUMERIC(5, 2) DEFAULT 0,
    points_awarded INT DEFAULT 0,
    verified_by VARCHAR(150),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2.9 : Journal d'audit et traçabilité des opérations
CREATE TABLE IF NOT EXISTS public.sos_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100),
    actor_role VARCHAR(50),
    old_state JSONB,
    new_state JSONB,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. INDEX DE RECHERCHE ET DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sos_material_wilaya ON public.sos_material_needs(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_sos_material_category ON public.sos_material_needs(category);
CREATE INDEX IF NOT EXISTS idx_sos_material_status ON public.sos_material_needs(status);

CREATE INDEX IF NOT EXISTS idx_sos_calls_type ON public.sos_calls(type);
CREATE INDEX IF NOT EXISTS idx_sos_calls_wilaya ON public.sos_calls(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_sos_calls_status ON public.sos_calls(status);
CREATE INDEX IF NOT EXISTS idx_sos_calls_urgency ON public.sos_calls(urgency_level);

CREATE INDEX IF NOT EXISTS idx_sos_apps_call ON public.sos_applications(call_id);
CREATE INDEX IF NOT EXISTS idx_sos_apps_status ON public.sos_applications(status);
CREATE INDEX IF NOT EXISTS idx_sos_apps_national_id ON public.sos_applications(national_id);

CREATE INDEX IF NOT EXISTS idx_sos_interventions_wilaya ON public.sos_interventions(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_sos_interventions_status ON public.sos_interventions(status);

-- ============================================================================
-- 4. OPÉRATIONS ATOMIQUES CÔTÉ SERVEUR (CONCURRENCE & CAPACITÉ)
-- ============================================================================

-- Fonction 4.1 : Acceptation atomique d'une candidature avec verrouillage ligne (SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION public.accept_sos_application_atomic(
    p_application_id UUID,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app RECORD;
    v_call RECORD;
    v_new_accepted INT;
    v_new_call_status VARCHAR(20);
BEGIN
    -- 1. Verrouiller la candidature
    SELECT * INTO v_app
    FROM public.sos_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'application_not_found');
    END IF;

    IF v_app.status = 'accepted' THEN
        RETURN jsonb_build_object('success', true, 'message', 'already_accepted');
    END IF;

    -- 2. Verrouiller l'appel pour contrôle atomique de capacité
    SELECT * INTO v_call
    FROM public.sos_calls
    WHERE id = v_app.call_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'call_not_found');
    END IF;

    -- Vérification stricte de capacité
    IF v_call.accepted_count >= v_call.required_slots THEN
        -- Capacité atteinte : basculer en liste d'attente
        UPDATE public.sos_applications
        SET status = 'waitlist', is_waitlisted = true, updated_at = now()
        WHERE id = p_application_id;

        UPDATE public.sos_calls
        SET status = 'full', updated_at = now()
        WHERE id = v_call.id;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'capacity_full_waitlisted',
            'required_slots', v_call.required_slots,
            'accepted_count', v_call.accepted_count
        );
    END IF;

    -- Incrémenter la capacité acceptée
    v_new_accepted := v_call.accepted_count + 1;
    v_new_call_status := CASE
        WHEN v_new_accepted >= v_call.required_slots THEN 'full'
        ELSE v_call.status
    END;

    -- Mettre à jour l'appel
    UPDATE public.sos_calls
    SET accepted_count = v_new_accepted,
        status = v_new_call_status,
        updated_at = now()
    WHERE id = v_call.id;

    -- Mettre à jour la candidature
    UPDATE public.sos_applications
    SET status = 'accepted',
        is_waitlisted = false,
        admin_note = COALESCE(p_admin_note, admin_note),
        updated_at = now()
    WHERE id = p_application_id;

    -- Journaliser l'opération dans le journal d'audit
    INSERT INTO public.sos_audit_logs (entity_name, entity_id, action, note)
    VALUES ('sos_applications', p_application_id, 'accept_application', p_admin_note);

    RETURN jsonb_build_object(
        'success', true,
        'application_id', p_application_id,
        'accepted_count', v_new_accepted,
        'call_status', v_new_call_status
    );
END;
$$;

-- Fonction 4.2 : Annulation atomique d'une acceptation avec libération de place
CREATE OR REPLACE FUNCTION public.cancel_sos_application_acceptance_atomic(
    p_application_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app RECORD;
    v_call RECORD;
    v_new_accepted INT;
    v_new_call_status VARCHAR(20);
BEGIN
    SELECT * INTO v_app
    FROM public.sos_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'application_not_found');
    END IF;

    IF v_app.status = 'accepted' THEN
        SELECT * INTO v_call
        FROM public.sos_calls
        WHERE id = v_app.call_id
        FOR UPDATE;

        IF FOUND THEN
            v_new_accepted := GREATEST(0, v_call.accepted_count - 1);
            v_new_call_status := CASE
                WHEN v_call.status = 'full' AND v_new_accepted < v_call.required_slots THEN 'open'
                ELSE v_call.status
            END;

            UPDATE public.sos_calls
            SET accepted_count = v_new_accepted,
                status = v_new_call_status,
                updated_at = now()
            WHERE id = v_call.id;
        END IF;
    END IF;

    UPDATE public.sos_applications
    SET status = 'cancelled',
        is_waitlisted = false,
        admin_note = COALESCE(p_reason, admin_note),
        updated_at = now()
    WHERE id = p_application_id;

    INSERT INTO public.sos_audit_logs (entity_name, entity_id, action, note)
    VALUES ('sos_applications', p_application_id, 'cancel_acceptance', p_reason);

    RETURN jsonb_build_object('success', true, 'application_id', p_application_id);
END;
$$;

-- ============================================================================
-- 5. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.sos_material_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Besoins matériels : consultation publique des besoins validés / créations admin
CREATE POLICY "Public read validated needs"
ON public.sos_material_needs
FOR SELECT
USING (status IN ('validated', 'fulfilled', 'closed'));

CREATE POLICY "Admin full access needs"
ON public.sos_material_needs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5.2 Appels à mobilisation : consultation publique des appels ouverts/en cours
CREATE POLICY "Public read active calls"
ON public.sos_calls
FOR SELECT
USING (status IN ('open', 'full', 'in_progress', 'completed'));

CREATE POLICY "Admin full access calls"
ON public.sos_calls
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5.3 Candidatures : Sécurité stricte
-- Le public peut soumettre une candidature (INSERT)
CREATE POLICY "Public insert application"
ON public.sos_applications
FOR INSERT
WITH CHECK (true);

-- Les candidats ne peuvent lire que leur propre candidature via leur référence ou anonymisation
CREATE POLICY "Admin full access applications"
ON public.sos_applications
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5.4 Interventions : Consultation publique des interventions validées
CREATE POLICY "Public read interventions"
ON public.sos_interventions
FOR SELECT
USING (status IN ('in_progress', 'completed', 'preparation'));

CREATE POLICY "Admin full access interventions"
ON public.sos_interventions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public read teams"
ON public.sos_teams
FOR SELECT
USING (true);

CREATE POLICY "Admin full access teams"
ON public.sos_teams
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin full access attendance"
ON public.sos_attendance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin full access audit"
ON public.sos_audit_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

