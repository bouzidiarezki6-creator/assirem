-- ============================================================================
-- MODULE BÉNÉVOLES & PROGRAMME DE RÉCOMPENSES — YED FEL YED (يد في يد)
-- Version : 1.0.0
-- Description : Comptes bénévoles facultatifs, espace personnel de récompenses,
--               badges QR sécurisés, audit des transactions de points,
--               et politiques de sécurité Row Level Security (RLS).
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES DU PROGRAMME DES BÉNÉVOLES
-- ============================================================================

-- Table 2.1 : Comptes Bénévoles (Facultatif — Réservé au programme de fidélité/points)
CREATE TABLE IF NOT EXISTS public.volunteer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 69),
    commune VARCHAR(100) NOT NULL,
    birth_date DATE,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    volunteer_code VARCHAR(50) UNIQUE NOT NULL,
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_email')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    accepted_terms_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.volunteer_accounts IS 'Comptes des bénévoles participant volontairement au programme de récompenses de Yed fel yed.';
COMMENT ON COLUMN public.volunteer_accounts.volunteer_code IS 'Code public sécurisé et unique figurant sur le badge (ex: YFY-VOL-20261104-9B3E).';
COMMENT ON COLUMN public.volunteer_accounts.points IS 'Solde actuel des points citoyens accumulés.';

-- Table 2.2 : Journal d'Audit et Transactions de Points
CREATE TABLE IF NOT EXISTS public.volunteer_point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES public.volunteer_accounts(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    reason TEXT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual_adjustment' CHECK (source IN (
        'sos_mission', 'event_participation', 'manual_adjustment', 'badge_bonus', 'welcome_bonus', 'system'
    )),
    reference_id VARCHAR(100),
    mission_title TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.volunteer_point_transactions IS 'Historique immuable de toutes les variations de points (audit trail).';

-- ============================================================================
-- 3. INTÉGRATION RÉTROCOMPATIBLE AVEC LE MODULE SOS
-- ============================================================================

-- Ajout de la colonne optionnelle volunteer_id sur les candidatures SOS existantes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sos_applications') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sos_applications' AND column_name = 'volunteer_id') THEN
            ALTER TABLE public.sos_applications
                ADD COLUMN volunteer_id UUID REFERENCES public.volunteer_accounts(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. INDEX DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_volunteers_email ON public.volunteer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_code ON public.volunteer_accounts(volunteer_code);
CREATE INDEX IF NOT EXISTS idx_volunteers_wilaya ON public.volunteer_accounts(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteer_accounts(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_points ON public.volunteer_accounts(points DESC);

CREATE INDEX IF NOT EXISTS idx_vol_tx_volunteer ON public.volunteer_point_transactions(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_vol_tx_created ON public.volunteer_point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vol_tx_source ON public.volunteer_point_transactions(source);

-- ============================================================================
-- 5. TRIGGER AUTOMATIQUE : UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_volunteer_accounts_updated_at ON public.volunteer_accounts;
CREATE TRIGGER trigger_volunteer_accounts_updated_at
    BEFORE UPDATE ON public.volunteer_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. FONCTION STOCKÉE : AJUSTEMENT ATOMIQUE DES POINTS AVEC AUDIT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.adjust_volunteer_points(
    p_volunteer_id UUID,
    p_amount INT,
    p_reason TEXT,
    p_source VARCHAR DEFAULT 'manual_adjustment',
    p_reference_id VARCHAR DEFAULT NULL,
    p_mission_title TEXT DEFAULT NULL,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    new_balance INT,
    error_message TEXT
) AS $$
DECLARE
    v_current_points INT;
    v_new_points INT;
BEGIN
    -- 1. Verrouiller la ligne du bénévole pour éviter les conditions de concurrence (FOR UPDATE)
    SELECT points INTO v_current_points
    FROM public.volunteer_accounts
    WHERE id = p_volunteer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 'Bénévole introuvable.'::TEXT;
        RETURN;
    END IF;

    -- 2. Calcul du nouveau solde
    v_new_points := v_current_points + p_amount;
    IF v_new_points < 0 THEN
        RETURN QUERY SELECT false, v_current_points, 'Le solde de points ne peut pas être inférieur à zéro.'::TEXT;
        RETURN;
    END IF;

    -- 3. Mettre à jour le compte bénévole
    UPDATE public.volunteer_accounts
    SET points = v_new_points,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_volunteer_id;

    -- 4. Enregistrer la transaction dans le journal d'audit
    INSERT INTO public.volunteer_point_transactions (
        volunteer_id,
        amount,
        balance_after,
        reason,
        source,
        reference_id,
        mission_title,
        admin_note,
        created_at
    ) VALUES (
        p_volunteer_id,
        p_amount,
        v_new_points,
        p_reason,
        p_source,
        p_reference_id,
        p_mission_title,
        p_admin_note,
        timezone('utc'::text, now())
    );

    RETURN QUERY SELECT true, v_new_points, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SÉCURITÉ : ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.volunteer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_point_transactions ENABLE ROW LEVEL SECURITY;

-- 7.1 Politiques sur `volunteer_accounts` :
-- Un bénévole connecté peut lire son propre profil
CREATE POLICY "volunteer_view_own_account"
    ON public.volunteer_accounts
    FOR SELECT
    USING (
        auth.uid() = id
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Un bénévole peut modifier ses informations personnelles (sans toucher aux points ni au statut)
CREATE POLICY "volunteer_update_own_profile"
    ON public.volunteer_accounts
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND points = (SELECT points FROM public.volunteer_accounts WHERE id = auth.uid())
        AND status = (SELECT status FROM public.volunteer_accounts WHERE id = auth.uid())
    );

-- Création de compte bénévole lors de l'inscription
CREATE POLICY "volunteer_signup_account"
    ON public.volunteer_accounts
    FOR INSERT
    WITH CHECK (
        auth.uid() = id
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Accès complet pour les administrateurs
CREATE POLICY "admin_all_volunteer_accounts"
    ON public.volunteer_accounts
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- 7.2 Politiques sur `volunteer_point_transactions` :
-- Un bénévole peut consulter son propre historique de points
CREATE POLICY "volunteer_view_own_transactions"
    ON public.volunteer_point_transactions
    FOR SELECT
    USING (
        auth.uid() = volunteer_id
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Seuls les administrateurs et fonctions système peuvent créer ou modifier des transactions
CREATE POLICY "admin_all_point_transactions"
    ON public.volunteer_point_transactions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 8. JEU DE DONNÉES INITIAL (SEEDS RÉALISTES POUR ENVIRONNEMENT TEST)
-- ============================================================================

INSERT INTO public.volunteer_accounts (
    id, email, first_name, last_name, phone, wilaya_code, commune, skills, interests, volunteer_code, points, status, is_verified
) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'karim.benali@exemple.dz',
    'Karim',
    'Benali',
    '0550123456',
    6,
    'Akbou',
    ARRAY['first_aid', 'logistics', 'transport'],
    ARRAY['Secours d urgence', 'Convois humanitaires'],
    'YFY-VOL-20261104-9B3E',
    340,
    'active',
    true
),
(
    'b2222222-2222-2222-2222-222222222222',
    'amina.mansouri@exemple.dz',
    'Amina',
    'Mansouri',
    '0661987654',
    6,
    'Béjaïa',
    ARRAY['health', 'psychology', 'education'],
    ARRAY['Soutien psychologique', 'Soins infirmiers'],
    'YFY-VOL-20261104-4F8A',
    180,
    'active',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.volunteer_point_transactions (
    volunteer_id, amount, balance_after, reason, source, reference_id, mission_title, created_at
) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    50,
    50,
    'Bonus de bienvenue au programme de bénévolat',
    'welcome_bonus',
    'WELCOME-2026',
    'Adhésion au programme solidaire',
    NOW() - INTERVAL '15 days'
),
(
    'a1111111-1111-1111-1111-111111111111',
    140,
    190,
    'Mission SOS : Convoi humanitaire Akbou-Ighzer Amokrane',
    'sos_mission',
    'SOS-CALL-AKB-01',
    'Convoi d approvisionnement d urgence',
    NOW() - INTERVAL '8 days'
),
(
    'a1111111-1111-1111-1111-111111111111',
    150,
    340,
    'Pointage validé : Coordination distribution kits d hygiène',
    'sos_mission',
    'SOS-CALL-AKB-02',
    'Distribution kits d hygiène et abris temporaires',
    NOW() - INTERVAL '2 days'
),
(
    'b2222222-2222-2222-2222-222222222222',
    50,
    50,
    'Bonus de bienvenue au programme de bénévolat',
    'welcome_bonus',
    'WELCOME-2026',
    'Adhésion au programme solidaire',
    NOW() - INTERVAL '10 days'
),
(
    'b2222222-2222-2222-2222-222222222222',
    130,
    180,
    'Mission SOS : Permanence soins infirmiers cellule Akbou',
    'sos_mission',
    'SOS-CALL-MED-01',
    'Permanence médicale et secours aux personnes âgées',
    NOW() - INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

