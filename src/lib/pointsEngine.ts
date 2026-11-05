/**
 * ============================================================================
 * SYSTÈME CENTRAL DE POINTS ET RÉCOMPENSES — YED FEL YED
 * Moteur unifié et sécurisé de gestion des soldes, transactions et barèmes
 * ============================================================================
 */

import type {
  AppData,
  InstitutionalRole,
  InstitutionalUser,
  PointRulesConfig,
  VolunteerPointTransaction,
} from "./types"
import { createId } from "./storage"

export const DEFAULT_POINT_RULES: PointRulesConfig = {
  registrationValidated: 5,
  presenceConfirmed: 10,
  missionCompleted: 30,
  reportAccepted: 15,
  criticalMissionBonus: 10,
  exceptionalMissionBonus: 20,
  lastUpdated: new Date().toISOString(),
  updatedBy: "Administration Nationale",
}

export type PointActionType =
  | "registration_validated"
  | "presence_confirmed"
  | "mission_completed"
  | "report_accepted"
  | "critical_bonus"
  | "exceptional_bonus"
  | "challenge_reward"
  | "admin_bonus"
  | "admin_correction"

export type AwardPointsInput = {
  volunteerId: string
  actionType: PointActionType
  customAmount?: number
  reason: string
  missionId?: string
  missionTitle?: string
  participationId?: string
  author?: {
    id?: string
    name?: string
    role?: InstitutionalRole
    wilayaCode?: number
  }
  adminNote?: string
  isDemo?: boolean
  /** Unique reference or fingerprint to strictly prevent duplicate awards */
  idempotencyKey?: string
}

export type AwardPointsResult = {
  success: boolean
  awarded: boolean
  amount: number
  newBalance: number
  transaction?: VolunteerPointTransaction
  error?: string
  duplicate?: boolean
}

/**
 * Calcule le montant des points selon les barèmes en vigueur
 */
export function getPointsForAction(
  actionType: PointActionType,
  config: PointRulesConfig = DEFAULT_POINT_RULES,
  customAmount?: number
): number {
  if (customAmount !== undefined && customAmount !== null) {
    return customAmount
  }

  switch (actionType) {
    case "registration_validated":
      return config.registrationValidated
    case "presence_confirmed":
      return config.presenceConfirmed
    case "mission_completed":
      return config.missionCompleted
    case "report_accepted":
      return config.reportAccepted
    case "critical_bonus":
      return config.criticalMissionBonus
    case "exceptional_bonus":
      return config.exceptionalMissionBonus
    case "challenge_reward":
      return 15
    case "admin_bonus":
      return 10
    case "admin_correction":
      return 0
    default:
      return 0
  }
}

/**
 * Vérifie si une transaction identique a déjà été enregistrée (anti-doublon strict)
 */
export function isDuplicateTransaction(
  transactions: VolunteerPointTransaction[] = [],
  input: AwardPointsInput
): boolean {
  if (input.idempotencyKey) {
    const hasKey = transactions.some(
      (tx) => tx.correctedTransactionId === input.idempotencyKey || (tx.adminNote && tx.adminNote.includes(input.idempotencyKey!))
    )
    if (hasKey) return true
  }

  // Anti-doublon par bénévole + mission + raison pour la même action
  if (input.missionId && input.actionType) {
    return transactions.some(
      (tx) =>
        tx.volunteerId === input.volunteerId &&
        tx.missionTitle === input.missionTitle &&
        tx.status === "validated" &&
        tx.reason.includes(input.reason)
    )
  }

  return false
}

/**
 * Attribue des points à un bénévole de manière atomique, avec calcul de solde et journalisation
 */
export function executeAwardPoints(
  currentData: AppData,
  input: AwardPointsInput
): { nextData: AppData; result: AwardPointsResult } {
  const volunteer =
    (currentData.volunteerAccounts || []).find((v) => v.id === input.volunteerId) ||
    currentData.registrants.find((r) => r.id === input.volunteerId)

  if (!volunteer) {
    return {
      nextData: currentData,
      result: {
        success: false,
        awarded: false,
        amount: 0,
        newBalance: 0,
        error: "Bénévole introuvable dans le système.",
      },
    }
  }

  // Vérification anti-doublon
  const existingTxs = currentData.volunteerPointTransactions || []
  if (isDuplicateTransaction(existingTxs, input)) {
    const curPts = volunteer.points || 0
    return {
      nextData: currentData,
      result: {
        success: true,
        awarded: false,
        duplicate: true,
        amount: 0,
        newBalance: curPts,
        error: "Points déjà attribués pour cette action (prévention anti-doublon).",
      },
    }
  }

  const rules = currentData.pointRulesConfig || DEFAULT_POINT_RULES
  const amount = getPointsForAction(input.actionType, rules, input.customAmount)
  const currentPoints = volunteer.points || 0
  const newBalance = Math.max(0, currentPoints + amount)
  const now = new Date().toISOString()

  const noteWithKey = [
    input.adminNote || "",
    input.idempotencyKey ? `[Key:${input.idempotencyKey}]` : "",
  ]
    .filter(Boolean)
    .join(" ")

  const transaction: VolunteerPointTransaction = {
    id: createId(),
    volunteerId: input.volunteerId,
    amount,
    balanceAfter: newBalance,
    reason: input.reason,
    missionTitle: input.missionTitle,
    participationId: input.participationId,
    adminNote: noteWithKey || undefined,
    authorId: input.author?.id,
    authorName: input.author?.name,
    authorRole: input.author?.role,
    authorWilayaCode: input.author?.wilayaCode,
    status: "validated",
    createdAt: now,
    isDemo: input.isDemo ?? false,
  }

  // Synchronisation des points sur volunteerAccounts et registrants
  const updatedAccounts = (currentData.volunteerAccounts || []).map((v) =>
    v.id === input.volunteerId
      ? { ...v, points: newBalance, updatedAt: now }
      : v
  )

  const updatedRegistrants = currentData.registrants.map((r) =>
    r.id === input.volunteerId ? { ...r, points: newBalance } : r
  )

  const nextData: AppData = {
    ...currentData,
    volunteerAccounts: updatedAccounts,
    registrants: updatedRegistrants,
    volunteerPointTransactions: [transaction, ...existingTxs],
  }

  return {
    nextData,
    result: {
      success: true,
      awarded: true,
      amount,
      newBalance,
      transaction,
    },
  }
}

/**
 * Correction manuelle administrative de points avec justification obligatoire
 */
export function executeAdminPointsCorrection(
  currentData: AppData,
  volunteerId: string,
  amount: number,
  justification: string,
  admin: InstitutionalUser
): { nextData: AppData; result: AwardPointsResult } {
  const reason = justification.trim()
  if (!reason || reason.length < 5) {
    return {
      nextData: currentData,
      result: {
        success: false,
        awarded: false,
        amount: 0,
        newBalance: 0,
        error: "Une justification explicite (minimum 5 caractères) est obligatoire pour toute correction de points.",
      },
    }
  }

  const volunteer =
    (currentData.volunteerAccounts || []).find((v) => v.id === volunteerId) ||
    currentData.registrants.find((r) => r.id === volunteerId)

  if (!volunteer) {
    return {
      nextData: currentData,
      result: {
        success: false,
        awarded: false,
        amount: 0,
        newBalance: 0,
        error: "Bénévole introuvable.",
      },
    }
  }

  const currentPoints = volunteer.points || 0
  const newBalance = Math.max(0, currentPoints + amount)
  const now = new Date().toISOString()

  const transaction: VolunteerPointTransaction = {
    id: createId(),
    volunteerId,
    amount,
    balanceAfter: newBalance,
    reason: `Correction administrative : ${reason}`,
    authorId: admin.id,
    authorName: `${admin.firstName} ${admin.lastName}`,
    authorRole: admin.role,
    authorWilayaCode: admin.wilayaCode,
    adminNote: reason,
    status: "corrected",
    createdAt: now,
  }

  const updatedAccounts = (currentData.volunteerAccounts || []).map((v) =>
    v.id === volunteerId ? { ...v, points: newBalance, updatedAt: now } : v
  )

  const updatedRegistrants = currentData.registrants.map((r) =>
    r.id === volunteerId ? { ...r, points: newBalance } : r
  )

  const nextData: AppData = {
    ...currentData,
    volunteerAccounts: updatedAccounts,
    registrants: updatedRegistrants,
    volunteerPointTransactions: [transaction, ...(currentData.volunteerPointTransactions || [])],
  }

  return {
    nextData,
    result: {
      success: true,
      awarded: true,
      amount,
      newBalance,
      transaction,
    },
  }
}
