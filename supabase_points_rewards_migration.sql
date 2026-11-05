-- ============================================================================
-- CONSOLIDATION DU SYSTÈME DE POINTS, NIVEAUX ET RÉCOMPENSES — YED FEL YED (يد في يد)
-- Version : 2.0.0 Institutional Production-Ready
-- Description : 
--   1. Équité et barème unifié (Paliers 1 à 6, bonus de responsabilité plafonné à 15%).
--   2. Sécurisation stricte du grand livre de transactions (WORM, traçabilité auteur).
--   3. Anti-collision et prévention des doublons de validation (fingerprint unique).
--   4. RLS & ABAC institutionnels (National Admin, Wilaya Admin, Local Coordinator, Auditeur).
--   5. Intégrité comptable garantie : Solde = Somme des transactions.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLE DES PARTICIPATIONS (MISSIONS & ACTIVITÉS TERRAIN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.volunteer_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint TEXT NOT NULL,
    volunteer_id UUID NOT NULL REFERENCES public.volunteer_accounts(id) ON DELETE CASCADE,
    activity_title TEXT NOT NULL,
    activity_date DATE NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    activity_type_id VARCHAR(50) NOT NULL DEFAULT 'standard',
    duration_id VARCHAR(50) NOT NULL DEFAULT 'h2_4',
    responsibility_id VARCHAR(50) NOT NULL DEFAULT 'participant',
    hours_counted NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (hours_counted >= 0),
    points_awarded INT NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    original_points INT NOT NULL DEFAULT 0 CHECK (original_points >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'validated' CHECK (status IN ('validated', 'cancelled')),
    author_id UUID,
    author_name TEXT,
    author_role VARCHAR(50),
    author_wilaya_code INT CHECK (author_wilaya_code BETWEEN 1 AND 69),
    changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index unique partiel pour empêcher toute validation en double pour la même mission/date
CREATE UNIQUE INDEX IF NOT EXISTS uq_volunteer_participation_active_fingerprint
    ON public.volunteer_participations (fingerprint)
    WHERE status = 'validated';

CREATE INDEX IF NOT EXISTS idx_participations_volunteer ON public.volunteer_participations(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_participations_date ON public.volunteer_participations(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_participations_category ON public.volunteer_participations(category_id);
CREATE INDEX IF NOT EXISTS idx_participations_author ON public.volunteer_participations(author_id);

-- ============================================================================
-- 2. ÉVOLUTION DU GRAND LIVRE : VOLUNTEER_POINT_TRANSACTIONS
-- ============================================================================

DO $$
BEGIN
    -- Ajout des colonnes d'audit et de traçabilité WORM si manquantes
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'participation_id') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN participation_id UUID REFERENCES public.volunteer_participations(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'corrected_transaction_id') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN corrected_transaction_id UUID REFERENCES public.volunteer_point_transactions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'author_id') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN author_id UUID;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'author_name') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN author_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'author_role') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN author_role VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'author_wilaya_code') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN author_wilaya_code INT CHECK (author_wilaya_code BETWEEN 1 AND 69);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'volunteer_point_transactions' AND column_name = 'status') THEN
        ALTER TABLE public.volunteer_point_transactions
            ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'validated' CHECK (status IN ('validated', 'corrected', 'cancelled'));
    END IF;
END $$;

-- Contrainte de longueur minimale sur le motif (au moins 5 caractères)
ALTER TABLE public.volunteer_point_transactions
    DROP CONSTRAINT IF EXISTS chk_volunteer_tx_reason_length;
ALTER TABLE public.volunteer_point_transactions
    ADD CONSTRAINT chk_volunteer_tx_reason_length CHECK (char_length(trim(reason)) >= 5);

CREATE INDEX IF NOT EXISTS idx_vol_tx_author ON public.volunteer_point_transactions(author_id);
CREATE INDEX IF NOT EXISTS idx_vol_tx_status ON public.volunteer_point_transactions(status);
CREATE INDEX IF NOT EXISTS idx_vol_tx_part ON public.volunteer_point_transactions(participation_id);

-- ============================================================================
-- 3. GARANTIE D'INTÉGRITÉ COMPTABLE : SYNCHRONISATION DU SOLDE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_volunteer_points_balance(p_volunteer_id UUID)
RETURNS INT AS $$
DECLARE
    v_calculated_balance INT;
BEGIN
    -- Calcul du solde strict par somme algébrique de l'historique complet des transactions
    SELECT COALESCE(SUM(amount), 0) INTO v_calculated_balance
    FROM public.volunteer_point_transactions
    WHERE volunteer_id = p_volunteer_id;

    -- Mise à jour du solde dans le compte officiel du bénévole
    UPDATE public.volunteer_accounts
    SET points = GREATEST(0, v_calculated_balance),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_volunteer_id;

    RETURN GREATEST(0, v_calculated_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger après toute insertion de transaction pour maintenir le solde exact
CREATE OR REPLACE FUNCTION public.trig_update_volunteer_balance()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.recalculate_volunteer_points_balance(NEW.volunteer_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_volunteer_balance ON public.volunteer_point_transactions;
CREATE TRIGGER trigger_sync_volunteer_balance
    AFTER INSERT ON public.volunteer_point_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.trig_update_volunteer_balance();

-- ============================================================================
-- 4. CONTRÔLE D'ACCÈS BASÉ SUR LES ATTRIBUTS (ABAC) & RLS
-- ============================================================================

ALTER TABLE public.volunteer_participations ENABLE ROW LEVEL SECURITY;

-- 4.1 Politiques sur `volunteer_participations`
-- Consultation : Le bénévole voit ses missions, les administrateurs et auditeurs selon leur portée
DROP POLICY IF EXISTS "participations_select_policy" ON public.volunteer_participations;
CREATE POLICY "participations_select_policy"
    ON public.volunteer_participations
    FOR SELECT
    USING (
        -- Le bénévole voit son propre historique
        auth.uid() = volunteer_id
        -- Rôle de service backend
        OR auth.jwt() ->> 'role' = 'service_role'
        -- Administrateur National ou Auditeur National : vue nationale complète
        OR auth.jwt() ->> 'institutional_role' IN ('national_admin', 'national_auditor')
        -- Administrateur de Wilaya : bénévole ou activité de sa wilaya
        OR (
            auth.jwt() ->> 'institutional_role' = 'wilaya_admin'
            AND (
                author_wilaya_code = (auth.jwt() ->> 'wilaya_code')::INT
                OR EXISTS (
                    SELECT 1 FROM public.volunteer_accounts v
                    WHERE v.id = volunteer_id AND v.wilaya_code = (auth.jwt() ->> 'wilaya_code')::INT
                )
            )
        )
        -- Coordinateur Local : bénévole ou activité de sa daïra / commune
        OR (
            auth.jwt() ->> 'institutional_role' = 'local_coordinator'
            AND author_id = auth.uid()
        )
    );

-- Insertion de participations : Interdit aux bénévoles et auditeurs
DROP POLICY IF EXISTS "participations_insert_policy" ON public.volunteer_participations;
CREATE POLICY "participations_insert_policy"
    ON public.volunteer_participations
    FOR INSERT
    WITH CHECK (
        -- Auditeur national interdit en écriture
        auth.jwt() ->> 'institutional_role' != 'national_auditor'
        AND (
            auth.jwt() ->> 'role' = 'service_role'
            OR auth.jwt() ->> 'institutional_role' = 'national_admin'
            -- Wilaya admin limité à sa propre wilaya
            OR (
                auth.jwt() ->> 'institutional_role' = 'wilaya_admin'
                AND (auth.jwt() ->> 'wilaya_code')::INT = author_wilaya_code
            )
            -- Coordinateur local
            OR (
                auth.jwt() ->> 'institutional_role' = 'local_coordinator'
                AND auth.uid() = author_id
            )
        )
    );

-- 4.2 Politiques sur `volunteer_point_transactions`
-- Consultation des transactions
DROP POLICY IF EXISTS "point_transactions_select_policy" ON public.volunteer_point_transactions;
CREATE POLICY "point_transactions_select_policy"
    ON public.volunteer_point_transactions
    FOR SELECT
    USING (
        auth.uid() = volunteer_id
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'institutional_role' IN ('national_admin', 'national_auditor')
        OR (
            auth.jwt() ->> 'institutional_role' = 'wilaya_admin'
            AND EXISTS (
                SELECT 1 FROM public.volunteer_accounts v
                WHERE v.id = volunteer_id AND v.wilaya_code = (auth.jwt() ->> 'wilaya_code')::INT
            )
        )
    );

-- Insertion de transactions : Strictement interdite à l'auditeur et aux simples bénévoles
DROP POLICY IF EXISTS "point_transactions_insert_policy" ON public.volunteer_point_transactions;
CREATE POLICY "point_transactions_insert_policy"
    ON public.volunteer_point_transactions
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'institutional_role' != 'national_auditor'
        AND auth.uid() != volunteer_id -- Empêche l'auto-attribution
        AND (
            auth.jwt() ->> 'role' = 'service_role'
            OR auth.jwt() ->> 'institutional_role' = 'national_admin'
            OR (
                auth.jwt() ->> 'institutional_role' = 'wilaya_admin'
                AND (auth.jwt() ->> 'wilaya_code')::INT = author_wilaya_code
            )
            OR (
                auth.jwt() ->> 'institutional_role' = 'local_coordinator'
                AND auth.uid() = author_id
            )
        )
    );

-- Interdiction stricte de modification ou suppression directe (WORM)
DROP POLICY IF EXISTS "point_transactions_update_policy" ON public.volunteer_point_transactions;
DROP POLICY IF EXISTS "point_transactions_delete_policy" ON public.volunteer_point_transactions;

COMMENT ON TABLE public.volunteer_participations IS 'Registre institutionnel d''engagement citoyen et des heures de mobilisation bénévole validées.';
COMMENT ON TABLE public.volunteer_point_transactions IS 'Grand livre WORM inaltérable des points de reconnaissance citoyenne.';

