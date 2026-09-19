import type { VolunteerCategoryId } from "./volunteer"

/** ---- Configurable scoring rules (edit here without touching UI) ---- */

export const CATEGORY_COEFFICIENTS: Record<VolunteerCategoryId, number> = {
  urgences: 1.4,
  sante: 1.3,
  social: 1.2,
  scoutisme: 1.15,
  educatif: 1.1,
  environnemental: 1.0,
  evenementiel: 0.8,
}

export type ActivityTypeId =
  | "ponctuelle"
  | "courte"
  | "standard"
  | "longue"
  | "formation"
  | "coordination"
  | "majeure"

export const ACTIVITY_TYPES: {
  id: ActivityTypeId
  label: string
  basePoints: number
}[] = [
  { id: "ponctuelle", label: "Participation ponctuelle", basePoints: 5 },
  { id: "courte", label: "Mission courte", basePoints: 10 },
  { id: "standard", label: "Mission standard", basePoints: 20 },
  { id: "longue", label: "Mission longue", basePoints: 30 },
  { id: "formation", label: "Formation / encadrement", basePoints: 25 },
  { id: "coordination", label: "Coordination", basePoints: 35 },
  { id: "majeure", label: "Responsabilité majeure", basePoints: 45 },
]

export type DurationId = "under_2" | "h2_4" | "h4_8" | "h8_16" | "h16_plus"

export const DURATION_OPTIONS: {
  id: DurationId
  label: string
  multiplier: number
  /** Hours counted toward volunteer stats (mid/conservative estimate) */
  hoursCounted: number
}[] = [
  { id: "under_2", label: "< 2h", multiplier: 0.75, hoursCounted: 1 },
  { id: "h2_4", label: "2–4h", multiplier: 1.0, hoursCounted: 3 },
  { id: "h4_8", label: "4–8h", multiplier: 1.2, hoursCounted: 6 },
  { id: "h8_16", label: "8–16h", multiplier: 1.4, hoursCounted: 12 },
  { id: "h16_plus", label: "16h+", multiplier: 1.6, hoursCounted: 16 },
]

export type ResponsibilityId = "participant" | "actif" | "responsable" | "coordinateur"

export const RESPONSIBILITY_OPTIONS: {
  id: ResponsibilityId
  label: string
  multiplier: number
}[] = [
  { id: "participant", label: "Participant", multiplier: 1.0 },
  { id: "actif", label: "Membre actif", multiplier: 1.1 },
  { id: "responsable", label: "Responsable d'équipe", multiplier: 1.25 },
  { id: "coordinateur", label: "Coordinateur", multiplier: 1.4 },
]

export type RecognitionLevelId =
  | "nouveau"
  | "engage"
  | "actif"
  | "confirme"
  | "exemplaire"
  | "ambassadeur"

export const RECOGNITION_LEVELS: {
  id: RecognitionLevelId
  label: string
  minPoints: number
  maxPoints: number | null
}[] = [
  { id: "nouveau", label: "Nouveau bénévole", minPoints: 0, maxPoints: 49 },
  { id: "engage", label: "Bénévole engagé", minPoints: 50, maxPoints: 149 },
  { id: "actif", label: "Bénévole actif", minPoints: 150, maxPoints: 299 },
  { id: "confirme", label: "Bénévole confirmé", minPoints: 300, maxPoints: 499 },
  { id: "exemplaire", label: "Bénévole exemplaire", minPoints: 500, maxPoints: 999 },
  { id: "ambassadeur", label: "Ambassadeur du bénévolat", minPoints: 1000, maxPoints: null },
]

export type PointsInput = {
  categoryId: VolunteerCategoryId
  activityTypeId: ActivityTypeId
  durationId: DurationId
  responsibilityId: ResponsibilityId
}

export type PointsBreakdownLine = {
  label: string
  detail: string
}

export type PointsBreakdown = {
  basePoints: number
  categoryCoefficient: number
  durationMultiplier: number
  responsibilityMultiplier: number
  rawTotal: number
  finalPoints: number
  hoursCounted: number
  lines: PointsBreakdownLine[]
  formula: string
}

export function getActivityType(id: ActivityTypeId) {
  return ACTIVITY_TYPES.find((a) => a.id === id)
}

export function getDuration(id: DurationId) {
  return DURATION_OPTIONS.find((d) => d.id === id)
}

export function getResponsibility(id: ResponsibilityId) {
  return RESPONSIBILITY_OPTIONS.find((r) => r.id === id)
}

export function getCategoryCoefficient(categoryId: VolunteerCategoryId) {
  return CATEGORY_COEFFICIENTS[categoryId]
}

/**
 * Final Points = Base × Category × Duration × Responsibility
 * Rounded to nearest integer.
 */
export function calculateVolunteerPoints(input: PointsInput): PointsBreakdown {
  const activity = getActivityType(input.activityTypeId)
  const duration = getDuration(input.durationId)
  const responsibility = getResponsibility(input.responsibilityId)
  const categoryCoefficient = getCategoryCoefficient(input.categoryId)

  if (!activity || !duration || !responsibility) {
    throw new Error("Paramètres de calcul invalides")
  }

  const basePoints = activity.basePoints
  const rawTotal =
    basePoints * categoryCoefficient * duration.multiplier * responsibility.multiplier
  const finalPoints = Math.round(rawTotal)

  const categoryLabels: Record<VolunteerCategoryId, string> = {
    social: "Social",
    educatif: "Éducatif",
    sante: "Santé",
    environnemental: "Environnemental",
    urgences: "Urgences",
    evenementiel: "Événementiel",
    scoutisme: "Scoutisme",
  }

  return {
    basePoints,
    categoryCoefficient,
    durationMultiplier: duration.multiplier,
    responsibilityMultiplier: responsibility.multiplier,
    rawTotal,
    finalPoints,
    hoursCounted: duration.hoursCounted,
    formula: `${basePoints} × ${categoryCoefficient} × ${duration.multiplier} × ${responsibility.multiplier} = ${rawTotal.toFixed(2)} → ${finalPoints}`,
    lines: [
      { label: activity.label, detail: `${basePoints} pts` },
      {
        label: `Catégorie ${categoryLabels[input.categoryId]}`,
        detail: `× ${categoryCoefficient.toFixed(2)}`,
      },
      { label: `Durée ${duration.label}`, detail: `× ${duration.multiplier.toFixed(2)}` },
      {
        label: responsibility.label,
        detail: `× ${responsibility.multiplier.toFixed(2)}`,
      },
      { label: "Total", detail: `${finalPoints} pts` },
    ],
  }
}

export function getRecognitionLevel(totalPoints: number) {
  const pts = Math.max(0, Math.floor(totalPoints) || 0)
  let current = RECOGNITION_LEVELS[0]
  for (const level of RECOGNITION_LEVELS) {
    if (pts >= level.minPoints) current = level
  }
  const next = RECOGNITION_LEVELS.find((l) => l.minPoints > current.minPoints) ?? null
  const spanStart = current.minPoints
  const spanEnd = current.maxPoints ?? current.minPoints + 500
  const progressInBand = Math.min(100, Math.round(((pts - spanStart) / (spanEnd - spanStart + 1)) * 100))
  const remainingToNext = next ? Math.max(0, next.minPoints - pts) : 0

  return {
    ...current,
    totalPoints: pts,
    nextId: next?.id ?? null,
    nextLabel: next?.label ?? null,
    remainingToNext,
    percent: progressInBand,
  }
}

/** Fingerprint to prevent duplicate validated participations */
export function participationFingerprint(input: {
  volunteerId: string
  activityTitle: string
  activityDate: string
  categoryId: string
  activityTypeId: string
}) {
  return [
    input.volunteerId.trim(),
    input.activityDate.trim(),
    input.activityTitle.trim().toLowerCase(),
    input.categoryId,
    input.activityTypeId,
  ].join("|")
}
