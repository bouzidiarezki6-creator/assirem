/**
 * ============================================================================
 * CHAÎNE COMPLÈTE DE PARTICIPATION ET RAPPORTS DE MISSION — YED FEL YED
 * INSCRIPTION -> PRÉSENCE -> MISSION -> RAPPORT -> VALIDATION -> RÉCOMPENSES
 * ============================================================================
 */

import type {
  AppData,
  InstitutionalUser,
  MissionReport,
} from "./types"
import { createId } from "./storage"
import { executeAwardPoints } from "./pointsEngine"
import { addNotification } from "./notificationEngine"
import { evaluateAndAwardBadges } from "./badgeEngine"
import { getVolunteerTier } from "./levels"

export type SubmitMissionReportInput = {
  missionId: string
  missionType: "event" | "activity" | "sos_call" | "sos_intervention"
  title: string
  wilayaCode: number
  commune: string
  missionDate: string
  attendeesCount: number
  hoursCompleted: number
  summary: string
  achievements: string[]
  challengesFaced?: string
  author: InstitutionalUser
  isDemo?: boolean
}

export type ReviewMissionReportInput = {
  reportId: string
  decision: "validated" | "rejected"
  reviewNote: string
  reviewer: InstitutionalUser
}

/**
 * Soumission d'un rapport de mission par le responsable de mission
 */
export function executeSubmitMissionReport(
  currentData: AppData,
  input: SubmitMissionReportInput
): { nextData: AppData; report: MissionReport; error?: string } {
  const summary = input.summary.trim()
  if (!summary || summary.length < 10) {
    return {
      nextData: currentData,
      report: null as any,
      error: "Le résumé du rapport doit comporter au moins 10 caractères.",
    }
  }

  const now = new Date().toISOString()
  const report: MissionReport = {
    id: createId(),
    missionId: input.missionId,
    missionType: input.missionType,
    title: input.title,
    wilayaCode: input.wilayaCode,
    commune: input.commune,
    missionDate: input.missionDate,
    authorId: input.author.id,
    authorName: `${input.author.firstName} ${input.author.lastName}`,
    authorRole: input.author.role,
    attendeesCount: input.attendeesCount,
    hoursCompleted: input.hoursCompleted,
    summary,
    achievements: input.achievements,
    challengesFaced: input.challengesFaced,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
    isDemo: input.isDemo ?? false,
  }

  const existingReports = currentData.missionReports || []

  return {
    nextData: {
      ...currentData,
      missionReports: [report, ...existingReports],
    },
    report,
  }
}

/**
 * Validation ou rejet d'un rapport de mission par un auditeur ou administrateur
 * Déclenche automatiquement l'attribution des points et badges à toute l'équipe
 */
export function executeReviewMissionReport(
  currentData: AppData,
  input: ReviewMissionReportInput
): { nextData: AppData; success: boolean; error?: string; pointsAwardedCount: number } {
  const reports = currentData.missionReports || []
  const report = reports.find((r) => r.id === input.reportId)

  if (!report) {
    return { nextData: currentData, success: false, error: "Rapport introuvable.", pointsAwardedCount: 0 }
  }

  if (report.status === "validated") {
    return {
      nextData: currentData,
      success: false,
      error: "Ce rapport a déjà été validé et les récompenses ont été distribuées.",
      pointsAwardedCount: 0,
    }
  }

  const now = new Date().toISOString()
  const reviewerName = `${input.reviewer.firstName} ${input.reviewer.lastName}`

  if (input.decision === "rejected") {
    const updatedReport: MissionReport = {
      ...report,
      status: "rejected",
      reviewedAt: now,
      reviewedById: input.reviewer.id,
      reviewedByName: reviewerName,
      reviewNote: input.reviewNote,
      updatedAt: now,
    }

    return {
      nextData: {
        ...currentData,
        missionReports: reports.map((r) => (r.id === report.id ? updatedReport : r)),
      },
      success: true,
      pointsAwardedCount: 0,
    }
  }

  // --- CAS DE VALIDATION : ATTRIBUTION DES RÉCOMPENSES ---
  let workingData: AppData = { ...currentData }
  let pointsDistributedCount = 0

  // 1. Récompense de 15 points pour l'auteur du rapport (responsable)
  const authorAccount = (workingData.volunteerAccounts || []).find((v) => v.id === report.authorId)
  if (authorAccount) {
    const { nextData } = executeAwardPoints(workingData, {
      volunteerId: authorAccount.id,
      actionType: "report_accepted",
      reason: `Rapport validé : ${report.title}`,
      missionId: report.missionId,
      missionTitle: report.title,
      author: {
        id: input.reviewer.id,
        name: reviewerName,
        role: input.reviewer.role,
        wilayaCode: input.reviewer.wilayaCode,
      },
      idempotencyKey: `REPORT-REWARD-${report.id}-${authorAccount.id}`,
      isDemo: report.isDemo,
    })
    workingData = nextData
    pointsDistributedCount++

    addNotification(workingData, {
      volunteerId: authorAccount.id,
      type: "report_validated",
      title: "Rapport de mission approuvé (+15 pts)",
      message: `Votre rapport de mission pour « ${report.title} » a été validé par l'audit. Les points ont été crédités.`,
      points: 15,
      link: "/mon-espace",
      isDemo: report.isDemo,
    })
  }

  // 2. Récompense de 30 points pour chaque bénévole présent lors de cette mission
  const presenceRecords = (workingData.presenceRecords || []).filter(
    (p) => p.targetId === report.missionId && (p.status === "checked_in" || p.status === "checked_out" || p.status === "manual_validated")
  )

  for (const pres of presenceRecords) {
    const volAcc = (workingData.volunteerAccounts || []).find((v) => v.id === pres.volunteerId)
    if (volAcc) {
      const prevPoints = volAcc.points || 0
      const prevTier = getVolunteerTier(prevPoints)

      const { nextData } = executeAwardPoints(workingData, {
        volunteerId: volAcc.id,
        actionType: "mission_completed",
        reason: `Mission accomplie : ${report.title}`,
        missionId: report.missionId,
        missionTitle: report.title,
        author: {
          id: input.reviewer.id,
          name: reviewerName,
          role: input.reviewer.role,
          wilayaCode: input.reviewer.wilayaCode,
        },
        idempotencyKey: `MISSION-COMPLETED-${report.missionId}-${volAcc.id}`,
        isDemo: report.isDemo,
      })
      workingData = nextData
      pointsDistributedCount++

      // Notification d'accomplissement de mission
      addNotification(workingData, {
        volunteerId: volAcc.id,
        type: "mission_completed",
        title: "Mission validée et récompensée (+30 pts)",
        message: `Félicitations ! La mission « ${report.title} » a été auditée et validée. Votre participation a été récompensée.`,
        points: 30,
        link: "/mon-espace",
        isDemo: report.isDemo,
      })

      // Vérification de passage de palier (Promotion de niveau)
      const updatedVol = (workingData.volunteerAccounts || []).find((v) => v.id === volAcc.id)
      if (updatedVol) {
        const newPoints = updatedVol.points || 0
        const newTier = getVolunteerTier(newPoints)
        if (newTier.level > prevTier.level) {
          addNotification(workingData, {
            volunteerId: updatedVol.id,
            type: "tier_promoted",
            title: `Promotion : Nouveau Palier ${newTier.labelFr} !`,
            message: `Bravo ! Vous avez atteint le palier « ${newTier.labelFr} » avec ${newPoints} points. Consultez vos nouveaux avantages dans Mon Espace.`,
            tierId: newTier.id,
            link: "/mon-espace",
            isDemo: report.isDemo,
          })
        }

        // Évaluation automatique des 10 badges
        const { newlyAwarded, updatedEarnedBadges } = evaluateAndAwardBadges(
          updatedVol,
          workingData.participations || []
        )
        if (newlyAwarded.length > 0) {
          workingData.volunteerAccounts = (workingData.volunteerAccounts || []).map((v) =>
            v.id === updatedVol.id ? { ...v, earnedBadges: updatedEarnedBadges } : v
          )
          for (const b of newlyAwarded) {
            addNotification(workingData, {
              volunteerId: updatedVol.id,
              type: "badge_unlocked",
              title: `Badge débloqué : ${b.name}`,
              message: `Vous avez débloqué le badge « ${b.name} » : ${b.description}`,
              badgeId: b.id,
              link: "/mon-espace",
              isDemo: report.isDemo,
            })
          }
        }
      }
    }
  }

  // Mise à jour de l'état du rapport
  const updatedReport: MissionReport = {
    ...report,
    status: "validated",
    reviewedAt: now,
    reviewedById: input.reviewer.id,
    reviewedByName: reviewerName,
    reviewNote: input.reviewNote || "Rapport validé conforme aux exigences du programme.",
    pointsDistributed: true,
    updatedAt: now,
  }

  workingData.missionReports = (workingData.missionReports || []).map((r) =>
    r.id === report.id ? updatedReport : r
  )

  return {
    nextData: workingData,
    success: true,
    pointsAwardedCount: pointsDistributedCount,
  }
}
