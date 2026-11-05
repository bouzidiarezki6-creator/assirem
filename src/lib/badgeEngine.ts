/**
 * ============================================================================
 * SYSTÈME DE BADGES ET DISTINCTIONS AUTOMATIQUES — YED FEL YED
 * Attribution dynamique liée aux actions, missions réelles et performances
 * ============================================================================
 */

import type { EarnedBadge, VolunteerAccount, VolunteerParticipation } from "./types"

export type BadgeRarity = "commun" | "rare" | "epique" | "legendaire"
export type BadgeCategory = "progression" | "impact" | "regularite" | "leadership" | "excellence"

export type BadgeDefinition = {
  id: string
  name: string
  description: string
  illustration: string // Lucide icon name
  category: BadgeCategory
  rarity: BadgeRarity
  conditions: string
  target: number
  unit: string
}

export type BadgeWithProgress = BadgeDefinition & {
  isEarned: boolean
  earnedAt?: string
  current: number
  target: number
  percent: number
  remaining: number
}

/**
 * LES 10 BADGES OFFICIELS DE L'ÉCOSYSTÈME YED FEL YED
 */
export const OFFICIAL_BADGES: BadgeDefinition[] = [
  {
    id: "premier_pas",
    name: "Premier Pas",
    description: "Première mission de bénévolat accomplie et validée sur le terrain.",
    illustration: "Footprints",
    category: "progression",
    rarity: "commun",
    conditions: "1 mission validée",
    target: 1,
    unit: "mission",
  },
  {
    id: "benevole_actif",
    name: "Bénévole Actif",
    description: "Implication confirmée avec 5 missions de solidarité terminées.",
    illustration: "Sparkles",
    category: "progression",
    rarity: "commun",
    conditions: "5 missions terminées",
    target: 5,
    unit: "missions",
  },
  {
    id: "esprit_solidaire",
    name: "Esprit Solidaire",
    description: "Engagement civique exemplaire avec 10 missions terminées.",
    illustration: "HeartHandshake",
    category: "impact",
    rarity: "rare",
    conditions: "10 missions terminées",
    target: 10,
    unit: "missions",
  },
  {
    id: "ambassadeur",
    name: "Ambassadeur",
    description: "Pilier de la solidarité locale avec 20 missions accomplies.",
    illustration: "Award",
    category: "impact",
    rarity: "epique",
    conditions: "20 missions terminées",
    target: 20,
    unit: "missions",
  },
  {
    id: "eco_citoyen",
    name: "Éco-Citoyen",
    description: "Dévouement actif pour la protection de l'environnement et de la nature.",
    illustration: "Leaf",
    category: "impact",
    rarity: "rare",
    conditions: "5 missions environnementales validées",
    target: 5,
    unit: "missions éco",
  },
  {
    id: "main_tendue",
    name: "Main Tendue",
    description: "Soutien constant aux plus vulnérables et aux familles dans le besoin.",
    illustration: "HandHeart",
    category: "impact",
    rarity: "rare",
    conditions: "5 missions sociales ou caritatives validées",
    target: 5,
    unit: "missions sociales",
  },
  {
    id: "fidele",
    name: "Fidèle",
    description: "Assiduité et régularité exemplaire sur les actions de terrain.",
    illustration: "CalendarCheck",
    category: "regularite",
    rarity: "rare",
    conditions: "Participation régulière (au moins 8 actions enregistrées)",
    target: 8,
    unit: "participations",
  },
  {
    id: "leader",
    name: "Leader",
    description: "Capacité démontrée à encadrer et guider une équipe sur le terrain.",
    illustration: "Users",
    category: "leadership",
    rarity: "epique",
    conditions: "Responsabilité d'équipe ou coordination sur au moins 2 missions",
    target: 2,
    unit: "missions lead",
  },
  {
    id: "excellence",
    name: "Excellence",
    description: "Reconnaissance d'une contribution exceptionnelle ou nomination d'honneur.",
    illustration: "Star",
    category: "excellence",
    rarity: "epique",
    conditions: "Atteindre 500 points ou recevoir une distinction spéciale",
    target: 500,
    unit: "points",
  },
  {
    id: "legende_solidaire",
    name: "Légende Solidaire",
    description: "Consécration suprême : atteinte du palier Ambassadeur (1000+ points).",
    illustration: "Crown",
    category: "excellence",
    rarity: "legendaire",
    conditions: "Atteindre le dernier palier officiel (1000 points)",
    target: 1000,
    unit: "points",
  },
]

/**
 * Évalue la progression d'un bénévole pour chaque badge officiel
 */
export function computeVolunteerBadgesProgress(
  volunteer: VolunteerAccount,
  participations: VolunteerParticipation[] = []
): BadgeWithProgress[] {
  const validParts = participations.filter(
    (p) => p.volunteerId === volunteer.id && p.status === "validated"
  )
  const totalCompleted = validParts.length
  const envCompleted = validParts.filter((p) => p.categoryId === "environnemental").length
  const socialCompleted = validParts.filter((p) => p.categoryId === "social").length
  const leaderCompleted = validParts.filter(
    (p) => p.responsibilityId === "responsable" || p.responsibilityId === "coordinateur"
  ).length
  const totalPoints = volunteer.points || 0
  const hasSpecialAward = (volunteer.specialAwards || []).length > 0

  const earnedList = volunteer.earnedBadges || []

  return OFFICIAL_BADGES.map((b) => {
    let current = 0
    let isEarned = earnedList.some((eb) => eb.badgeId === b.id)
    const earnedMeta = earnedList.find((eb) => eb.badgeId === b.id)

    switch (b.id) {
      case "premier_pas":
        current = totalCompleted
        if (current >= 1) isEarned = true
        break
      case "benevole_actif":
        current = totalCompleted
        if (current >= 5) isEarned = true
        break
      case "esprit_solidaire":
        current = totalCompleted
        if (current >= 10) isEarned = true
        break
      case "ambassadeur":
        current = totalCompleted
        if (current >= 20) isEarned = true
        break
      case "eco_citoyen":
        current = envCompleted
        if (current >= 5) isEarned = true
        break
      case "main_tendue":
        current = socialCompleted
        if (current >= 5) isEarned = true
        break
      case "fidele":
        current = totalCompleted
        if (current >= 8) isEarned = true
        break
      case "leader":
        current = leaderCompleted
        if (current >= 2) isEarned = true
        break
      case "excellence":
        current = Math.min(b.target, totalPoints)
        if (totalPoints >= 500 || hasSpecialAward) {
          isEarned = true
          current = b.target
        }
        break
      case "legende_solidaire":
        current = Math.min(b.target, totalPoints)
        if (totalPoints >= 1000) isEarned = true
        break
      default:
        current = 0
    }

    const cappedCurrent = Math.min(b.target, current)
    const percent = Math.min(100, Math.round((cappedCurrent / b.target) * 100))
    const remaining = Math.max(0, b.target - current)

    return {
      ...b,
      isEarned,
      earnedAt: earnedMeta?.unlockedAt,
      current: cappedCurrent,
      target: b.target,
      percent: isEarned ? 100 : percent,
      remaining: isEarned ? 0 : remaining,
    }
  })
}

/**
 * Évalue et débloque les nouveaux badges mérités pour un bénévole (anti-doublon strict)
 */
export function evaluateAndAwardBadges(
  volunteer: VolunteerAccount,
  participations: VolunteerParticipation[] = []
): { newlyAwarded: BadgeDefinition[]; updatedEarnedBadges: EarnedBadge[] } {
  const progressList = computeVolunteerBadgesProgress(volunteer, participations)
  const existingEarned = volunteer.earnedBadges || []
  const newlyAwarded: BadgeDefinition[] = []
  const updatedList: EarnedBadge[] = [...existingEarned]
  const now = new Date().toISOString()

  for (const item of progressList) {
    const alreadyHad = existingEarned.some((e) => e.badgeId === item.id)
    if (!alreadyHad && item.isEarned) {
      newlyAwarded.push(item)
      updatedList.push({
        badgeId: item.id,
        unlockedAt: now,
      })
    }
  }

  return {
    newlyAwarded,
    updatedEarnedBadges: updatedList,
  }
}
