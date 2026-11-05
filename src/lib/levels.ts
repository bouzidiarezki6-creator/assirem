/**
 * ============================================================================
 * MODULE DE PROGRESSION ET DE RECONNAISSANCE INSTITUTIONNELLE — YED FEL YED
 * Barème officiel unifié à 6 Paliers & Niveaux d'Engagement Civique
 * Ministère de la Jeunesse et des Sports (MJS)
 * ============================================================================
 */

import { OFFICIAL_TIER_PERKS, type TierPerkItem } from "./rewardsGamification"

export type VolunteerTierId =
  | "nouveau"
  | "engage"
  | "actif"
  | "confirme"
  | "exemplaire"
  | "ambassadeur"

export interface VolunteerTier {
  level: number // 0 à 5
  id: VolunteerTierId
  labelFr: string
  labelAr: string
  minPoints: number
  maxPoints: number | null
  icon: string
  description: string
  perkDescription: string
  perks: TierPerkItem[]
}

/**
 * LES 6 PALIERS INSTITUTIONNELS OFFICIELS
 */
export const VOLUNTEER_TIERS: VolunteerTier[] = [
  {
    level: 0,
    id: "nouveau",
    labelFr: "Nouveau",
    labelAr: "متطوع جديد",
    minPoints: 0,
    maxPoints: 49,
    icon: "N0",
    description: "Découverte de l'engagement civique et obtention du badge QR sécurisé.",
    perkDescription: "Accès aux missions ouvertes et pointage sur le terrain.",
    perks: OFFICIAL_TIER_PERKS.nouveau,
  },
  {
    level: 1,
    id: "engage",
    labelFr: "Engagé",
    labelAr: "متطوع ملتزم",
    minPoints: 50,
    maxPoints: 149,
    icon: "N1",
    description: "Premières participations confirmées et engagement actif sur le terrain.",
    perkDescription: "Reconnaissance d'engagement et historique des missions.",
    perks: OFFICIAL_TIER_PERKS.engage,
  },
  {
    level: 2,
    id: "actif",
    labelFr: "Actif",
    labelAr: "متطوع نشط",
    minPoints: 150,
    maxPoints: 299,
    icon: "N2",
    description: "Présence régulière sur les activités associatives et citoyennes.",
    perkDescription: "Priorité d'affectation sur les actions locales.",
    perks: OFFICIAL_TIER_PERKS.actif,
  },
  {
    level: 3,
    id: "confirme",
    labelFr: "Confirmé",
    labelAr: "متطوع مؤكد",
    minPoints: 300,
    maxPoints: 499,
    icon: "N3",
    description: "Volontaire d'expérience capable d'encadrer de petites équipes.",
    perkDescription: "Éligibilité au rôle de Responsable d'équipe terrain.",
    perks: OFFICIAL_TIER_PERKS.confirme,
  },
  {
    level: 4,
    id: "exemplaire",
    labelFr: "Exemplaire",
    labelAr: "متطوع نموذجي",
    minPoints: 500,
    maxPoints: 999,
    icon: "N4",
    description: "Implication remarquable et constante sur les initiatives solidaires.",
    perkDescription: "Attestation interne d'engagement civique et mentorat.",
    perks: OFFICIAL_TIER_PERKS.exemplaire,
  },
  {
    level: 5,
    id: "ambassadeur",
    labelFr: "Ambassadeur",
    labelAr: "سفير التطوع",
    minPoints: 1000,
    maxPoints: null,
    icon: "N5",
    description: "Distinction suprême de dévouement à la communauté et à la jeunesse.",
    perkDescription: "Représentation citoyenne et participation aux assises associatives.",
    perks: OFFICIAL_TIER_PERKS.ambassadeur,
  },
]

export type LevelProgress = {
  /** Niveau de 1 à 6 correspondant aux 6 paliers */
  level: number
  tierIndex: number
  tierId: VolunteerTierId
  tierLabel: string
  /** Points accumulés au sein du palier actuel */
  currentInLevel: number
  /** Points requis entre le seuil du palier actuel et le prochain */
  requiredForLevel: number
  /** Pourcentage d'avancement (0 à 100) */
  percent: number
  /** Points totaux actuels */
  totalPoints: number
  /** Points restant à acquérir pour atteindre le prochain palier */
  remaining: number
  /** Nom du prochain palier à atteindre */
  nextTierName: string | null
  /** Vrai si le niveau maximal (Ambassadeur) est atteint */
  isMaxLevel: boolean
}

/**
 * Récupère le palier officiel correspondant à un nombre de points
 */
export function getVolunteerTier(points: number = 0): VolunteerTier {
  const pts = Math.max(0, Math.floor(points) || 0)
  for (let i = VOLUNTEER_TIERS.length - 1; i >= 0; i--) {
    if (pts >= VOLUNTEER_TIERS[i].minPoints) {
      return VOLUNTEER_TIERS[i]
    }
  }
  return VOLUNTEER_TIERS[0]
}

/**
 * Points nécessaires pour franchir le palier du niveau donné
 */
export function pointsRequiredForLevel(level: number): number {
  const idx = Math.min(Math.max(1, Math.floor(level)), 6) - 1
  const currentTier = VOLUNTEER_TIERS[idx]
  const nextTier = VOLUNTEER_TIERS[idx + 1]
  if (!nextTier) return 1000
  return nextTier.minPoints - currentTier.minPoints
}

/**
 * Calcule la progression unifiée et transparente selon les 6 paliers officiels
 */
export function getLevelProgress(totalPoints: number): LevelProgress {
  const pts = Math.max(0, Math.floor(totalPoints) || 0)
  const currentTier = getVolunteerTier(pts)
  const tierIndex = currentTier.level // 0 à 5
  const levelNumber = tierIndex + 1   // 1 à 6
  const nextTier = VOLUNTEER_TIERS[tierIndex + 1] ?? null

  if (!nextTier) {
    // Palier maximal : Ambassadeur (1000+ pts)
    const currentInLevel = pts - currentTier.minPoints
    return {
      level: 6,
      tierIndex: 5,
      tierId: currentTier.id,
      tierLabel: currentTier.labelFr,
      currentInLevel,
      requiredForLevel: 1000,
      percent: 100,
      totalPoints: pts,
      remaining: 0,
      nextTierName: null,
      isMaxLevel: true,
    }
  }

  const range = nextTier.minPoints - currentTier.minPoints
  const currentInLevel = pts - currentTier.minPoints
  const percent = range > 0 ? Math.min(100, Math.max(0, Math.round((currentInLevel / range) * 100))) : 100
  const remaining = Math.max(0, nextTier.minPoints - pts)

  return {
    level: levelNumber,
    tierIndex,
    tierId: currentTier.id,
    tierLabel: currentTier.labelFr,
    currentInLevel,
    requiredForLevel: range,
    percent,
    totalPoints: pts,
    remaining,
    nextTierName: nextTier.labelFr,
    isMaxLevel: false,
  }
}

/**
 * DISTINCTIONS ET BADGES D'ACCOMPLISSEMENT CITOYEN
 */
export interface VolunteerDistinction {
  id: string
  code: string
  name: string
  description: string
  category: "solidarity" | "regularity" | "skills" | "honor"
  icon: string
}

export const VOLUNTEER_DISTINCTIONS: VolunteerDistinction[] = [
  {
    id: "first_step",
    code: "DIST-01",
    name: "Premier Pas Solidaire",
    description: "Première mission de bénévolat validée sur le terrain.",
    category: "solidarity",
    icon: "HeartHandshake",
  },
  {
    id: "regular_commitment",
    code: "DIST-02",
    name: "Engagement Régulier",
    description: "Au moins 5 missions accomplies avec présence certifiée.",
    category: "regularity",
    icon: "CalendarCheck",
  },
  {
    id: "emergency_guard",
    code: "DIST-03",
    name: "Gardien d'Urgence",
    description: "Participation à au moins une mission d'urgence ou de secours SOS.",
    category: "solidarity",
    icon: "ShieldAlert",
  },
  {
    id: "technical_mastery",
    code: "DIST-04",
    name: "Compétence Spécialisée",
    description: "Mobilisation de compétences qualifiées (premiers secours, logistique, santé).",
    category: "skills",
    icon: "Award",
  },
  {
    id: "fifty_hours",
    code: "DIST-05",
    name: "Cap des 50 Heures",
    description: "50 heures cumulées d'action citoyenne sur le terrain.",
    category: "regularity",
    icon: "Clock",
  },
  {
    id: "civic_ambassador",
    code: "DIST-06",
    name: "Honneur & Exemplarité",
    description: "Atteinte du palier Exemplaire ou Ambassadeur (500+ points).",
    category: "honor",
    icon: "Medal",
  },
]

/**
 * Évalue les distinctions méritées par un volontaire sur la base de son historique
 */
export function evaluateVolunteerDistinctions(stats: {
  totalPoints: number
  activityCount: number
  hoursVolunteered: number
  hasEmergencyParticipation?: boolean
  hasSkillsParticipation?: boolean
}): VolunteerDistinction[] {
  const earned: VolunteerDistinction[] = []

  if (stats.activityCount >= 1) {
    earned.push(VOLUNTEER_DISTINCTIONS[0]) // first_step
  }
  if (stats.activityCount >= 5) {
    earned.push(VOLUNTEER_DISTINCTIONS[1]) // regular_commitment
  }
  if (stats.hasEmergencyParticipation) {
    earned.push(VOLUNTEER_DISTINCTIONS[2]) // emergency_guard
  }
  if (stats.hasSkillsParticipation) {
    earned.push(VOLUNTEER_DISTINCTIONS[3]) // technical_mastery
  }
  if (stats.hoursVolunteered >= 50) {
    earned.push(VOLUNTEER_DISTINCTIONS[4]) // fifty_hours
  }
  if (stats.totalPoints >= 500) {
    earned.push(VOLUNTEER_DISTINCTIONS[5]) // civic_ambassador
  }

  return earned
}
