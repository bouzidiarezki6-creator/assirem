-- ============================================================================
-- MIGRATION : HIÉRARCHIE ADMINISTRATIVE OFFICIELLE & CONFINEMENT TERRITORIAL
-- Plateforme Nationale Institutionnelle "Yed Fel Yed (يد في يد)"
-- ============================================================================
-- NIVEAU 1 : Administrateur National (national_admin)
-- NIVEAU 2 : Administrateur de Wilaya (wilaya_admin)
-- NIVEAU 3 : Coordinateur Local (local_coordinator)
-- AUDIT    : Auditeur National (national_auditor - Contrôle indépendant / Read-Only)
-- ============================================================================

-- 1. EXTENSION DE LA STRUCTURE DES COMPTES ADMINISTRATIFS
ALTER TABLE IF EXISTS public.institutional_users
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.institutional_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT,
  ADD COLUMN IF NOT EXISTS created_by_role TEXT,
  ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;

-- 2. INDEXATION POUR LES RECHERCHES HIÉRARCHIQUES & JETONS
CREATE INDEX IF NOT EXISTS idx_inst_users_created_by ON public.institutional_users(created_by);
CREATE INDEX IF NOT EXISTS idx_inst_users_invitation_token ON public.institutional_users(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inst_users_status_role ON public.institutional_users(status, role);

-- 3. CONTRAINTES DE TERRITORIALITÉ SELON LE NIVEAU HIÉRARCHIQUE
ALTER TABLE public.institutional_users DROP CONSTRAINT IF EXISTS chk_wilaya_admin_scope;
ALTER TABLE public.institutional_users ADD CONSTRAINT chk_wilaya_admin_scope
  CHECK (
    (role != 'wilaya_admin') OR
    (role = 'wilaya_admin' AND wilaya_code IS NOT NULL AND wilaya_code >= 1 AND wilaya_code <= 69)
  );

ALTER TABLE public.institutional_users DROP CONSTRAINT IF EXISTS chk_coordinator_scope;
ALTER TABLE public.institutional_users ADD CONSTRAINT chk_coordinator_scope
  CHECK (
    (role != 'local_coordinator') OR
    (role = 'local_coordinator' AND wilaya_code IS NOT NULL AND commune IS NOT NULL AND trim(commune) != '')
  );

-- 4. FONCTION TRIGGER : ENFORCE HIÉRARCHIE & DÉLÉGATION ADMINISTRATIVE STRICTE
CREATE OR REPLACE FUNCTION public.fn_enforce_admin_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_actor public.institutional_users;
  v_actor_id TEXT;
BEGIN
  -- Récupérer l'identifiant de l'administrateur exécutant la requête
  v_actor_id := current_setting('app.current_user_id', true);

  -- Si amorce système initiale (Bootstrap sans session), autoriser l'insertion du premier national_admin
  IF v_actor_id IS NULL OR v_actor_id = '' THEN
    IF TG_OP = 'INSERT' AND NEW.role = 'national_admin' THEN
      NEW.created_by_name := COALESCE(NEW.created_by_name, 'Amorce Système (Bootstrap)');
      RETURN NEW;
    END IF;
  END IF;

  -- Charger l'acteur
  SELECT * INTO v_actor FROM public.institutional_users
  WHERE id::text = v_actor_id OR auth_user_id = auth.uid();

  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Accès refusé : Aucun profil administratif authentifié pour effectuer cette opération.';
  END IF;

  IF v_actor.status != 'active' THEN
    RAISE EXCEPTION 'Compte administratif inactif ou suspendu : opérations de gouvernance interdites.';
  END IF;

  -- 1. L'auditeur national ne peut JAMAIS créer ni modifier de compte
  IF v_actor.role = 'national_auditor' THEN
    RAISE EXCEPTION 'Contrôle strict : L''auditeur national possède des permissions en lecture seule.';
  END IF;

  -- 2. Le coordinateur local ne peut JAMAIS créer ni modifier de compte
  IF v_actor.role = 'local_coordinator' OR v_actor.role = 'mission_lead' THEN
    RAISE EXCEPTION 'Règle hiérarchique : Un coordinateur local ne peut pas gérer les comptes administratifs.';
  END IF;

  -- 3. Règles d'INSERTION (Création de compte)
  IF TG_OP = 'INSERT' THEN
    -- Attribuer automatiquement la chaîne de responsabilité
    NEW.created_by := v_actor.id;
    NEW.created_by_name := v_actor.first_name || ' ' || v_actor.last_name;
    NEW.created_by_role := v_actor.role::text;

    -- Règles spécifiques pour Administrateur de Wilaya (Niveau 2)
    IF v_actor.role = 'wilaya_admin' THEN
      IF NEW.role NOT IN ('local_coordinator', 'mission_lead') THEN
        RAISE EXCEPTION 'Violation hiérarchique : Un administrateur de wilaya ne peut nommer que des coordinateurs locaux.';
      END IF;

      -- Confinement territorial strict
      IF NEW.wilaya_code IS NULL OR NEW.wilaya_code != v_actor.wilaya_code THEN
        RAISE EXCEPTION 'Confinement territorial : Vous ne pouvez créer de compte que dans votre propre wilaya (Wilaya %).', v_actor.wilaya_code;
      END IF;
    END IF;

    -- Règles spécifiques pour Administrateur National (Niveau 1)
    IF v_actor.role = 'national_admin' THEN
      IF NEW.role = 'wilaya_admin' AND (NEW.wilaya_code IS NULL OR NEW.wilaya_code < 1 OR NEW.wilaya_code > 69) THEN
        RAISE EXCEPTION 'Validation : Un administrateur de wilaya doit avoir un code wilaya valide (1 à 69).';
      END IF;
    END IF;
  END IF;

  -- 4. Règles de MODIFICATION (UPDATE)
  IF TG_OP = 'UPDATE' THEN
    -- Auto-élévation de privilèges strictement interdite
    IF v_actor.id = OLD.id AND NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Sécurité : L''auto-élévation de rôle est strictement interdite.';
    END IF;

    -- L'administrateur de wilaya ne peut modifier que les coordinateurs de son propre territoire
    IF v_actor.role = 'wilaya_admin' THEN
      IF OLD.role NOT IN ('local_coordinator', 'mission_lead') THEN
        RAISE EXCEPTION 'Violation de compétence : Vous ne pouvez pas modifier ce compte.';
      END IF;
      IF OLD.wilaya_code != v_actor.wilaya_code THEN
        RAISE EXCEPTION 'Confinement territorial : Ce coordinateur n''appartient pas à votre wilaya.';
      END IF;
      IF NEW.wilaya_code != OLD.wilaya_code THEN
        RAISE EXCEPTION 'Confinement territorial : Impossible de transférer un compte vers une autre wilaya.';
      END IF;
      IF NEW.role != OLD.role THEN
        RAISE EXCEPTION 'Permissions insuffisantes : Seul l''administrateur national peut modifier les rôles hiérarchiques.';
      END IF;
    END IF;

    -- Empêcher l'auto-suspension du dernier administrateur national actif
    IF v_actor.id = OLD.id AND NEW.status IN ('suspended', 'deactivated') THEN
      RAISE EXCEPTION 'Sécurité : Un administrateur ne peut pas révoquer ou suspendre son propre compte.';
    END IF;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATTACHEMENT DU TRIGGER SUR LA TABLE INSTITUTIONAL_USERS
DROP TRIGGER IF EXISTS trg_enforce_admin_hierarchy ON public.institutional_users;
CREATE TRIGGER trg_enforce_admin_hierarchy
  BEFORE INSERT OR UPDATE ON public.institutional_users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_admin_hierarchy();

-- 6. POLITIQUES DE SÉCURITÉ AU NIVEAU DES LIGNES (RLS)
ALTER TABLE public.institutional_users ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques sur institutional_users
DROP POLICY IF EXISTS "inst_users_select_scope" ON public.institutional_users;
DROP POLICY IF EXISTS "inst_users_insert_scope" ON public.institutional_users;
DROP POLICY IF EXISTS "inst_users_update_scope" ON public.institutional_users;
DROP POLICY IF EXISTS "inst_users_delete_scope" ON public.institutional_users;

-- POLITIQUE 6.1 : LECTURE (SELECT)
-- National Admin & Auditor : vue nationale intégrale sur 69 wilayas
-- Wilaya Admin : vue limitée à sa wilaya + son propre compte
-- Coordinateur Local : vue limitée à son compte et à son équipe
CREATE POLICY "inst_users_select_scope" ON public.institutional_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users a
      WHERE (a.auth_user_id = auth.uid() OR a.id::text = current_setting('app.current_user_id', true))
      AND a.status = 'active'
      AND (
        a.role IN ('national_admin', 'national_auditor')
        OR (a.role = 'wilaya_admin' AND (institutional_users.wilaya_code = a.wilaya_code OR institutional_users.id = a.id))
        OR (a.role = 'local_coordinator' AND (institutional_users.wilaya_code = a.wilaya_code OR institutional_users.id = a.id))
      )
    )
  );

-- POLITIQUE 6.2 : INSERTION (INSERT)
-- Seuls national_admin et wilaya_admin peuvent insérer
CREATE POLICY "inst_users_insert_scope" ON public.institutional_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.institutional_users a
      WHERE (a.auth_user_id = auth.uid() OR a.id::text = current_setting('app.current_user_id', true))
      AND a.status = 'active'
      AND a.role IN ('national_admin', 'wilaya_admin')
    )
  );

-- POLITIQUE 6.3 : MODIFICATION (UPDATE)
CREATE POLICY "inst_users_update_scope" ON public.institutional_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.institutional_users a
      WHERE (a.auth_user_id = auth.uid() OR a.id::text = current_setting('app.current_user_id', true))
      AND a.status = 'active'
      AND (
        a.role = 'national_admin'
        OR (a.role = 'wilaya_admin' AND institutional_users.wilaya_code = a.wilaya_code AND institutional_users.role IN ('local_coordinator', 'mission_lead'))
      )
    )
  );

-- POLITIQUE 6.4 : SUPPRESSION (DELETE) — Strictement interdite pour garantir la traçabilité
-- Les comptes sont uniquement suspendus ou révoqués via le statut.
CREATE POLICY "inst_users_delete_scope" ON public.institutional_users
  FOR DELETE
  USING (false);

-- 7. FONCTION RPC SÉCURISÉE POUR L'ACTIVATION D'UN COMPTE PAR JETON
CREATE OR REPLACE FUNCTION public.rpc_activate_institutional_account(
  p_invitation_token TEXT,
  p_auth_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user public.institutional_users;
BEGIN
  SELECT * INTO v_user FROM public.institutional_users
  WHERE invitation_token = p_invitation_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Jeton d''invitation invalide ou introuvable.');
  END IF;

  IF v_user.invitation_expires_at IS NOT NULL AND v_user.invitation_expires_at < timezone('utc'::text, now()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ce jeton d''invitation a expiré (délai de 72 heures dépassé). Contactez votre administrateur.');
  END IF;

  IF v_user.status = 'suspended' OR v_user.status = 'deactivated' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ce compte a été suspendu par une autorité administrative.');
  END IF;

  -- Activation du compte
  UPDATE public.institutional_users
  SET
    auth_user_id = p_auth_user_id,
    status = 'active',
    invitation_token = NULL,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_user.id;

  RETURN jsonb_build_object(
    'ok', true,
    'userId', v_user.id,
    'email', v_user.email,
    'role', v_user.role,
    'wilayaCode', v_user.wilaya_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

