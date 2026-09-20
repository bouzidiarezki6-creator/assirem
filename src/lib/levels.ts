export type LevelProgress = {
  level: number
  /** Points already earned inside the current level */
  currentInLevel: number
  /** Points required to complete the current level and unlock the next */
  requiredForLevel: number
  /** 0–100 */
  percent: number
  /** Total points owned */
  totalPoints: number
  /** Points still needed to reach next level */
  remaining: number
}

/**
 * Points needed to finish a given level (and unlock level+1).
 * Each level is strictly harder than the previous:
 * L1=50, L2=100, L3=175, L4=275, L5=400, L6=550, ...
 */
export function pointsRequiredForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level))
  // 50 * n + 25 * (n-1)*n/1 ≈ growing quadratic soft curve
  return Math.round(50 * n + 25 * (n - 1) * n)
}

/** Cumulative points required to REACH the start of `level` (level 1 starts at 0). */
export function cumulativePointsBeforeLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) {
    total += pointsRequiredForLevel(l)
  }
  return total
}

export function getLevelProgress(totalPoints: number): LevelProgress {
  const pts = Math.max(0, Math.floor(totalPoints) || 0)
  let level = 1
  let remainingPool = pts

  // Cap iteration to avoid infinite loops on huge values
  for (let i = 0; i < 500; i++) {
    const need = pointsRequiredForLevel(level)
    if (remainingPool < need) {
      const percent = need === 0 ? 100 : Math.min(100, Math.round((remainingPool / need) * 100))
      return {
        level,
        currentInLevel: remainingPool,
        requiredForLevel: need,
        percent,
        totalPoints: pts,
        remaining: need - remainingPool,
      }
    }
    remainingPool -= need
    level += 1
  }

  const need = pointsRequiredForLevel(level)
  return {
    level,
    currentInLevel: remainingPool,
    requiredForLevel: need,
    percent: Math.min(100, Math.round((remainingPool / need) * 100)),
    totalPoints: pts,
    remaining: Math.max(0, need - remainingPool),
  }
}

export type VolunteerTierId =
  | "nouveau"
  | "engage"
  | "actif"
  | "confirme"
  | "exemplaire"
  | "ambassadeur"

export interface VolunteerTier {
  level: number
  id: VolunteerTierId
  minPoints: number
  maxPoints: number | null
  icon: string
}

export const VOLUNTEER_TIERS: VolunteerTier[] = [
  { level: 0, id: "nouveau", minPoints: 0, maxPoints: 49, icon: "🌱" },
  { level: 1, id: "engage", minPoints: 50, maxPoints: 149, icon: "🎖️" },
  { level: 2, id: "actif", minPoints: 150, maxPoints: 299, icon: "🏞️" },
  { level: 3, id: "confirme", minPoints: 300, maxPoints: 499, icon: "🏕️" },
  { level: 4, id: "exemplaire", minPoints: 500, maxPoints: 999, icon: "🎤" },
  { level: 5, id: "ambassadeur", minPoints: 1000, maxPoints: null, icon: "⭐" },
]

export function getVolunteerTier(points: number = 0): VolunteerTier {
  const pts = Math.max(0, Math.floor(points) || 0)
  for (let i = VOLUNTEER_TIERS.length - 1; i >= 0; i--) {
    if (pts >= VOLUNTEER_TIERS[i].minPoints) {
      return VOLUNTEER_TIERS[i]
    }
  }
  return VOLUNTEER_TIERS[0]
}

