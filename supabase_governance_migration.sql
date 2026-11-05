-- ============================================================================
-- YED FEL YED (يد في يد) — MODULE DE GOUVERNANCE ET TRAÇABILITÉ INSTITUTIONNELLE
-- Migration Supabase / PostgreSQL pour transmission institutionnelle (MJS)
-- ============================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Énumération des rôles institutionnels (5 rôles)
DO $$ BEGIN
  CREATE TYPE institutional_role AS ENUM (
    'national_admin',
    'wilaya_admin',
    'local_coordinator',
    'mission_lead',
    'national_auditor'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Énumération des statuts du compte administratif
DO $$ BEGIN
  CREATE TYPE institutional_user_status AS ENUM (
    'active',
    'pending_activation',
    'suspended',
    'deactivated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Énumération du workflow d'opération (11 statuts)
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES PRINCIPALES

-- TABLE 2.1 : RESPONSABLES INSTITUTIONNELS (Comptes administratifs)
CREATE TABLE IF NOT EXISTS public.institutional_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role institutional_role NOT NULL,
  structure TEXT NOT NULL,
  wilaya_code INT CHECK (wilaya_code >= 1 AND wilaya_code <= 69),
  commune TEXT,
  assigned_operation_ids UUID[] DEFAULT '{}',
  status institutional_user_status NOT NULL DEFAULT 'active',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 2.2 : OPÉRATIONS INSTITUTIONNELLES & INTERVENTIONS
CREATE TABLE IF NOT EXISTS public.institutional_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'humanitarian_sos',
    'disaster_relief',
    'youth_initiative',
    'caravan_medical',
    'environmental',
    'cultural_sports',
    'civic_mobilization'
  )),
  risk_level TEXT NOT NULL DEFAULT 'standard' CHECK (risk_level IN ('standard', 'elevated', 'critical')),
  required_validation_level TEXT NOT NULL CHECK (required_validation_level IN ('local', 'wilaya', 'national')),
  wilaya_code INT NOT NULL CHECK (wilaya_code >= 1 AND wilaya_code <= 69),
  commune TEXT NOT NULL,
  address TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status operation_workflow_status NOT NULL DEFAULT 'draft',
  verification_stage TEXT NOT NULL DEFAULT 'declared' CHECK (verification_stage IN ('declared', 'verified', 'validated', 'consolidated')),
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  urgent_justification TEXT,
  created_by_id UUID NOT NULL REFERENCES public.institutional_users(id),
  created_by_name TEXT NOT NULL,
  assigned_lead_id UUID REFERENCES public.institutional_users(id),
  assigned_lead_name TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  kpis JSONB NOT NULL DEFAULT '{"volunteersNeeded": 0, "volunteersMobilized": 0, "beneficiariesCount": 0}'::jsonb,
  budget_dzd NUMERIC(14, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 2.3 : ATTESTATIONS NUMÉRIQUES & SCEAUX OFFICIELS
CREATE TABLE IF NOT EXISTS public.digital_attestations (
  id TEXT PRIMARY KEY, -- Format ATT-YYYY-WXX-XXXXX
  operation_id UUID NOT NULL REFERENCES public.institutional_operations(id) ON DELETE CASCADE,
  operation_reference TEXT NOT NULL,
  action_type TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.institutional_users(id),
  actor_name TEXT NOT NULL,
  actor_role institutional_role NOT NULL,
  structure TEXT NOT NULL,
  wilaya_code INT NOT NULL CHECK (wilaya_code >= 1 AND wilaya_code <= 69),
  commune TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  justification TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  previous_attestation_hash TEXT,
  qr_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 2.4 : REGISTRE CENTRAL DES ACTIVITÉS ET DÉCISIONS (Audit Immuable Chaîné)
CREATE TABLE IF NOT EXISTS public.audit_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_index BIGSERIAL NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_role institutional_role NOT NULL,
  wilaya_code INT,
  commune TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('operation', 'attestation', 'points', 'user', 'system')),
  entity_id TEXT NOT NULL,
  entity_reference TEXT NOT NULL,
  justification TEXT NOT NULL,
  payload_diff JSONB,
  previous_entry_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INDEXATION POUR HAUTE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_inst_ops_wilaya ON public.institutional_operations(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_inst_ops_status ON public.institutional_operations(status);
CREATE INDEX IF NOT EXISTS idx_inst_ops_created_at ON public.institutional_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inst_users_role_wilaya ON public.institutional_users(role, wilaya_code);
CREATE INDEX IF NOT EXISTS idx_audit_registry_block_index ON public.audit_registry(block_index);
CREATE INDEX IF NOT EXISTS idx_audit_registry_entity ON public.audit_registry(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_registry_timestamp ON public.audit_registry(timestamp DESC);

-- 4. FONCTIONS HELPER POUR RLS (Contextes utilisateur Supabase)
CREATE OR REPLACE FUNCTION public.get_current_inst_user()
RETURNS public.institutional_users AS $$
  SELECT * FROM public.institutional_users
  WHERE auth_user_id = auth.uid() OR email = current_setting('request.jwt.claim.email', true)
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.institutional_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_registry ENABLE ROW LEVEL SECURITY;

-- 5.1 POLITIQUES POUR `institutional_operations`
-- A. National Admin & National Auditor : Lecture de toutes les wilayas
CREATE POLICY "inst_ops_select_national" ON public.institutional_operations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users u
      WHERE (u.auth_user_id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
      AND u.role IN ('national_admin', 'national_auditor')
      AND u.status = 'active'
    )
  );

-- B. Wilaya Admin : Lecture et Modification strictes à sa wilaya
CREATE POLICY "inst_ops_wilaya_scope" ON public.institutional_operations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users u
      WHERE (u.auth_user_id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
      AND u.role = 'wilaya_admin'
      AND u.wilaya_code = institutional_operations.wilaya_code
      AND u.status = 'active'
    )
  );

-- C. Local Coordinator : Lecture et Modification strictes à sa wilaya & commune
CREATE POLICY "inst_ops_local_scope" ON public.institutional_operations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users u
      WHERE (u.auth_user_id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
      AND u.role = 'local_coordinator'
      AND u.wilaya_code = institutional_operations.wilaya_code
      AND (u.commune IS NULL OR u.commune = institutional_operations.commune)
      AND u.status = 'active'
    )
  );

-- D. Mission Lead : Lecture et Modification strictes aux missions assignées
CREATE POLICY "inst_ops_lead_scope" ON public.institutional_operations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users u
      WHERE (u.auth_user_id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
      AND u.role = 'mission_lead'
      AND (institutional_operations.id = ANY(u.assigned_operation_ids) OR institutional_operations.assigned_lead_id = u.id)
      AND u.status = 'active'
    )
  );

-- 5.2 POLITIQUES POUR `audit_registry` (Immuabilité Absolue)
-- Strictement aucun UPDATE ni DELETE autorisé sur l'audit
CREATE POLICY "audit_no_update" ON public.audit_registry FOR UPDATE USING (false);
CREATE POLICY "audit_no_delete" ON public.audit_registry FOR DELETE USING (false);

-- Lecture autorisée selon profil
CREATE POLICY "audit_select_national" ON public.audit_registry
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users u
      WHERE (u.auth_user_id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
      AND u.role IN ('national_admin', 'national_auditor')
      AND u.status = 'active'
    )
  );

CREATE POLICY "audit_select_wilaya" ON public.audit_registry
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users u
      WHERE (u.auth_user_id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
      AND u.role = 'wilaya_admin'
      AND u.wilaya_code = audit_registry.wilaya_code
      AND u.status = 'active'
    )
  );

-- 6. PROCÉDURE ATOMIQUE DE TRANSITION & ÉMISSION D'ATTESTATION
CREATE OR REPLACE FUNCTION public.transition_institutional_operation(
  p_operation_id UUID,
  p_target_status operation_workflow_status,
  p_actor_id UUID,
  p_justification TEXT,
  p_is_emergency BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_op public.institutional_operations;
  v_actor public.institutional_users;
  v_last_audit public.audit_registry;
  v_prev_hash TEXT;
  v_entry_hash TEXT;
  v_doc_hash TEXT;
  v_attestation_id TEXT;
  v_qr_payload TEXT;
  v_history_entry JSONB;
  v_new_stage TEXT;
BEGIN
  -- 1. Récupération opération et acteur
  SELECT * INTO v_op FROM public.institutional_operations WHERE id = p_operation_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Opération introuvable.');
  END IF;

  SELECT * INTO v_actor FROM public.institutional_users WHERE id = p_actor_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Acteur institutionnel introuvable.');
  END IF;

  IF v_actor.status != 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Le compte du responsable est suspendu ou révoqué.');
  END IF;

  -- 2. Vérification ABAC Territorial
  IF v_actor.role NOT IN ('national_admin', 'national_auditor') THEN
    IF v_actor.wilaya_code != v_op.wilaya_code THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Violation de périmètre : wilaya non concordante.');
    END IF;
  END IF;

  -- 3. Séparation des devoirs : le créateur ne peut approuver son propre dossier
  IF p_target_status = 'approved' AND v_op.created_by_id = v_actor.id AND v_actor.role != 'national_admin' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Séparation des devoirs requise : le créateur ne peut pas auto-approuver son opération.');
  END IF;

  -- 4. Détermination de l'étape de vérification
  v_new_stage := CASE
    WHEN p_target_status IN ('draft', 'submitted') THEN 'declared'
    WHEN p_target_status = 'under_review' THEN 'verified'
    WHEN p_target_status IN ('approved', 'published', 'in_progress', 'completed') THEN 'validated'
    WHEN p_target_status = 'closed' THEN 'consolidated'
    ELSE v_op.verification_stage
  END;

  -- 5. Calcul de l'empreinte cryptographique SHA-256 du document
  v_doc_hash := encode(digest(
    v_op.id::text || '|' || p_target_status::text || '|' || p_justification || '|' || timezone('utc'::text, now())::text,
    'sha256'
  ), 'hex');

  -- 6. Génération de l'attestation numérique si décision majeure
  IF p_target_status IN ('approved', 'published', 'completed', 'closed', 'suspended', 'rejected') THEN
    v_attestation_id := 'ATT-' || to_char(now(), 'YYYY') || '-W' || lpad(v_op.wilaya_code::text, 2, '0') || '-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 5));
    v_qr_payload := 'YFY://VERIFY/ATTESTATION?id=' || v_attestation_id || '&op=' || v_op.reference || '&h=' || substr(v_doc_hash, 1, 16);

    INSERT INTO public.digital_attestations (
      id, operation_id, operation_reference, action_type,
      actor_id, actor_name, actor_role, structure, wilaya_code, commune,
      justification, document_hash, qr_payload
    ) VALUES (
      v_attestation_id, v_op.id, v_op.reference, p_target_status::text,
      v_actor.id, v_actor.first_name || ' ' || v_actor.last_name, v_actor.role, v_actor.structure,
      v_op.wilaya_code, v_op.commune, p_justification, v_doc_hash, v_qr_payload
    );
  END IF;

  -- 7. Chaînage dans le Registre Central d'Audit
  SELECT * INTO v_last_audit FROM public.audit_registry ORDER BY block_index DESC LIMIT 1;
  v_prev_hash := COALESCE(v_last_audit.entry_hash, 'GENESIS-BLOCK-YED-FEL-YED-REPUBLIC-OF-ALGERIA-2026');

  v_entry_hash := encode(digest(
    v_prev_hash || '|' || v_actor.id::text || '|' || 'operation_transition' || '|' || p_operation_id::text || '|' || p_justification,
    'sha256'
  ), 'hex');

  INSERT INTO public.audit_registry (
    timestamp, user_id, user_email, user_role, wilaya_code, commune,
    action, entity_type, entity_id, entity_reference, justification,
    payload_diff, previous_entry_hash, entry_hash
  ) VALUES (
    now(), v_actor.id, v_actor.email, v_actor.role, v_op.wilaya_code, v_op.commune,
    'operation_transition', 'operation', v_op.id::text, v_op.reference, p_justification,
    jsonb_build_object('fromStatus', v_op.status, 'toStatus', p_target_status, 'stage', v_new_stage, 'emergency', p_is_emergency),
    v_prev_hash, v_entry_hash
  );

  -- 8. Mise à jour de l'opération
  v_history_entry := jsonb_build_object(
    'fromStatus', v_op.status,
    'toStatus', p_target_status,
    'actorId', v_actor.id,
    'actorName', v_actor.first_name || ' ' || v_actor.last_name,
    'actorRole', v_actor.role,
    'justification', p_justification,
    'timestamp', timezone('utc'::text, now())::text,
    'attestationId', v_attestation_id
  );

  UPDATE public.institutional_operations
  SET
    status = p_target_status,
    verification_stage = v_new_stage,
    history = history || v_history_entry,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_operation_id;

  RETURN jsonb_build_object(
    'ok', true,
    'operationId', p_operation_id,
    'status', p_target_status,
    'stage', v_new_stage,
    'attestationId', v_attestation_id,
    'entryHash', v_entry_hash
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

