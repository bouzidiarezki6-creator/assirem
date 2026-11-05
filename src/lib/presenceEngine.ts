/**
 * ============================================================================
 * SYSTÈME QR CODE : PRÉSENCE ET AUTHENTIFICATION SUR LE TERRAIN — YED FEL YED
 * Horodatage, traçabilité, détection des fraudes et validation manuelle de secours
 * ============================================================================
 */

import type {
  AppData,
  InstitutionalRole,
  InstitutionalUser,
  PresenceRecord,
  VolunteerAccount,
} from "./types"
import { createId } from "./storage"
import { executeAwardPoints } from "./pointsEngine"
import { addNotification } from "./notificationEngine"
import { evaluateAndAwardBadges } from "./badgeEngine"

export type CheckInInput = {
  volunteerCodeOrId: string
  targetType: "event" | "activity" | "sos_call" | "sos_intervention"
  targetId: string
  targetTitle: string
  wilayaCode: number
  commune: string
  scanner?: {
    id?: string
    name?: string
    role?: InstitutionalRole
    wilayaCode?: number
  }
  isDemo?: boolean
}

export type ManualValidationInput = {
  volunteerId: string
  targetType: "event" | "activity" | "sos_call" | "sos_intervention"
  targetId: string
  targetTitle: string
  wilayaCode: number
  commune: string
  reason: string
  admin: InstitutionalUser
  isDemo?: boolean
}

export type CheckInResult = {
  success: boolean
  record?: PresenceRecord
  pointsAwarded: number
  error?: string
  alreadyCheckedIn?: boolean
}

/**
 * Retrouve un bénévole par son code public, QR code, NIN ou identifiant
 */
export function resolveVolunteer(
  currentData: AppData,
  query: string
): VolunteerAccount | null {
  const needle = query.trim().toUpperCase()
  if (!needle) return null

  // Recherche dans les comptes bénévoles
  const byAccount = (currentData.volunteerAccounts || []).find(
    (v) =>
      v.id.toUpperCase() === needle ||
      v.volunteerCode.toUpperCase() === needle ||
      v.email.toUpperCase() === needle ||
      (v.phone && v.phone === needle)
  )
  if (byAccount) return byAccount

  // Recherche dans les registrants
  const byReg = currentData.registrants.find(
    (r) =>
      r.id.toUpperCase() === needle ||
      r.qrCode.toUpperCase() === needle ||
      r.nationalId.toUpperCase() === needle
  )
  if (byReg) {
    // Si trouvé dans les registrants mais pas dans volunteerAccounts, mapping
    return {
      id: byReg.id,
      email: `${byReg.firstName.toLowerCase()}.${byReg.lastName.toLowerCase()}@demo.dz`,
      firstName: byByFirstName(byReg.firstName),
      lastName: byReg.lastName,
      phone: "0550000000",
      wilayaCode: 6,
      commune: byReg.birthPlace || "Béjaïa",
      skills: ["first_aid"],
      interests: [],
      volunteerCode: `YFY-VOL-${byReg.qrCode}`,
      points: byReg.points || 0,
      status: "active",
      isVerified: true,
      acceptedTermsAt: byReg.registeredAt,
      createdAt: byReg.registeredAt,
      updatedAt: byReg.registeredAt,
    }
  }

  return null
}

function byByFirstName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

/**
 * Effectue un pointage d'arrivée (Check-in) avec horodatage et attribution automatique de 10 points
 */
export function executeCheckIn(
  currentData: AppData,
  input: CheckInInput
): { nextData: AppData; result: CheckInResult } {
  const volunteer = resolveVolunteer(currentData, input.volunteerCodeOrId)
  if (!volunteer) {
    return {
      nextData: currentData,
      result: {
        success: false,
        pointsAwarded: 0,
        error: "Code bénévole ou QR non reconnu dans le registre officiel.",
      },
    }
  }

  // Vérification anti-doublon : déjà pointé pour cette mission aujourd'hui ?
  const existingRecords = currentData.presenceRecords || []
  const today = new Date().toISOString().slice(0, 10)
  const duplicate = existingRecords.find(
    (r) =>
      r.volunteerId === volunteer.id &&
      r.targetId === input.targetId &&
      r.checkInAt.startsWith(today)
  )

  if (duplicate) {
    return {
      nextData: currentData,
      result: {
        success: true,
        alreadyCheckedIn: true,
        record: duplicate,
        pointsAwarded: 0,
        error: "Bénévole déjà pointé présent pour cette mission aujourd'hui.",
      },
    }
  }

  const now = new Date().toISOString()
  const recordId = createId()

  const record: PresenceRecord = {
    id: recordId,
    volunteerId: volunteer.id,
    volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
    volunteerCode: volunteer.volunteerCode,
    targetType: input.targetType,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    wilayaCode: input.wilayaCode,
    commune: input.commune,
    checkInAt: now,
    status: "checked_in",
    scannedByRole: input.scanner?.role,
    scannedById: input.scanner?.id,
    scannedByName: input.scanner?.name,
    pointsAwarded: 10,
    createdAt: now,
    isDemo: input.isDemo ?? false,
  }

  // Attribution automatique des 10 points de présence
  const { nextData: dataWithPoints } = executeAwardPoints(currentData, {
    volunteerId: volunteer.id,
    actionType: "presence_confirmed",
    reason: `Présence validée : ${input.targetTitle}`,
    missionId: input.targetId,
    missionTitle: input.targetTitle,
    author: input.scanner,
    idempotencyKey: `PRESENCE-${input.targetId}-${volunteer.id}-${today}`,
    isDemo: input.isDemo,
  })

  // Ajout de la notification
  const { nextData: dataWithNotif } = addNotification(dataWithPoints, {
    volunteerId: volunteer.id,
    type: "presence_confirmed",
    title: "Présence confirmée sur le terrain",
    message: `Votre présence à la mission « ${input.targetTitle} » a été enregistrée avec succès (+10 points).`,
    points: 10,
    link: "/mon-espace",
    isDemo: input.isDemo,
  })

  // Sauvegarde du pointage dans l'écosystème
  const finalData: AppData = {
    ...dataWithNotif,
    presenceRecords: [record, ...(dataWithNotif.presenceRecords || [])],
  }

  // Évaluation automatique des badges
  const targetAcc = (finalData.volunteerAccounts || []).find((v) => v.id === volunteer.id)
  if (targetAcc) {
    const { newlyAwarded, updatedEarnedBadges } = evaluateAndAwardBadges(
      targetAcc,
      finalData.participations || []
    )
    if (newlyAwarded.length > 0) {
      finalData.volunteerAccounts = (finalData.volunteerAccounts || []).map((v) =>
        v.id === volunteer.id ? { ...v, earnedBadges: updatedEarnedBadges } : v
      )
      // Notification pour chaque nouveau badge
      for (const badge of newlyAwarded) {
        addNotification(finalData, {
          volunteerId: volunteer.id,
          type: "badge_unlocked",
          title: `Nouveau Badge débloqué : ${badge.name}`,
          message: `Félicitations ! Vous avez obtenu le badge « ${badge.name} » : ${badge.description}`,
          badgeId: badge.id,
          link: "/mon-espace",
          isDemo: input.isDemo,
        })
      }
    }
  }

  return {
    nextData: finalData,
    result: {
      success: true,
      record,
      pointsAwarded: 10,
    },
  }
}

/**
 * Pointage de départ (Check-out) avec calcul de la durée effective de participation
 */
export function executeCheckOut(
  currentData: AppData,
  presenceRecordId: string
): { nextData: AppData; success: boolean; durationHours: number; error?: string } {
  const records = currentData.presenceRecords || []
  const record = records.find((r) => r.id === presenceRecordId)

  if (!record) {
    return { nextData: currentData, success: false, durationHours: 0, error: "Fiche de présence introuvable." }
  }

  if (record.checkOutAt) {
    return {
      nextData: currentData,
      success: true,
      durationHours: record.durationHours || 0,
      error: "Départ déjà enregistré pour ce bénévole.",
    }
  }

  const now = new Date().toISOString()
  const startMs = new Date(record.checkInAt).getTime()
  const endMs = new Date(now).getTime()
  const hours = Math.max(0.5, Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 10) / 10)

  const updatedRecord: PresenceRecord = {
    ...record,
    checkOutAt: now,
    durationHours: hours,
    status: "checked_out",
  }

  const nextData: AppData = {
    ...currentData,
    presenceRecords: records.map((r) => (r.id === presenceRecordId ? updatedRecord : r)),
  }

  return {
    nextData,
    success: true,
    durationHours: hours,
  }
}

/**
 * Validation manuelle de présence de secours par un responsable ou administrateur
 */
export function executeManualPresenceValidation(
  currentData: AppData,
  input: ManualValidationInput
): { nextData: AppData; result: CheckInResult } {
  const reason = input.reason.trim()
  if (!reason || reason.length < 5) {
    return {
      nextData: currentData,
      result: {
        success: false,
        pointsAwarded: 0,
        error: "Un motif explicite (minimum 5 caractères) est obligatoire pour valider manuellement une présence.",
      },
    }
  }

  return executeCheckIn(currentData, {
    volunteerCodeOrId: input.volunteerId,
    targetType: input.targetType,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    wilayaCode: input.wilayaCode,
    commune: input.commune,
    scanner: {
      id: input.admin.id,
      name: `${input.admin.firstName} ${input.admin.lastName}`,
      role: input.admin.role,
      wilayaCode: input.admin.wilayaCode,
    },
    isDemo: input.isDemo,
  })
}
