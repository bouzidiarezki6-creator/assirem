import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react"

import { loadFromSupabase, syncToSupabase } from "@/lib/supabaseSync"
import {
  createId,
  getData,
  setData,
  countDemoStats,
  purgeDemoData,
  resetDemoData,
  type DemoStats,
  type Activity,
  type Announcement,
  type AppData,
  type Association,
  type EventItem,
  type Institution,
  type NewsArticle,
  type Registrant,
  type VolunteerAccount,
  type VolunteerPointTransaction,
  type SosCollectionSite,
  type SosDamagedSite,
  type SosMaterialNeed,
  type SosDonationPledge,
  type SosCall,
  type SosApplication,
  type SosIntervention,
} from "@/lib/storage"
import type {
  SosAidCategoryId,
  SosRequestStatus,
  VolunteerParticipation,
  SosTeam,
  SosTeamMember,
} from "@/lib/types"
import { isValidGps, generateSosReference, isCallFull } from "@/lib/sos"
import {
  parseQrScan,
  generateUniqueVolunteerCode,
  generateUniqueRegistrantCode,
  extractAdherentFromScan,
  type ExtractedAdherent,
} from "@/lib/qr"
import type { AssociationSectorId } from "@/lib/associations"
import { isValidCcp, normalizeCcp } from "@/lib/associations"
import type { CategoryId } from "@/lib/categories"
import {
  calculateVolunteerPoints,
  participationFingerprint,
  type ActivityTypeId,
  type DurationId,
  type ResponsibilityId,
  type PointsInput,
  type PointsBreakdown,
} from "@/lib/volunteerPoints"
import { canAdjustVolunteerPointsManually } from "@/lib/abac"
import type { InstitutionalUser, InstitutionalRole } from "@/lib/governanceTypes"
import {
  calculateLeaderboards,
  calculateChallengesProgress,
  computeHallOfHonorData,
  PHYSICAL_PERKS_CATALOG,
  DEFAULT_CHALLENGES,
  type LeaderboardPeriod,
  type LeaderboardEntry,
  type TeamLeaderboardEntry,
  type ChallengeWithProgress,
  type VolunteerChallenge,
  type HallOfHonorData,
  type PhysicalPerkItem,
  type SpecialAwardNomination,
} from "@/lib/rewardsGamification"
import {
  executeAwardPoints,
  DEFAULT_POINT_RULES,
  type AwardPointsInput,
  type AwardPointsResult,
} from "@/lib/pointsEngine"
import {
  computeVolunteerBadgesProgress,
  type BadgeWithProgress,
} from "@/lib/badgeEngine"
import {
  markAsRead,
  markAllAsRead,
} from "@/lib/notificationEngine"
import {
  executeCheckIn,
  executeCheckOut,
  executeManualPresenceValidation,
  type CheckInInput,
  type ManualValidationInput,
  type CheckInResult,
} from "@/lib/presenceEngine"
import {
  executeSubmitMissionReport,
  executeReviewMissionReport,
  type SubmitMissionReportInput,
  type ReviewMissionReportInput,
} from "@/lib/missionReportChain"
import type {
  MissionReport,
  PointRulesConfig,
} from "@/lib/types"

export type ValidateParticipationInput = {
  volunteerId: string
  activityTitle: string
  activityDate: string
  categoryId: CategoryId
  activityTypeId?: ActivityTypeId
  durationId?: DurationId
  responsibilityId?: ResponsibilityId
  customPoints?: number
  hoursCounted?: number
  adminNote?: string
  authorId?: string
  authorName?: string
  authorRole?: InstitutionalRole
  authorWilayaCode?: number
}

type DataContextValue = {
  data: AppData
  updateAppData: (updater: (prev: AppData) => AppData) => void
  reloadDemoData: () => void
  clearDemoData: () => void
  demoStats: DemoStats
  addEvent: (item: Omit<EventItem, "id">) => void
  updateEvent: (id: string, item: Partial<EventItem>) => void
  deleteEvent: (id: string) => void
  addAnnouncement: (item: Omit<Announcement, "id">) => void
  updateAnnouncement: (id: string, item: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  addActivity: (item: Omit<Activity, "id">) => void
  updateActivity: (id: string, item: Partial<Activity>) => void
  deleteActivity: (id: string) => void
  addInstitution: (item: Omit<Institution, "id">) => void
  updateInstitution: (id: string, item: Partial<Institution>) => void
  deleteInstitution: (id: string) => void
  addNews: (item: Omit<NewsArticle, "id">) => void
  updateNews: (id: string, item: Partial<NewsArticle>) => void
  deleteNews: (id: string) => void
  addRegistrant: (
    item: Omit<Registrant, "id" | "qrCode" | "points" | "registeredAt">
  ) => Registrant | { error: string }
  deleteRegistrant: (id: string) => void
  findRegistrantByScan: (raw: string) => Registrant | null
  extractAdherent: (raw: string) => ExtractedAdherent | null
  previewParticipationPoints: (input: PointsInput) => PointsBreakdown | null
  validateParticipation: (input: ValidateParticipationInput) => { ok: true; participation: VolunteerParticipation } | { ok: false; error: string }
  cancelParticipation: (participationId: string, reason: string, author?: InstitutionalUser) => { ok: true } | { ok: false; error: string }
  modifyParticipationPoints: (participationId: string, newPoints: number, reason: string, author?: InstitutionalUser) => { ok: true } | { ok: false; error: string }
  getVolunteerParticipations: (volunteerId: string) => VolunteerParticipation[]
  getVolunteerStats: (volunteerId: string) => {
    totalPoints: number
    activityCount: number
    hoursVolunteered: number
    hasEmergencyParticipation?: boolean
    hasSkillsParticipation?: boolean
  }

  // Volunteer Reward Accounts
  addVolunteerAccount: (
    account: Omit<VolunteerAccount, "id" | "volunteerCode" | "points" | "status" | "createdAt" | "updatedAt"> & {
      id?: string
      passwordHash?: string
    }
  ) => { ok: true; account: VolunteerAccount } | { ok: false; error: string }
  updateVolunteerAccount: (
    id: string,
    updates: Partial<Pick<VolunteerAccount, "firstName" | "lastName" | "phone" | "wilayaCode" | "commune" | "birthDate" | "skills" | "interests" | "passwordHash" | "publicProfileConsent" | "showWilayaInLeaderboard">>
  ) => { ok: true; account: VolunteerAccount } | { ok: false; error: string }
  deleteVolunteerAccount: (id: string) => void
  adjustVolunteerPoints: (input: {
    volunteerId: string
    amount: number
    reason: string
    missionTitle?: string
    adminNote?: string
    author?: InstitutionalUser
  }) => { ok: true; transaction: VolunteerPointTransaction; newPoints: number } | { ok: false; error: string }
  setVolunteerStatus: (id: string, status: "active" | "suspended") => { ok: true } | { ok: false; error: string }
  getVolunteerTransactions: (volunteerId: string) => VolunteerPointTransaction[]

  // Gamification, Leaderboards & Hall of Honor
  getVolunteerLeaderboards: (period?: LeaderboardPeriod, wilayaCode?: number | "all") => {
    national: LeaderboardEntry[]
    wilaya: LeaderboardEntry[]
    monthly: LeaderboardEntry[]
    teams: TeamLeaderboardEntry[]
  }
  getChallengesWithProgress: (volunteerId?: string) => ChallengeWithProgress[]
  claimChallengeReward: (volunteerId: string, challengeId: string) => { ok: true; pointsAwarded: number; challenge: VolunteerChallenge } | { ok: false; error: string }
  getHallOfHonorData: () => HallOfHonorData
  getPhysicalPerksCatalog: () => PhysicalPerkItem[]
  createCustomChallenge: (challenge: Omit<VolunteerChallenge, "id">, actor?: InstitutionalUser) => { ok: true; challenge: VolunteerChallenge } | { ok: false; error: string }
  toggleChallengeStatus: (challengeId: string, active: boolean, actor?: InstitutionalUser) => { ok: true } | { ok: false; error: string }
  proposeAwardNomination: (nomination: Omit<SpecialAwardNomination, "id" | "createdAt" | "status">, actor?: InstitutionalUser) => { ok: true; nomination: SpecialAwardNomination } | { ok: false; error: string }
  decideAwardNomination: (nominationId: string, decision: "approved" | "rejected", reason: string, actor?: InstitutionalUser) => { ok: true } | { ok: false; error: string }

  // Connected Volunteer Ecosystem
  awardVolunteerPoints: (input: AwardPointsInput) => AwardPointsResult
  recordPresenceCheckIn: (input: CheckInInput) => CheckInResult
  recordPresenceCheckOut: (presenceRecordId: string) => { success: boolean; durationHours: number; error?: string }
  recordManualPresence: (input: ManualValidationInput) => CheckInResult
  submitMissionReport: (input: SubmitMissionReportInput) => { report?: MissionReport; error?: string }
  reviewMissionReport: (input: ReviewMissionReportInput) => { success: boolean; error?: string; pointsAwardedCount: number }
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: (volunteerId: string) => void
  updatePointRulesConfig: (updates: Partial<PointRulesConfig>, authorName?: string) => void
  getVolunteerBadges: (volunteerId: string) => BadgeWithProgress[]

  addAssociation: (item: {
    name: string
    logoDataUrl: string | null
    sectorId: AssociationSectorId
    ccpAccount: string
    published?: boolean
  }) => Association | { error: string }
  updateAssociation: (
    id: string,
    item: Partial<Omit<Association, "id" | "createdAt">>
  ) => Association | { error: string }
  deleteAssociation: (id: string) => void
  addSosCollectionSite: (item: {
    name: string
    lat: number
    lng: number
    wilayaCode: number
    aidCategories: SosAidCategoryId[]
  }) => SosCollectionSite | { error: string }
  updateSosCollectionSite: (
    id: string,
    item: Partial<Omit<SosCollectionSite, "id" | "reference" | "createdAt">>
  ) => SosCollectionSite | { error: string }
  deleteSosCollectionSite: (id: string) => void
  addSosDamagedSite: (item: {
    name: string
    lat: number
    lng: number
    wilayaCode: number
    aidCategories: SosAidCategoryId[]
  }) => SosDamagedSite | { error: string }
  updateSosDamagedSite: (
    id: string,
    item: Partial<Omit<SosDamagedSite, "id" | "reference" | "createdAt">>
  ) => SosDamagedSite | { error: string }
  deleteSosDamagedSite: (id: string) => void

  // Extended SOS Module Methods
  addSosMaterialNeed: (
    item: Omit<SosMaterialNeed, "id" | "reference" | "receivedQuantity" | "createdAt" | "updatedAt">
  ) => SosMaterialNeed | { error: string }
  updateSosMaterialNeed: (
    id: string,
    item: Partial<Omit<SosMaterialNeed, "id" | "reference" | "createdAt">>
  ) => SosMaterialNeed | { error: string }
  deleteSosMaterialNeed: (id: string) => void
  pledgeSosMaterialDonation: (item: {
    materialNeedId: string
    donorName: string
    donorPhone: string
    donorEmail?: string
    wilayaCode: number
    quantityPledged: number
    note?: string
  }) => { ok: true; pledge: SosDonationPledge } | { ok: false; error: string }

  addSosCall: (
    item: Omit<SosCall, "id" | "reference" | "acceptedCount" | "receivedCount" | "createdAt" | "updatedAt">
  ) => SosCall | { error: string }
  updateSosCall: (
    id: string,
    item: Partial<Omit<SosCall, "id" | "reference" | "createdAt">>
  ) => SosCall | { error: string }
  deleteSosCall: (id: string) => void

  submitSosApplication: (
    item: Omit<SosApplication, "id" | "reference" | "status" | "isWaitlisted" | "createdAt" | "updatedAt">
  ) => { ok: true; application: SosApplication } | { ok: false; error: string }
  acceptSosApplication: (
    applicationId: string,
    adminNote?: string
  ) => { ok: true; application: SosApplication } | { ok: false; error: string }
  rejectSosApplication: (
    applicationId: string,
    adminNote?: string
  ) => { ok: true } | { ok: false; error: string }
  waitlistSosApplication: (
    applicationId: string,
    adminNote?: string
  ) => { ok: true } | { ok: false; error: string }
  cancelSosApplicationAcceptance: (
    applicationId: string,
    reason: string
  ) => { ok: true } | { ok: false; error: string }
  recordSosAttendance: (input: {
    applicationId: string
    type: "check_in" | "check_out"
    timestamp?: string
    adminNote?: string
  }) => { ok: true; application: SosApplication } | { ok: false; error: string }

  addSosIntervention: (
    item: Omit<SosIntervention, "id" | "reference" | "createdAt" | "updatedAt">
  ) => SosIntervention | { error: string }
  updateSosIntervention: (
    id: string,
    item: Partial<Omit<SosIntervention, "id" | "reference" | "createdAt">>
  ) => SosIntervention | { error: string }
  deleteSosIntervention: (id: string) => void
  addTeamToIntervention: (
    interventionId: string,
    team: Omit<SosTeam, "id">
  ) => { ok: true; team: SosTeam } | { ok: false; error: string }
  addMemberToTeam: (
    interventionId: string,
    teamId: string,
    member: Omit<SosTeamMember, "id" | "addedAt">
  ) => { ok: true; member: SosTeamMember } | { ok: false; error: string }
}

const DataContext = createContext<DataContextValue | null>(null)

let lastData: AppData | null = null

function persist(next: AppData) {
  lastData = next
  setData(next)
  syncToSupabase(lastData, next).catch((err) => {
    console.warn("Supabase background sync:", err)
  })
  return next
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, _setLocal] = useState<AppData | null>(null)

  const setLocal = useCallback((updater: (prev: AppData) => AppData) => {
    _setLocal((prev) => (prev ? updater(prev) : null))
  }, [])

  useEffect(() => {
    const initData = getData()
    lastData = initData
    _setLocal(initData)

    loadFromSupabase()
      .then((remote) => {
        if (remote) {
          _setLocal((prev) => {
            const base = prev || initData
            const merged = { ...base, ...remote }
            if (!merged.institutions || merged.institutions.length < 10) {
              merged.institutions = base.institutions
            }
            if (!merged.volunteerAccounts || merged.volunteerAccounts.length === 0) {
              merged.volunteerAccounts = base.volunteerAccounts
            }
            lastData = merged
            setData(merged)
            return merged
          })
        }
      })
      .catch((e) => {
        console.warn("Supabase load fallback:", e)
      })
  }, [])



  const updateAppData = useCallback((updater: (prev: AppData) => AppData) => {
    setLocal((prev) => persist(updater(prev)))
  }, [setLocal])

  const reloadDemoData = useCallback(() => {
    setLocal((prev) => persist(resetDemoData(prev)))
  }, [setLocal])

  const clearDemoData = useCallback(() => {
    setLocal((prev) => persist(purgeDemoData(prev)))
  }, [setLocal])

  const demoStats = useMemo(() => (data ? countDemoStats(data) : {
    events: 0,
    activities: 0,
    institutions: 0,
    news: 0,
    announcements: 0,
    volunteers: 0,
    operations: 0,
    sosSites: 0,
    sosNeeds: 0,
    sosCalls: 0,
    totalDemoItems: 0,
  }), [data])

  const addEvent = useCallback((item: Omit<EventItem, "id">) => {
    setLocal((prev) => persist({ ...prev, events: [{ ...item, id: createId() }, ...prev.events] }))
  }, [])

  const updateEvent = useCallback((id: string, item: Partial<EventItem>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        events: prev.events.map((e) => (e.id === id ? { ...e, ...item } : e)),
      })
    )
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setLocal((prev) => persist({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
  }, [])

  const addAnnouncement = useCallback((item: Omit<Announcement, "id">) => {
    setLocal((prev) =>
      persist({ ...prev, announcements: [{ ...item, id: createId() }, ...prev.announcements] })
    )
  }, [])

  const updateAnnouncement = useCallback((id: string, item: Partial<Announcement>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        announcements: prev.announcements.map((a) => (a.id === id ? { ...a, ...item } : a)),
      })
    )
  }, [])

  const deleteAnnouncement = useCallback((id: string) => {
    setLocal((prev) =>
      persist({ ...prev, announcements: prev.announcements.filter((a) => a.id !== id) })
    )
  }, [])

  const addActivity = useCallback((item: Omit<Activity, "id">) => {
    setLocal((prev) =>
      persist({ ...prev, activities: [{ ...item, id: createId() }, ...prev.activities] })
    )
  }, [])

  const updateActivity = useCallback((id: string, item: Partial<Activity>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        activities: prev.activities.map((a) => (a.id === id ? { ...a, ...item } : a)),
      })
    )
  }, [])

  const deleteActivity = useCallback((id: string) => {
    setLocal((prev) =>
      persist({ ...prev, activities: prev.activities.filter((a) => a.id !== id) })
    )
  }, [])

  const addInstitution = useCallback((item: Omit<Institution, "id">) => {
    setLocal((prev) =>
      persist({
        ...prev,
        institutions: [{ ...item, id: createId() }, ...prev.institutions],
      })
    )
  }, [])

  const updateInstitution = useCallback((id: string, item: Partial<Institution>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        institutions: prev.institutions.map((i) => (i.id === id ? { ...i, ...item } : i)),
      })
    )
  }, [])

  const deleteInstitution = useCallback((id: string) => {
    setLocal((prev) =>
      persist({ ...prev, institutions: prev.institutions.filter((i) => i.id !== id) })
    )
  }, [])

  const addNews = useCallback((item: Omit<NewsArticle, "id">) => {
    setLocal((prev) =>
      persist({ ...prev, news: [{ ...item, id: createId() }, ...prev.news] })
    )
  }, [])

  const updateNews = useCallback((id: string, item: Partial<NewsArticle>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        news: prev.news.map((n) => (n.id === id ? { ...n, ...item } : n)),
      })
    )
  }, [])

  const deleteNews = useCallback((id: string) => {
    setLocal((prev) => persist({ ...prev, news: prev.news.filter((n) => n.id !== id) }))
  }, [])


  const addRegistrant = useCallback(
    (item: Omit<Registrant, "id" | "qrCode" | "points" | "registeredAt">) => {
      const nin = item.nationalId.trim()
      const prev = lastData!
      if (prev.registrants.some((r) => r.nationalId === nin || r.id === nin)) {
        return { error: "errors.ninAlreadyRegistered" }
      }

      const existingCodes = prev.registrants.map((r) => r.qrCode)
      const qrCode = generateUniqueRegistrantCode({ nin, existingCodes })

      const created: Registrant = {
        ...item,
        nationalId: nin,
        id: nin,
        qrCode,
        points: 0,
        registeredAt: new Date().toISOString(),
      }

      setLocal((current) => {
        if (current.registrants.some((r) => r.nationalId === nin || r.id === nin)) {
          return current
        }
        return persist({ ...current, registrants: [created, ...current.registrants] })
      })

      return created
    },
    []
  )

  function syncVolunteerPoints(d: AppData, volunteerId: string): AppData {
    const participationPoints = (d.participations || [])
      .filter((p) => p.volunteerId === volunteerId && p.status === "validated")
      .reduce((sum, p) => sum + p.pointsAwarded, 0)

    const adjustmentPoints = (d.volunteerPointTransactions || [])
      .filter((tx) => tx.volunteerId === volunteerId && !tx.participationId)
      .reduce((sum, tx) => sum + tx.amount, 0)

    const points = Math.max(0, participationPoints + adjustmentPoints)
    return {
      ...d,
      registrants: d.registrants.map((r) =>
        r.id === volunteerId ? { ...r, points } : r
      ),
      volunteerAccounts: (d.volunteerAccounts || []).map((v) =>
        v.id === volunteerId ? { ...v, points, updatedAt: new Date().toISOString() } : v
      ),
    }
  }

  // =========================================================================
  // VOLUNTEER REWARD ACCOUNTS & REWARDS PROGRAM
  // =========================================================================

  const addVolunteerAccount = useCallback(
    (
      item: Omit<VolunteerAccount, "id" | "volunteerCode" | "points" | "status" | "createdAt" | "updatedAt"> & {
        id?: string
        passwordHash?: string
      }
    ): { ok: true; account: VolunteerAccount } | { ok: false; error: string } => {
      const email = item.email.trim().toLowerCase()
      const prev = lastData!
      if ((prev.volunteerAccounts || []).some((v) => v.email.toLowerCase() === email)) {
        return { ok: false, error: "Cette adresse email est déjà inscrite." }
      }

      const id = item.id || createId()
      const stamp = new Date().toISOString()
      const existingCodes = (prev.volunteerAccounts || []).map((v) => v.volunteerCode)
      const volunteerCode = generateUniqueVolunteerCode({
        wilayaCode: item.wilayaCode,
        firstName: item.firstName,
        lastName: item.lastName,
        existingCodes,
      })

      const account: VolunteerAccount = {
        ...item,
        id,
        email,
        volunteerCode,
        points: 0,
        status: "active",
        createdAt: stamp,
        updatedAt: stamp,
      }

      // Also ensure an entry exists in registrants so scan and existing CRM can find them
      const qrCode = volunteerCode
      const registrantEntry: Registrant = {
        id,
        qrCode,
        lastName: item.lastName,
        firstName: item.firstName,
        birthDate: item.birthDate || "2000-01-01",
        birthPlace: item.commune,
        nationalId: id,
        points: 0,
        announcementId: null,
        registeredAt: stamp,
      }

      setLocal((current) => {
        const accounts = [account, ...(current.volunteerAccounts || [])]
        const regs = current.registrants.some((r) => r.id === id)
          ? current.registrants
          : [registrantEntry, ...current.registrants]
        return persist({
          ...current,
          volunteerAccounts: accounts,
          registrants: regs,
        })
      })

      return { ok: true, account }
    },
    []
  )

  const updateVolunteerAccount = useCallback(
    (
      id: string,
      updates: Partial<Pick<VolunteerAccount, "firstName" | "lastName" | "phone" | "wilayaCode" | "commune" | "birthDate" | "skills" | "interests" | "passwordHash" | "publicProfileConsent" | "showWilayaInLeaderboard">>
    ): { ok: true; account: VolunteerAccount } | { ok: false; error: string } => {
      let updated: VolunteerAccount | null = null
      let err: string | null = null

      setLocal((prev) => {
        const target = (prev.volunteerAccounts || []).find((v) => v.id === id)
        if (!target) {
          err = "Compte bénévole introuvable."
          return prev
        }

        const stamp = new Date().toISOString()
        updated = {
          ...target,
          ...updates,
          updatedAt: stamp,
        }

        return persist({
          ...prev,
          volunteerAccounts: prev.volunteerAccounts.map((v) => (v.id === id ? updated! : v)),
        })
      })

      if (err) return { ok: false, error: err }
      if (!updated) return { ok: false, error: "Erreur de mise à jour." }
      return { ok: true, account: updated }
    },
    []
  )

  const deleteVolunteerAccount = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        volunteerAccounts: (prev.volunteerAccounts || []).filter((v) => v.id !== id),
        registrants: prev.registrants.filter((r) => r.id !== id),
      })
    )
  }, [])

  const adjustVolunteerPoints = useCallback(
    (input: {
      volunteerId: string
      amount: number
      reason: string
      missionTitle?: string
      adminNote?: string
      author?: InstitutionalUser
    }): { ok: true; transaction: VolunteerPointTransaction; newPoints: number } | { ok: false; error: string } => {
      const reason = input.reason.trim()
      if (!reason || reason.length < 5) {
        return { ok: false, error: "Une justification administrative obligatoire (minimum 5 caractères) est requise pour corriger les points." }
      }

      // Check author permissions if provided
      if (input.author) {
        const currentData = data || lastData
        const targetVol = (currentData?.volunteerAccounts || []).find((v) => v.id === input.volunteerId) ||
                          (currentData?.registrants || []).find((r) => r.id === input.volunteerId)
        const targetWilayaCode = targetVol && "wilayaCode" in targetVol ? targetVol.wilayaCode : undefined
        const check = canAdjustVolunteerPointsManually(input.author, targetWilayaCode, reason)
        if (!check.allowed) {
          return { ok: false, error: check.reason || "Action non autorisée par vos privilèges." }
        }
      }

      let createdTx: VolunteerPointTransaction | null = null
      let newBalance = 0
      let err: string | null = null

      setLocal((prev) => {
        const targetAccount = (prev.volunteerAccounts || []).find((v) => v.id === input.volunteerId)
        const targetRegistrant = prev.registrants.find((r) => r.id === input.volunteerId)

        if (!targetAccount && !targetRegistrant) {
          err = "Compte bénévole introuvable."
          return prev
        }

        const currentPts = targetAccount?.points ?? targetRegistrant?.points ?? 0
        newBalance = Math.max(0, currentPts + input.amount)
        const stamp = new Date().toISOString()

        createdTx = {
          id: createId(),
          volunteerId: input.volunteerId,
          amount: input.amount,
          balanceAfter: newBalance,
          reason,
          missionTitle: input.missionTitle,
          adminNote: input.adminNote,
          authorId: input.author?.id,
          authorName: input.author ? `${input.author.firstName} ${input.author.lastName}` : undefined,
          authorRole: input.author?.role,
          authorWilayaCode: input.author?.wilayaCode,
          status: "corrected",
          createdAt: stamp,
        }

        const updatedAccounts = (prev.volunteerAccounts || []).map((v) =>
          v.id === input.volunteerId ? { ...v, points: newBalance, updatedAt: stamp } : v
        )

        const updatedRegs = prev.registrants.map((r) =>
          r.id === input.volunteerId ? { ...r, points: newBalance } : r
        )

        const txs = [createdTx, ...(prev.volunteerPointTransactions || [])]

        return persist({
          ...prev,
          volunteerAccounts: updatedAccounts,
          registrants: updatedRegs,
          volunteerPointTransactions: txs,
        })
      })

      if (err) return { ok: false, error: err }
      if (!createdTx) return { ok: false, error: "Erreur lors de la modification des points." }
      return { ok: true, transaction: createdTx, newPoints: newBalance }
    },
    [data]
  )

  const setVolunteerStatus = useCallback(
    (id: string, status: "active" | "suspended"): { ok: true } | { ok: false; error: string } => {
      let err: string | null = null
      setLocal((prev) => {
        const target = (prev.volunteerAccounts || []).find((v) => v.id === id)
        if (!target) {
          err = "Compte bénévole introuvable."
          return prev
        }
        return persist({
          ...prev,
          volunteerAccounts: prev.volunteerAccounts.map((v) =>
            v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v
          ),
        })
      })
      if (err) return { ok: false, error: err }
      return { ok: true }
    },
    []
  )

  const getVolunteerTransactions = useCallback(
    (volunteerId: string): VolunteerPointTransaction[] => {
      const current = data || lastData
      if (!current) return []
      return (current.volunteerPointTransactions || [])
        .filter((tx) => tx.volunteerId === volunteerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    [data]
  )

  const getVolunteerLeaderboards = useCallback(
    (period: LeaderboardPeriod = "month", wilayaCode: number | "all" = "all") => {
      const current = data || lastData
      if (!current) {
        return { national: [], wilaya: [], monthly: [], teams: [] }
      }
      return calculateLeaderboards(
        current.volunteerAccounts || [],
        current.participations || [],
        current.volunteerPointTransactions || [],
        period,
        wilayaCode
      )
    },
    [data]
  )

  const getVolunteerStats = useCallback(
    (volunteerId: string) => {
      const current = data || lastData
      if (!current) {
        return {
          totalPoints: 0,
          activityCount: 0,
          hoursVolunteered: 0,
          hasEmergencyParticipation: false,
          hasSkillsParticipation: false,
        }
      }
      const list = (current.participations || []).filter(
        (p: VolunteerParticipation) => p.volunteerId === volunteerId && p.status === "validated"
      )
      const volAccount = (current.volunteerAccounts || []).find((v) => v.id === volunteerId)
      const volRegistrant = current.registrants.find((r) => r.id === volunteerId)
      const totalPoints = volAccount?.points ?? volRegistrant?.points ?? list.reduce((s, p) => s + p.pointsAwarded, 0)
      const hoursVolunteered = list.reduce((s, p) => s + (p.hoursCounted || 0), 0)

      return {
        totalPoints,
        activityCount: list.length,
        hoursVolunteered,
        hasEmergencyParticipation: list.some((p) => p.categoryId === "urgences"),
        hasSkillsParticipation: list.some(
          (p) => p.activityTypeId === "formation" || p.activityTypeId === "coordination" || p.categoryId === "sante"
        ),
      }
    },
    [data]
  )

  const getChallengesWithProgress = useCallback(
    (volunteerId?: string): ChallengeWithProgress[] => {
      const current = data || lastData
      if (!current) return []
      const volunteer = volunteerId ? (current.volunteerAccounts || []).find((v) => v.id === volunteerId) : null
      const stats = volunteerId ? getVolunteerStats(volunteerId) : { totalPoints: 0, activityCount: 0, hoursVolunteered: 0 }
      const challenges = current.customChallenges || DEFAULT_CHALLENGES
      return calculateChallengesProgress(challenges, volunteer, current.participations || [], stats)
    },
    [data, getVolunteerStats]
  )

  const claimChallengeReward = useCallback(
    (volunteerId: string, challengeId: string) => {
      const current = data || lastData
      if (!current) return { ok: false as const, error: "Données non chargées." }
      const vol = (current.volunteerAccounts || []).find((v) => v.id === volunteerId)
      if (!vol) return { ok: false as const, error: "Compte bénévole introuvable." }

      if ((vol.completedChallenges || []).includes(challengeId)) {
        return { ok: false as const, error: "Ce challenge a déjà été validé et récompensé (anti-doublon)." }
      }

      const challenges = current.customChallenges || DEFAULT_CHALLENGES
      const targetChallenge = challenges.find((c) => c.id === challengeId)
      if (!targetChallenge) return { ok: false as const, error: "Challenge introuvable." }

      const stats = getVolunteerStats(volunteerId)
      const list = calculateChallengesProgress([targetChallenge], vol, current.participations || [], stats)
      const evaluated = list[0]
      if (!evaluated || !evaluated.isCompleted) {
        return { ok: false as const, error: "Les conditions de réussite de ce challenge ne sont pas encore atteintes." }
      }

      const pointsToAward = targetChallenge.rewardPoints || 10
      const now = new Date().toISOString()
      const newBal = (vol.points || 0) + pointsToAward

      const tx: VolunteerPointTransaction = {
        id: createId(),
        volunteerId,
        amount: pointsToAward,
        balanceAfter: newBal,
        reason: `Récompense challenge : ${targetChallenge.titleFr}`,
        status: "validated",
        createdAt: now,
      }

      const updatedCompleted = [...(vol.completedChallenges || []), challengeId]

      setLocal((prev) => {
        const next: AppData = {
          ...prev,
          volunteerAccounts: (prev.volunteerAccounts || []).map((v) =>
            v.id === volunteerId
              ? { ...v, points: newBal, completedChallenges: updatedCompleted, updatedAt: now }
              : v
          ),
          volunteerPointTransactions: [tx, ...(prev.volunteerPointTransactions || [])],
        }
        return persist(next)
      })

      return { ok: true as const, pointsAwarded: pointsToAward, challenge: targetChallenge }
    },
    [data, getVolunteerStats]
  )

  const getHallOfHonorData = useCallback((): HallOfHonorData => {
    const current = data || lastData
    if (!current) {
      return {
        ambassadors: [],
        exemplaryVolunteers: [],
        monthlyChampions: [],
        topTeams: [],
        remarkableInitiatives: [],
        seasonLaureates: [],
      }
    }
    return computeHallOfHonorData(
      current.volunteerAccounts || [],
      current.participations || [],
      current.volunteerPointTransactions || [],
      current.seasonArchives || []
    )
  }, [data])

  const getPhysicalPerksCatalog = useCallback((): PhysicalPerkItem[] => {
    return PHYSICAL_PERKS_CATALOG
  }, [])

  const createCustomChallenge = useCallback(
    (challengeInput: Omit<VolunteerChallenge, "id">, actor?: InstitutionalUser) => {
      if (actor && actor.role === "national_auditor") {
        return { ok: false as const, error: "L'auditeur national est en lecture seule stricte." }
      }
      const newId = `ch-${createId()}`
      const newChallenge: VolunteerChallenge = {
        ...challengeInput,
        id: newId,
      }

      setLocal((prev) => {
        const updated = [...(prev.customChallenges || DEFAULT_CHALLENGES), newChallenge]
        return persist({
          ...prev,
          customChallenges: updated,
        })
      })

      return { ok: true as const, challenge: newChallenge }
    },
    []
  )

  const toggleChallengeStatus = useCallback(
    (challengeId: string, active: boolean, actor?: InstitutionalUser) => {
      if (actor && actor.role === "national_auditor") {
        return { ok: false as const, error: "L'auditeur national est en lecture seule stricte." }
      }
      setLocal((prev) => {
        const list = prev.customChallenges || DEFAULT_CHALLENGES
        const updated = list.map((c) => (c.id === challengeId ? { ...c, active } : c))
        return persist({
          ...prev,
          customChallenges: updated,
        })
      })
      return { ok: true as const }
    },
    []
  )

  const proposeAwardNomination = useCallback(
    (nominationInput: Omit<SpecialAwardNomination, "id" | "createdAt" | "status">, actor?: InstitutionalUser) => {
      if (actor && actor.role === "national_auditor") {
        return { ok: false as const, error: "L'auditeur national est en lecture seule stricte." }
      }
      const newNom: SpecialAwardNomination = {
        ...nominationInput,
        id: createId(),
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      setLocal((prev) => {
        const list = [newNom, ...(prev.awardNominations || [])]
        return persist({
          ...prev,
          awardNominations: list,
        })
      })

      return { ok: true as const, nomination: newNom }
    },
    []
  )

  const decideAwardNomination = useCallback(
    (nominationId: string, decision: "approved" | "rejected", reason: string, actor?: InstitutionalUser) => {
      if (actor && actor.role === "national_auditor") {
        return { ok: false as const, error: "L'auditeur national est en lecture seule stricte." }
      }
      const note = reason.trim()
      if (note.length < 5) {
        return { ok: false as const, error: "Une motivation explicite d'au moins 5 caractères est requise." }
      }

      const now = new Date().toISOString()
      setLocal((prev) => {
        const targetNom = (prev.awardNominations || []).find((n) => n.id === nominationId)
        if (!targetNom) return prev

        const updatedNom: SpecialAwardNomination = {
          ...targetNom,
          status: decision,
          decisionAt: now,
          decisionById: actor?.id,
          decisionByName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
          decisionReason: note,
        }

        let updatedAccounts = prev.volunteerAccounts || []
        if (decision === "approved") {
          updatedAccounts = updatedAccounts.map((v) =>
            v.id === targetNom.nomineeVolunteerId
              ? {
                  ...v,
                  specialAwards: Array.from(new Set([...(v.specialAwards || []), targetNom.awardType])),
                  updatedAt: now,
                }
              : v
          )
        }

        return persist({
          ...prev,
          volunteerAccounts: updatedAccounts,
          awardNominations: (prev.awardNominations || []).map((n) => (n.id === nominationId ? updatedNom : n)),
        })
      })

      return { ok: true as const }
    },
    []
  )

  // =========================================================================
  // CONNECTED REWARDS, PRESENCE, MISSIONS & NOTIFICATIONS ECOSYSTEM
  // =========================================================================

  const awardVolunteerPoints = useCallback(
    (input: AwardPointsInput): AwardPointsResult => {
      let res: AwardPointsResult = { success: false, awarded: false, amount: 0, newBalance: 0 }
      setLocal((prev) => {
        const { nextData, result } = executeAwardPoints(prev, input)
        res = result
        return persist(nextData)
      })
      return res
    },
    []
  )

  const recordPresenceCheckIn = useCallback(
    (input: CheckInInput): CheckInResult => {
      let res: CheckInResult = { success: false, pointsAwarded: 0 }
      setLocal((prev) => {
        const { nextData, result } = executeCheckIn(prev, input)
        res = result
        return persist(nextData)
      })
      return res
    },
    []
  )

  const recordPresenceCheckOut = useCallback(
    (presenceRecordId: string) => {
      let res: { success: boolean; durationHours: number; error?: string } = { success: false, durationHours: 0 }
      setLocal((prev) => {
        const { nextData, success, durationHours, error } = executeCheckOut(prev, presenceRecordId)
        res = { success, durationHours, error }
        return persist(nextData)
      })
      return res
    },
    []
  )

  const recordManualPresence = useCallback(
    (input: ManualValidationInput): CheckInResult => {
      let res: CheckInResult = { success: false, pointsAwarded: 0 }
      setLocal((prev) => {
        const { nextData, result } = executeManualPresenceValidation(prev, input)
        res = result
        return persist(nextData)
      })
      return res
    },
    []
  )

  const submitMissionReport = useCallback(
    (input: SubmitMissionReportInput) => {
      let res: { report?: MissionReport; error?: string } = {}
      setLocal((prev) => {
        const { nextData, report, error } = executeSubmitMissionReport(prev, input)
        res = { report, error }
        return persist(nextData)
      })
      return res
    },
    []
  )

  const reviewMissionReport = useCallback(
    (input: ReviewMissionReportInput) => {
      let res: { success: boolean; error?: string; pointsAwardedCount: number } = {
        success: false,
        pointsAwardedCount: 0,
      }
      setLocal((prev) => {
        const { nextData, success, error, pointsAwardedCount } = executeReviewMissionReport(prev, input)
        res = { success, error, pointsAwardedCount }
        return persist(nextData)
      })
      return res
    },
    []
  )

  const markNotificationRead = useCallback((notificationId: string) => {
    setLocal((prev) => persist(markAsRead(prev, notificationId)))
  }, [])

  const markAllNotificationsRead = useCallback((volunteerId: string) => {
    setLocal((prev) => persist(markAllAsRead(prev, volunteerId)))
  }, [])

  const updatePointRulesConfig = useCallback((updates: Partial<PointRulesConfig>, authorName?: string) => {
    setLocal((prev) => {
      const nextRules: PointRulesConfig = {
        ...(prev.pointRulesConfig || DEFAULT_POINT_RULES),
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: authorName || "Administration",
      }
      return persist({
        ...prev,
        pointRulesConfig: nextRules,
      })
    })
  }, [])

  const getVolunteerBadges = useCallback(
    (volunteerId: string): BadgeWithProgress[] => {
      const current = data || lastData
      if (!current) return []
      const volunteer = (current.volunteerAccounts || []).find((v) => v.id === volunteerId)
      if (!volunteer) return []
      return computeVolunteerBadgesProgress(volunteer, current.participations || [])
    },
    [data]
  )

  const deleteRegistrant = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        registrants: prev.registrants.filter((r) => r.id !== id),
        participations: (prev.participations || []).filter((p) => p.volunteerId !== id),
      })
    )
  }, [])

  const extractAdherent = useCallback(
    (raw: string): ExtractedAdherent | null => {
      if (!data) return null
      return extractAdherentFromScan(raw, data)
    },
    [data]
  )

  const findRegistrantByScan = useCallback(
    (raw: string) => {
      if (!data) return null
      const adherent = extractAdherentFromScan(raw, data)
      if (adherent) {
        if (adherent.registrant) return adherent.registrant
        if (adherent.volunteerAccount) {
          const v = adherent.volunteerAccount
          return {
            id: v.id,
            qrCode: v.volunteerCode,
            lastName: v.lastName,
            firstName: v.firstName,
            birthDate: v.birthDate || "2000-01-01",
            birthPlace: v.commune,
            nationalId: v.id,
            points: v.points || 0,
            announcementId: null,
          } as Registrant
        }
      }
      const parsed = parseQrScan(raw)
      const targetCode = (parsed?.code || parsed?.volunteerCode || parsed?.id || raw).trim().toUpperCase()
      return (
        data.registrants.find(
          (r) =>
            r.qrCode.toUpperCase() === targetCode ||
            r.id.toUpperCase() === targetCode
        ) ?? null
      )
    },
    [data]
  )

  const previewParticipationPoints = useCallback((input: PointsInput) => {
    return calculateVolunteerPoints(input)
  }, [])

  const validateParticipation = useCallback((input: ValidateParticipationInput) => {
    const title = input.activityTitle.trim()
    if (!title) return { ok: false as const, error: "errors.activityTitleRequired" }
    if (!input.activityDate) return { ok: false as const, error: "errors.dateRequired" }

    const current = data || lastData
    if (!current) return { ok: false as const, error: "errors.volunteerNotFound" }

    const volunteer = current.registrants.find(
      (r) => r.id === input.volunteerId || r.nationalId === input.volunteerId || r.qrCode === input.volunteerId
    ) || (current.volunteerAccounts || []).find(
      (v) => v.id === input.volunteerId || v.volunteerCode === input.volunteerId
    )

    if (!volunteer) return { ok: false as const, error: "errors.volunteerNotFound" }

    const activityTypeId = input.activityTypeId || "standard"
    const durationId = input.durationId || "h2_4"
    const responsibilityId = input.responsibilityId || "participant"

    const fingerprint = participationFingerprint({
      volunteerId: volunteer.id,
      activityTitle: title,
      activityDate: input.activityDate,
      categoryId: input.categoryId,
      activityTypeId,
    })

    const existing = current.participations?.find(
      (p) => p.fingerprint === fingerprint && p.status === "validated"
    )
    if (existing) {
      return {
        ok: false as const,
        error: "errors.duplicateParticipation",
      }
    }

    let finalPoints = 0
    let hoursCounted = input.hoursCounted ?? 0

    if (typeof input.customPoints === "number" && input.customPoints >= 0) {
      finalPoints = Math.round(input.customPoints)
    } else {
      const breakdown = calculateVolunteerPoints({
        categoryId: input.categoryId,
        activityTypeId,
        durationId,
        responsibilityId,
      })
      finalPoints = breakdown.finalPoints
      hoursCounted = breakdown.hoursCounted
    }

    const now = new Date().toISOString()
    const partId = createId()
    const participation: VolunteerParticipation = {
      id: partId,
      fingerprint,
      volunteerId: volunteer.id,
      activityTitle: title,
      activityDate: input.activityDate,
      categoryId: input.categoryId,
      activityTypeId,
      durationId,
      responsibilityId,
      hoursCounted,
      pointsAwarded: finalPoints,
      originalPoints: finalPoints,
      status: "validated",
      authorId: input.authorId,
      authorName: input.authorName,
      authorRole: input.authorRole,
      authorWilayaCode: input.authorWilayaCode,
      createdAt: now,
      updatedAt: now,
      changes: input.adminNote
        ? [
          {
            id: createId(),
            at: now,
            previousPoints: 0,
            newPoints: finalPoints,
            reason: "Attribution initiale",
            adminNote: input.adminNote,
          },
        ]
        : [],
    }

    setLocal((prev) => {
      const volAccount = (prev.volunteerAccounts || []).find((v) => v.id === volunteer.id)
      const currentBalance = volAccount?.points ?? (volunteer as { points?: number }).points ?? 0
      const newBalance = currentBalance + finalPoints

      const tx: VolunteerPointTransaction = {
        id: createId(),
        volunteerId: volunteer.id,
        amount: finalPoints,
        balanceAfter: newBalance,
        reason: `Validation participation : ${title}`,
        missionTitle: title,
        participationId: partId,
        authorId: input.authorId,
        authorName: input.authorName,
        authorRole: input.authorRole,
        authorWilayaCode: input.authorWilayaCode,
        status: "validated",
        adminNote: input.adminNote,
        createdAt: now,
      }

      const next: AppData = {
        ...prev,
        participations: [participation, ...(prev.participations || [])],
        volunteerPointTransactions: [tx, ...(prev.volunteerPointTransactions || [])],
      }
      return persist(syncVolunteerPoints(next, volunteer.id))
    })

    return { ok: true as const, participation }
  }, [data])

  const cancelParticipation = useCallback((participationId: string, reason: string, author?: InstitutionalUser) => {
    const note = reason.trim()
    if (!note || note.length < 5) return { ok: false as const, error: "errors.cancelReasonRequired" }

    let volunteerId = ""
    setLocal((prev) => {
      const target = (prev.participations || []).find((p) => p.id === participationId)
      if (!target || target.status === "cancelled") return prev
      volunteerId = target.volunteerId
      const now = new Date().toISOString()

      const targetPts = target.pointsAwarded
      const volAccount = (prev.volunteerAccounts || []).find((v) => v.id === volunteerId)
      const curBal = volAccount?.points ?? 0
      const newBal = Math.max(0, curBal - targetPts)

      const cancelTx: VolunteerPointTransaction = {
        id: createId(),
        volunteerId,
        amount: -targetPts,
        balanceAfter: newBal,
        reason: `Annulation mission : ${target.activityTitle} (${note})`,
        missionTitle: target.activityTitle,
        participationId,
        authorId: author?.id,
        authorName: author ? `${author.firstName} ${author.lastName}` : undefined,
        authorRole: author?.role,
        authorWilayaCode: author?.wilayaCode,
        status: "cancelled",
        adminNote: note,
        createdAt: now,
      }

      const next: AppData = {
        ...prev,
        participations: prev.participations.map((p) =>
          p.id === participationId
            ? {
              ...p,
              status: "cancelled" as const,
              pointsAwarded: 0,
              updatedAt: now,
              changes: [
                ...p.changes,
                {
                  id: createId(),
                  at: now,
                  previousPoints: p.pointsAwarded,
                  newPoints: 0,
                  reason: "Annulation de participation",
                  adminNote: note,
                },
              ],
            }
            : p
        ),
        volunteerPointTransactions: [cancelTx, ...(prev.volunteerPointTransactions || [])],
      }
      return persist(syncVolunteerPoints(next, volunteerId))
    })

    if (!volunteerId) return { ok: false as const, error: "errors.participationNotFound" }
    return { ok: true as const }
  }, [])

  const modifyParticipationPoints = useCallback(
    (participationId: string, newPoints: number, reason: string, author?: InstitutionalUser) => {
      const note = reason.trim()
      if (!note || note.length < 5) return { ok: false as const, error: "errors.modifyReasonRequired" }
      if (!Number.isFinite(newPoints) || newPoints < 0) {
        return { ok: false as const, error: "errors.invalidPoints" }
      }
      const rounded = Math.round(newPoints)

      let volunteerId = ""
      let error: string | null = null

      setLocal((prev) => {
        const target = (prev.participations || []).find((p) => p.id === participationId)
        if (!target) {
          error = "errors.participationMissing"
          return prev
        }
        if (target.status !== "validated") {
          error = "errors.onlyValidatedEditable"
          return prev
        }
        if (target.pointsAwarded === rounded) {
          error = "errors.noChangeIdentical"
          return prev
        }
        volunteerId = target.volunteerId
        const now = new Date().toISOString()
        const diff = rounded - target.pointsAwarded

        const volAccount = (prev.volunteerAccounts || []).find((v) => v.id === volunteerId)
        const curBal = volAccount?.points ?? 0
        const newBal = Math.max(0, curBal + diff)

        const modTx: VolunteerPointTransaction = {
          id: createId(),
          volunteerId,
          amount: diff,
          balanceAfter: newBal,
          reason: `Rectification points : ${target.activityTitle} (${note})`,
          missionTitle: target.activityTitle,
          participationId,
          authorId: author?.id,
          authorName: author ? `${author.firstName} ${author.lastName}` : undefined,
          authorRole: author?.role,
          authorWilayaCode: author?.wilayaCode,
          status: "corrected",
          adminNote: note,
          createdAt: now,
        }

        const next: AppData = {
          ...prev,
          participations: prev.participations.map((p) =>
            p.id === participationId
              ? {
                ...p,
                pointsAwarded: rounded,
                updatedAt: now,
                changes: [
                  ...p.changes,
                  {
                    id: createId(),
                    at: now,
                    previousPoints: p.pointsAwarded,
                    newPoints: rounded,
                    reason: "Correction administrative",
                    adminNote: note,
                  },
                ],
              }
              : p
          ),
          volunteerPointTransactions: [modTx, ...(prev.volunteerPointTransactions || [])],
        }
        return persist(syncVolunteerPoints(next, volunteerId))
      })

      if (error) return { ok: false as const, error }
      return { ok: true as const }
    },
    []
  )

  const getVolunteerParticipations = useCallback(
    (volunteerId: string) => {
      const current = data || lastData
      if (!current) return []
      return (current.participations || [])
        .filter((p: VolunteerParticipation) => p.volunteerId === volunteerId)
        .sort((a: VolunteerParticipation, b: VolunteerParticipation) =>
          b.activityDate.localeCompare(a.activityDate) || b.createdAt.localeCompare(a.createdAt)
        )
    },
    [data]
  )

  const addAssociation = useCallback(
    (item: {
      name: string
      logoDataUrl: string | null
      sectorId: AssociationSectorId
      ccpAccount: string
      published?: boolean
    }): Association | { error: string } => {
      const name = item.name.trim()
      if (name.length < 2) return { error: "Nom d'association invalide" }
      const ccp = normalizeCcp(item.ccpAccount)
      if (!isValidCcp(ccp)) return { error: "Compte CCP invalide" }

      const stamp = new Date().toISOString()
      const created: Association = {
        id: createId(),
        name,
        logoDataUrl: item.logoDataUrl,
        sectorId: item.sectorId,
        ccpAccount: ccp,
        published: item.published ?? true,
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({ ...prev, associations: [created, ...prev.associations] })
      )
      return created
    },
    []
  )

  const updateAssociation = useCallback(
    (
      id: string,
      item: Partial<Omit<Association, "id" | "createdAt">>
    ): Association | { error: string } => {
      let updated: Association | null = null
      let error: string | null = null

      setLocal((prev) => {
        const current = prev.associations.find((a) => a.id === id)
        if (!current) {
          error = "Association introuvable"
          return prev
        }

        const name = item.name !== undefined ? item.name.trim() : current.name
        if (name.length < 2) {
          error = "Nom d'association invalide"
          return prev
        }

        const ccpRaw = item.ccpAccount !== undefined ? item.ccpAccount : current.ccpAccount
        const ccp = normalizeCcp(ccpRaw)
        if (!isValidCcp(ccp)) {
          error = "Compte CCP invalide"
          return prev
        }

        updated = {
          ...current,
          name,
          logoDataUrl:
            item.logoDataUrl !== undefined ? item.logoDataUrl : current.logoDataUrl,
          sectorId: item.sectorId ?? current.sectorId,
          ccpAccount: ccp,
          published:
            item.published !== undefined ? item.published : current.published,
          updatedAt: new Date().toISOString(),
        }

        return persist({
          ...prev,
          associations: prev.associations.map((a) => (a.id === id ? updated! : a)),
        })
      })

      if (error) return { error }
      if (!updated) return { error: "Association introuvable" }
      return updated
    },
    []
  )

  const deleteAssociation = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        associations: prev.associations.filter((a) => a.id !== id),
      })
    )
  }, [])

  const addSosCollectionSite = useCallback(
    (item: {
      name: string
      lat: number
      lng: number
      wilayaCode: number
      aidCategories: SosAidCategoryId[]
    }): SosCollectionSite | { error: string } => {
      const name = item.name.trim()
      if (name.length < 2) return { error: "sos.errors.name" }
      if (!isValidGps(item.lat, item.lng)) return { error: "sos.errors.gps" }
      if (!Number.isFinite(item.wilayaCode) || item.wilayaCode < 1 || item.wilayaCode > 69) {
        return { error: "sos.errors.wilaya" }
      }
      if (!item.aidCategories.length) return { error: "sos.errors.aidCategories" }

      const id = createId()
      const stamp = new Date().toISOString()
      const created: SosCollectionSite = {
        id,
        reference: `SOS-LC-${stamp.slice(0, 10).replace(/-/g, "")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
        name,
        lat: item.lat,
        lng: item.lng,
        wilayaCode: item.wilayaCode,
        aidCategories: [...new Set(item.aidCategories)],
        status: "pending",
        adminNote: "",
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({
          ...prev,
          sosCollectionSites: [created, ...prev.sosCollectionSites],
        })
      )
      return created
    },
    []
  )

  const updateSosCollectionSite = useCallback(
    (
      id: string,
      item: Partial<Omit<SosCollectionSite, "id" | "reference" | "createdAt">>
    ): SosCollectionSite | { error: string } => {
      let updated: SosCollectionSite | null = null
      setLocal((prev) => {
        const current = prev.sosCollectionSites.find((r) => r.id === id)
        if (!current) return prev
        const lat = item.lat ?? current.lat
        const lng = item.lng ?? current.lng
        if (item.lat !== undefined || item.lng !== undefined) {
          if (!isValidGps(lat, lng)) return prev
        }
        const aidCategories =
          item.aidCategories !== undefined
            ? [...new Set(item.aidCategories)]
            : current.aidCategories ?? []
        if (item.aidCategories !== undefined && aidCategories.length === 0) return prev
        updated = {
          ...current,
          ...item,
          name: item.name !== undefined ? item.name.trim() : current.name,
          lat,
          lng,
          aidCategories,
          adminNote: item.adminNote !== undefined ? item.adminNote.trim() : current.adminNote,
          status: (item.status as SosRequestStatus | undefined) ?? current.status,
          updatedAt: new Date().toISOString(),
        }
        return persist({
          ...prev,
          sosCollectionSites: prev.sosCollectionSites.map((r) =>
            r.id === id ? updated! : r
          ),
        })
      })
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosCollectionSite = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosCollectionSites: prev.sosCollectionSites.filter((r) => r.id !== id),
      })
    )
  }, [])

  const addSosDamagedSite = useCallback(
    (item: {
      name: string
      lat: number
      lng: number
      wilayaCode: number
      aidCategories: SosAidCategoryId[]
    }): SosDamagedSite | { error: string } => {
      const name = item.name.trim()
      if (name.length < 2) return { error: "sos.errors.name" }
      if (!isValidGps(item.lat, item.lng)) return { error: "sos.errors.gps" }
      if (!Number.isFinite(item.wilayaCode) || item.wilayaCode < 1 || item.wilayaCode > 69) {
        return { error: "sos.errors.wilaya" }
      }
      if (!item.aidCategories.length) return { error: "sos.errors.aidCategories" }

      const id = createId()
      const stamp = new Date().toISOString()
      const created: SosDamagedSite = {
        id,
        reference: `SOS-LE-${stamp.slice(0, 10).replace(/-/g, "")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
        name,
        lat: item.lat,
        lng: item.lng,
        wilayaCode: item.wilayaCode,
        aidCategories: [...new Set(item.aidCategories)],
        status: "pending",
        adminNote: "",
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({
          ...prev,
          sosDamagedSites: [created, ...prev.sosDamagedSites],
        })
      )
      return created
    },
    []
  )

  const updateSosDamagedSite = useCallback(
    (
      id: string,
      item: Partial<Omit<SosDamagedSite, "id" | "reference" | "createdAt">>
    ): SosDamagedSite | { error: string } => {
      let updated: SosDamagedSite | null = null
      setLocal((prev) => {
        const current = prev.sosDamagedSites.find((r) => r.id === id)
        if (!current) return prev
        const lat = item.lat ?? current.lat
        const lng = item.lng ?? current.lng
        if (item.lat !== undefined || item.lng !== undefined) {
          if (!isValidGps(lat, lng)) return prev
        }
        const aidCategories =
          item.aidCategories !== undefined
            ? [...new Set(item.aidCategories)]
            : current.aidCategories
        if (item.aidCategories !== undefined && aidCategories.length === 0) return prev
        updated = {
          ...current,
          ...item,
          name: item.name !== undefined ? item.name.trim() : current.name,
          lat,
          lng,
          aidCategories,
          adminNote: item.adminNote !== undefined ? item.adminNote.trim() : current.adminNote,
          status: (item.status as SosRequestStatus | undefined) ?? current.status,
          updatedAt: new Date().toISOString(),
        }
        return persist({
          ...prev,
          sosDamagedSites: prev.sosDamagedSites.map((r) =>
            r.id === id ? updated! : r
          ),
        })
      })
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosDamagedSite = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosDamagedSites: prev.sosDamagedSites.filter((r) => r.id !== id),
      })
    )
  }, [])

  // =========================================================================
  // EXTENDED SOS: BESOINS MATÉRIELS
  // =========================================================================

  const addSosMaterialNeed = useCallback(
    (
      item: Omit<SosMaterialNeed, "id" | "reference" | "receivedQuantity" | "createdAt" | "updatedAt">
    ): SosMaterialNeed | { error: string } => {
      const title = item.title?.trim()
      if (!title || title.length < 3) return { error: "sos.errors.title" }
      if (!item.requiredQuantity || item.requiredQuantity <= 0) return { error: "sos.errors.quantity" }
      if (!Number.isFinite(item.wilayaCode) || item.wilayaCode < 1 || item.wilayaCode > 69) {
        return { error: "sos.errors.wilaya" }
      }

      const id = createId()
      const stamp = new Date().toISOString()
      const created: SosMaterialNeed = {
        ...item,
        id,
        reference: generateSosReference("MAT", id),
        title,
        description: item.description?.trim() || "",
        commune: item.commune?.trim() || "",
        unit: item.unit?.trim() || "unités",
        receivedQuantity: 0,
        status: item.status || "validated",
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({
          ...prev,
          sosMaterialNeeds: [created, ...(prev.sosMaterialNeeds || [])],
        })
      )
      return created
    },
    []
  )

  const updateSosMaterialNeed = useCallback(
    (
      id: string,
      item: Partial<Omit<SosMaterialNeed, "id" | "reference" | "createdAt">>
    ): SosMaterialNeed | { error: string } => {
      let updated: SosMaterialNeed | null = null
      setLocal((prev) => {
        const current = (prev.sosMaterialNeeds || []).find((m) => m.id === id)
        if (!current) return prev
        const reqQty = item.requiredQuantity !== undefined ? item.requiredQuantity : current.requiredQuantity
        const recQty = item.receivedQuantity !== undefined ? item.receivedQuantity : current.receivedQuantity
        let status = item.status !== undefined ? item.status : current.status
        if (recQty >= reqQty && status === "validated") {
          status = "fulfilled"
        }
        updated = {
          ...current,
          ...item,
          requiredQuantity: reqQty,
          receivedQuantity: recQty,
          status,
          updatedAt: new Date().toISOString(),
        }
        return persist({
          ...prev,
          sosMaterialNeeds: prev.sosMaterialNeeds.map((m) => (m.id === id ? updated! : m)),
        })
      })
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosMaterialNeed = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosMaterialNeeds: (prev.sosMaterialNeeds || []).filter((m) => m.id !== id),
        sosDonationPledges: (prev.sosDonationPledges || []).filter((p) => p.materialNeedId !== id),
      })
    )
  }, [])

  const pledgeSosMaterialDonation = useCallback(
    (item: {
      materialNeedId: string
      donorName: string
      donorPhone: string
      donorEmail?: string
      wilayaCode: number
      quantityPledged: number
      note?: string
    }): { ok: true; pledge: SosDonationPledge } | { ok: false; error: string } => {
      const name = item.donorName.trim()
      const phone = item.donorPhone.trim()
      if (!name || name.length < 2) return { ok: false, error: "sos.errors.name" }
      if (!phone || phone.length < 8) return { ok: false, error: "sos.errors.phone" }
      if (!item.quantityPledged || item.quantityPledged <= 0) return { ok: false, error: "sos.errors.quantity" }

      const id = createId()
      const stamp = new Date().toISOString()
      const pledge: SosDonationPledge = {
        id,
        materialNeedId: item.materialNeedId,
        donorName: name,
        donorPhone: phone,
        donorEmail: item.donorEmail?.trim(),
        wilayaCode: item.wilayaCode,
        quantityPledged: item.quantityPledged,
        status: "received",
        note: item.note?.trim(),
        createdAt: stamp,
        updatedAt: stamp,
      }

      setLocal((prev) => {
        const needs = (prev.sosMaterialNeeds || []).map((m) => {
          if (m.id !== item.materialNeedId) return m
          const newReceived = (m.receivedQuantity || 0) + item.quantityPledged
          const newStatus = newReceived >= m.requiredQuantity && m.status === "validated" ? "fulfilled" : m.status
          return {
            ...m,
            receivedQuantity: newReceived,
            status: newStatus,
            updatedAt: stamp,
          }
        })
        return persist({
          ...prev,
          sosMaterialNeeds: needs,
          sosDonationPledges: [pledge, ...(prev.sosDonationPledges || [])],
        })
      })

      return { ok: true, pledge }
    },
    []
  )

  // =========================================================================
  // EXTENDED SOS: APPELS À MOBILISATION (PRO & BÉNÉVOLES)
  // =========================================================================

  const addSosCall = useCallback(
    (
      item: Omit<SosCall, "id" | "reference" | "acceptedCount" | "receivedCount" | "createdAt" | "updatedAt">
    ): SosCall | { error: string } => {
      const title = item.title?.trim()
      if (!title || title.length < 3) return { error: "sos.errors.title" }
      if (!item.requiredSlots || item.requiredSlots <= 0) return { error: "sos.errors.slots" }
      if (!Number.isFinite(item.wilayaCode) || item.wilayaCode < 1 || item.wilayaCode > 69) {
        return { error: "sos.errors.wilaya" }
      }

      const id = createId()
      const stamp = new Date().toISOString()
      const prefix = item.type === "professional" ? "PRO" : "VOL"
      const created: SosCall = {
        ...item,
        id,
        reference: generateSosReference(prefix, id),
        title,
        description: item.description?.trim() || "",
        commune: item.commune?.trim() || "",
        requiredSlots: Number(item.requiredSlots),
        acceptedCount: 0,
        receivedCount: 0,
        status: item.status || "open",
        createdAt: stamp,
        updatedAt: stamp,
      }

      setLocal((prev) =>
        persist({
          ...prev,
          sosCalls: [created, ...(prev.sosCalls || [])],
        })
      )
      return created
    },
    []
  )

  const updateSosCall = useCallback(
    (
      id: string,
      item: Partial<Omit<SosCall, "id" | "reference" | "createdAt">>
    ): SosCall | { error: string } => {
      let updated: SosCall | null = null
      let err: string | null = null

      setLocal((prev) => {
        const current = (prev.sosCalls || []).find((c) => c.id === id)
        if (!current) {
          err = "admin.sosCrm.errors.missing"
          return prev
        }

        // RÈGLE MÉTIER FORMELLE :
        // "Si la nouvelle capacité est inférieure au nombre de personnes déjà acceptées, bloquer la modification"
        if (item.requiredSlots !== undefined && item.requiredSlots < current.acceptedCount) {
          err = "admin.sosCrm.errors.capacityBelowAccepted"
          return prev
        }

        const requiredSlots = item.requiredSlots !== undefined ? Number(item.requiredSlots) : current.requiredSlots
        let status = item.status !== undefined ? item.status : current.status

        // Auto-update status when capacity is reached or freed
        if (current.acceptedCount >= requiredSlots && status === "open") {
          status = "full"
        } else if (current.acceptedCount < requiredSlots && status === "full") {
          status = "open"
        }

        updated = {
          ...current,
          ...item,
          requiredSlots,
          status,
          updatedAt: new Date().toISOString(),
        }

        return persist({
          ...prev,
          sosCalls: prev.sosCalls.map((c) => (c.id === id ? updated! : c)),
        })
      })

      if (err) return { error: err }
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosCall = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosCalls: (prev.sosCalls || []).filter((c) => c.id !== id),
        sosApplications: (prev.sosApplications || []).filter((a) => a.callId !== id),
      })
    )
  }, [])

  // =========================================================================
  // EXTENDED SOS: CANDIDATURES (APPLICATIONS) & GESTION DES PLACES
  // =========================================================================

  const submitSosApplication = useCallback(
    (
      item: Omit<SosApplication, "id" | "reference" | "status" | "isWaitlisted" | "createdAt" | "updatedAt">
    ): { ok: true; application: SosApplication } | { ok: false; error: string } => {
      const name = item.fullName?.trim()
      const phone = item.phone?.trim()
      if (!name || name.length < 2) return { ok: false, error: "sos.errors.name" }
      if (!phone || phone.length < 8) return { ok: false, error: "sos.errors.phone" }

      const id = createId()
      const stamp = new Date().toISOString()

      let createdApp: SosApplication | null = null
      let err: string | null = null

      setLocal((prev) => {
        const call = (prev.sosCalls || []).find((c) => c.id === item.callId)
        if (!call) {
          err = "admin.sosCrm.errors.callMissing"
          return prev
        }

        const isFull = isCallFull(call) || call.status === "full"
        const status = isFull ? "waitlist" : "pending"
        const isWaitlisted = isFull

        createdApp = {
          ...item,
          id,
          reference: generateSosReference("APP", id),
          fullName: name,
          phone,
          status,
          isWaitlisted,
          createdAt: stamp,
          updatedAt: stamp,
        }

        // Increment receivedCount on the call
        const updatedCalls = prev.sosCalls.map((c) =>
          c.id === item.callId ? { ...c, receivedCount: (c.receivedCount || 0) + 1, updatedAt: stamp } : c
        )

        return persist({
          ...prev,
          sosCalls: updatedCalls,
          sosApplications: [createdApp!, ...(prev.sosApplications || [])],
        })
      })

      if (err) return { ok: false, error: err }
      if (!createdApp) return { ok: false, error: "sos.errors.generic" }
      return { ok: true, application: createdApp }
    },
    []
  )

  const acceptSosApplication = useCallback(
    (
      applicationId: string,
      adminNote?: string
    ): { ok: true; application: SosApplication } | { ok: false; error: string } => {
      let updatedApp: SosApplication | null = null
      let err: string | null = null

      setLocal((prev) => {
        const app = (prev.sosApplications || []).find((a) => a.id === applicationId)
        if (!app) {
          err = "admin.sosCrm.errors.appMissing"
          return prev
        }
        if (app.status === "accepted") {
          updatedApp = app
          return prev
        }

        const call = (prev.sosCalls || []).find((c) => c.id === app.callId)
        if (!call) {
          err = "admin.sosCrm.errors.callMissing"
          return prev
        }

        // Atomic capacity check
        if (call.acceptedCount >= call.requiredSlots) {
          err = "admin.sosCrm.errors.callAlreadyFull"
          return prev
        }

        const newAcceptedCount = call.acceptedCount + 1
        const newCallStatus = newAcceptedCount >= call.requiredSlots ? "full" : call.status
        const stamp = new Date().toISOString()

        updatedApp = {
          ...app,
          status: "accepted",
          isWaitlisted: false,
          adminNote: adminNote !== undefined ? adminNote.trim() : app.adminNote,
          updatedAt: stamp,
        }

        const updatedCalls = prev.sosCalls.map((c) =>
          c.id === call.id
            ? { ...c, acceptedCount: newAcceptedCount, status: newCallStatus, updatedAt: stamp }
            : c
        )

        return persist({
          ...prev,
          sosCalls: updatedCalls,
          sosApplications: prev.sosApplications.map((a) => (a.id === applicationId ? updatedApp! : a)),
        })
      })

      if (err) return { ok: false, error: err }
      if (!updatedApp) return { ok: false, error: "admin.sosCrm.errors.appMissing" }
      return { ok: true, application: updatedApp }
    },
    []
  )

  const rejectSosApplication = useCallback(
    (applicationId: string, adminNote?: string): { ok: true } | { ok: false; error: string } => {
      let ok = false
      setLocal((prev) => {
        const app = (prev.sosApplications || []).find((a) => a.id === applicationId)
        if (!app) return prev

        const wasAccepted = app.status === "accepted"
        let updatedCalls = prev.sosCalls

        if (wasAccepted) {
          updatedCalls = prev.sosCalls.map((c) => {
            if (c.id !== app.callId) return c
            const newCount = Math.max(0, c.acceptedCount - 1)
            const newStatus = c.status === "full" && newCount < c.requiredSlots ? "open" : c.status
            return { ...c, acceptedCount: newCount, status: newStatus, updatedAt: new Date().toISOString() }
          })
        }

        const stamp = new Date().toISOString()
        const updatedApps = prev.sosApplications.map((a) =>
          a.id === applicationId
            ? {
              ...a,
              status: "rejected" as const,
              isWaitlisted: false,
              adminNote: adminNote !== undefined ? adminNote.trim() : a.adminNote,
              updatedAt: stamp,
            }
            : a
        )
        ok = true
        return persist({
          ...prev,
          sosCalls: updatedCalls,
          sosApplications: updatedApps,
        })
      })

      return ok ? { ok: true } : { ok: false, error: "admin.sosCrm.errors.appMissing" }
    },
    []
  )

  const waitlistSosApplication = useCallback(
    (applicationId: string, adminNote?: string): { ok: true } | { ok: false; error: string } => {
      let ok = false
      setLocal((prev) => {
        const app = (prev.sosApplications || []).find((a) => a.id === applicationId)
        if (!app) return prev

        const wasAccepted = app.status === "accepted"
        let updatedCalls = prev.sosCalls

        if (wasAccepted) {
          updatedCalls = prev.sosCalls.map((c) => {
            if (c.id !== app.callId) return c
            const newCount = Math.max(0, c.acceptedCount - 1)
            const newStatus = c.status === "full" && newCount < c.requiredSlots ? "open" : c.status
            return { ...c, acceptedCount: newCount, status: newStatus, updatedAt: new Date().toISOString() }
          })
        }

        const stamp = new Date().toISOString()
        const updatedApps = prev.sosApplications.map((a) =>
          a.id === applicationId
            ? {
              ...a,
              status: "waitlist" as const,
              isWaitlisted: true,
              adminNote: adminNote !== undefined ? adminNote.trim() : a.adminNote,
              updatedAt: stamp,
            }
            : a
        )
        ok = true
        return persist({
          ...prev,
          sosCalls: updatedCalls,
          sosApplications: updatedApps,
        })
      })

      return ok ? { ok: true } : { ok: false, error: "admin.sosCrm.errors.appMissing" }
    },
    []
  )

  const cancelSosApplicationAcceptance = useCallback(
    (applicationId: string, reason: string): { ok: true } | { ok: false; error: string } => {
      let ok = false
      setLocal((prev) => {
        const app = (prev.sosApplications || []).find((a) => a.id === applicationId)
        if (!app) return prev

        const wasAccepted = app.status === "accepted"
        let updatedCalls = prev.sosCalls

        if (wasAccepted) {
          updatedCalls = prev.sosCalls.map((c) => {
            if (c.id !== app.callId) return c
            const newCount = Math.max(0, c.acceptedCount - 1)
            const newStatus = c.status === "full" && newCount < c.requiredSlots ? "open" : c.status
            return { ...c, acceptedCount: newCount, status: newStatus, updatedAt: new Date().toISOString() }
          })
        }

        const stamp = new Date().toISOString()
        const updatedApps = prev.sosApplications.map((a) =>
          a.id === applicationId
            ? {
              ...a,
              status: "cancelled" as const,
              isWaitlisted: false,
              adminNote: reason.trim() ? `Annulé : ${reason.trim()}` : a.adminNote,
              updatedAt: stamp,
            }
            : a
        )
        ok = true
        return persist({
          ...prev,
          sosCalls: updatedCalls,
          sosApplications: updatedApps,
        })
      })

      return ok ? { ok: true } : { ok: false, error: "admin.sosCrm.errors.appMissing" }
    },
    []
  )

  const recordSosAttendance = useCallback(
    (input: {
      applicationId: string
      type: "check_in" | "check_out"
      timestamp?: string
      adminNote?: string
    }): { ok: true; application: SosApplication } | { ok: false; error: string } => {
      let updatedApp: SosApplication | null = null
      let err: string | null = null

      setLocal((prev) => {
        const app = (prev.sosApplications || []).find((a) => a.id === input.applicationId)
        if (!app) {
          err = "admin.sosCrm.errors.appMissing"
          return prev
        }
        if (app.status !== "accepted") {
          err = "admin.sosCrm.errors.appNotAccepted"
          return prev
        }

        const stamp = input.timestamp || new Date().toISOString()
        const checkInAt = input.type === "check_in" ? stamp : app.checkInAt || stamp
        const checkOutAt = input.type === "check_out" ? stamp : app.checkOutAt

        let pointsAwarded = app.pointsAwarded || 0

        // Si pointage check_out et points non encore attribués : calcul des points bénévoles
        let updatedRegistrants = prev.registrants
        let updatedParticipations = prev.participations
        let updatedVolunteerAccounts = prev.volunteerAccounts || []
        let updatedTransactions = prev.volunteerPointTransactions || []

        if (input.type === "check_out" && !app.pointsAwarded) {
          // Attribuer les points bénévoles avec le coefficient urgences (1.4)
          const ptsBreakdown = calculateVolunteerPoints({
            categoryId: "urgences",
            activityTypeId: "standard",
            durationId: "h4_8",
            responsibilityId: app.applicationType === "professional" ? "responsable" : "actif",
          })
          pointsAwarded = ptsBreakdown.finalPoints

          // 1. Check if linked to VolunteerAccount (by volunteerId, email, or phone)
          const matchedVol = (prev.volunteerAccounts || []).find(
            (v) =>
              (app.volunteerId && v.id === app.volunteerId) ||
              (app.email && v.email.toLowerCase() === app.email.toLowerCase()) ||
              (app.phone && v.phone === app.phone)
          )

          const targetVolunteerId =
            matchedVol?.id ||
            (app.nationalId
              ? prev.registrants.find((r) => r.nationalId === app.nationalId)?.id
              : null)

          if (targetVolunteerId) {
            const participationId = createId()
            const call = prev.sosCalls.find((c) => c.id === app.callId)
            const partStamp = new Date().toISOString()
            const newParticipation: VolunteerParticipation = {
              id: participationId,
              fingerprint: participationFingerprint({
                volunteerId: targetVolunteerId,
                activityTitle: call ? `SOS: ${call.title}` : "Mission SOS Urgences",
                activityDate: stamp.slice(0, 10),
                categoryId: "urgences",
                activityTypeId: "standard",
              }),
              volunteerId: targetVolunteerId,
              activityTitle: call ? `SOS: ${call.title}` : "Mission SOS Urgences",
              activityDate: stamp.slice(0, 10),
              categoryId: "urgences",
              activityTypeId: "standard",
              durationId: "h4_8",
              responsibilityId: app.applicationType === "professional" ? "responsable" : "actif",
              hoursCounted: 6,
              pointsAwarded,
              originalPoints: pointsAwarded,
              status: "validated",
              createdAt: partStamp,
              updatedAt: partStamp,
              changes: [
                {
                  id: createId(),
                  at: partStamp,
                  previousPoints: 0,
                  newPoints: pointsAwarded,
                  reason: `Pointage validé mission SOS ${call?.reference || app.reference}`,
                  adminNote: input.adminNote,
                },
              ],
            }

            updatedRegistrants = prev.registrants.map((r) =>
              r.id === targetVolunteerId ? { ...r, points: (r.points || 0) + pointsAwarded } : r
            )
            updatedParticipations = [newParticipation, ...prev.participations]

            // If matched with a VolunteerAccount, credit points and add a transaction
            if (matchedVol) {
              const newBal = (matchedVol.points || 0) + pointsAwarded
              updatedVolunteerAccounts = updatedVolunteerAccounts.map((v) =>
                v.id === matchedVol.id ? { ...v, points: newBal, updatedAt: stamp } : v
              )

              const newTx: VolunteerPointTransaction = {
                id: createId(),
                volunteerId: matchedVol.id,
                amount: pointsAwarded,
                balanceAfter: newBal,
                reason: `Mission validée : ${call?.title || app.reference}`,
                missionTitle: call?.title || "Mission SOS",
                participationId,
                adminNote: input.adminNote,
                createdAt: stamp,
              }

              updatedTransactions = [newTx, ...updatedTransactions]
            }
          }
        }

        updatedApp = {
          ...app,
          checkInAt,
          checkOutAt,
          pointsAwarded,
          adminNote: input.adminNote !== undefined ? input.adminNote.trim() : app.adminNote,
          updatedAt: stamp,
        }

        return persist({
          ...prev,
          registrants: updatedRegistrants,
          participations: updatedParticipations,
          volunteerAccounts: updatedVolunteerAccounts,
          volunteerPointTransactions: updatedTransactions,
          sosApplications: prev.sosApplications.map((a) => (a.id === app.id ? updatedApp! : a)),
        })
      })

      if (err) return { ok: false, error: err }
      if (!updatedApp) return { ok: false, error: "admin.sosCrm.errors.appMissing" }
      return { ok: true, application: updatedApp }
    },
    []
  )

  // =========================================================================
  // EXTENDED SOS: INTERVENTIONS & ÉQUIPES
  // =========================================================================

  const addSosIntervention = useCallback(
    (
      item: Omit<SosIntervention, "id" | "reference" | "createdAt" | "updatedAt">
    ): SosIntervention | { error: string } => {
      const title = item.title?.trim()
      if (!title || title.length < 3) return { error: "sos.errors.title" }

      const id = createId()
      const stamp = new Date().toISOString()
      const created: SosIntervention = {
        ...item,
        id,
        reference: generateSosReference("INT", id),
        title,
        description: item.description?.trim() || "",
        commune: item.commune?.trim() || "",
        teams: item.teams || [],
        status: item.status || "preparation",
        createdAt: stamp,
        updatedAt: stamp,
      }

      setLocal((prev) =>
        persist({
          ...prev,
          sosInterventions: [created, ...(prev.sosInterventions || [])],
        })
      )
      return created
    },
    []
  )

  const updateSosIntervention = useCallback(
    (
      id: string,
      item: Partial<Omit<SosIntervention, "id" | "reference" | "createdAt">>
    ): SosIntervention | { error: string } => {
      let updated: SosIntervention | null = null
      setLocal((prev) => {
        const current = (prev.sosInterventions || []).find((i) => i.id === id)
        if (!current) return prev
        updated = {
          ...current,
          ...item,
          updatedAt: new Date().toISOString(),
        }
        return persist({
          ...prev,
          sosInterventions: prev.sosInterventions.map((i) => (i.id === id ? updated! : i)),
        })
      })
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosIntervention = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosInterventions: (prev.sosInterventions || []).filter((i) => i.id !== id),
      })
    )
  }, [])

  const addTeamToIntervention = useCallback(
    (
      interventionId: string,
      team: Omit<SosTeam, "id">
    ): { ok: true; team: SosTeam } | { ok: false; error: string } => {
      const teamId = createId()
      const newTeam: SosTeam = {
        ...team,
        id: teamId,
        members: team.members || [],
      }
      let ok = false

      setLocal((prev) => {
        const interv = (prev.sosInterventions || []).find((i) => i.id === interventionId)
        if (!interv) return prev
        const updatedTeams = [...(interv.teams || []), newTeam]
        const updatedInterv = { ...interv, teams: updatedTeams, updatedAt: new Date().toISOString() }
        ok = true
        return persist({
          ...prev,
          sosInterventions: prev.sosInterventions.map((i) => (i.id === interventionId ? updatedInterv : i)),
        })
      })

      return ok ? { ok: true, team: newTeam } : { ok: false, error: "admin.sosCrm.errors.missing" }
    },
    []
  )

  const addMemberToTeam = useCallback(
    (
      interventionId: string,
      teamId: string,
      member: Omit<SosTeamMember, "id" | "addedAt">
    ): { ok: true; member: SosTeamMember } | { ok: false; error: string } => {
      const memberId = createId()
      const stamp = new Date().toISOString()
      const newMember: SosTeamMember = {
        ...member,
        id: memberId,
        addedAt: stamp,
      }
      let ok = false

      setLocal((prev) => {
        const interv = (prev.sosInterventions || []).find((i) => i.id === interventionId)
        if (!interv) return prev
        const updatedTeams = (interv.teams || []).map((t) => {
          if (t.id !== teamId) return t
          return {
            ...t,
            members: [...(t.members || []), newMember],
          }
        })
        const updatedInterv = { ...interv, teams: updatedTeams, updatedAt: stamp }
        ok = true
        return persist({
          ...prev,
          sosInterventions: prev.sosInterventions.map((i) => (i.id === interventionId ? updatedInterv : i)),
        })
      })

      return ok ? { ok: true, member: newMember } : { ok: false, error: "admin.sosCrm.errors.missing" }
    },
    []
  )

  const value = useMemo(
    () => ({
      data,
      updateAppData,
      reloadDemoData,
      clearDemoData,
      demoStats,
      addEvent,
      updateEvent,
      deleteEvent,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      addActivity,
      updateActivity,
      deleteActivity,
      addInstitution,
      updateInstitution,
      deleteInstitution,
      addNews,
      updateNews,
      deleteNews,
      addRegistrant,
      deleteRegistrant,
      findRegistrantByScan,
      extractAdherent,
      previewParticipationPoints,
      validateParticipation,
      cancelParticipation,
      modifyParticipationPoints,
      getVolunteerParticipations,
      getVolunteerStats,

      // Volunteer Rewards Account
      addVolunteerAccount,
      updateVolunteerAccount,
      deleteVolunteerAccount,
      adjustVolunteerPoints,
      setVolunteerStatus,
      getVolunteerTransactions,

      // Gamification, Leaderboards & Hall of Honor
      getVolunteerLeaderboards,
      getChallengesWithProgress,
      claimChallengeReward,
      getHallOfHonorData,
      getPhysicalPerksCatalog,
      createCustomChallenge,
      toggleChallengeStatus,
      proposeAwardNomination,
      decideAwardNomination,

      // Connected Volunteer Ecosystem
      awardVolunteerPoints,
      recordPresenceCheckIn,
      recordPresenceCheckOut,
      recordManualPresence,
      submitMissionReport,
      reviewMissionReport,
      markNotificationRead,
      markAllNotificationsRead,
      updatePointRulesConfig,
      getVolunteerBadges,

      addAssociation,
      updateAssociation,
      deleteAssociation,
      addSosCollectionSite,
      updateSosCollectionSite,
      deleteSosCollectionSite,
      addSosDamagedSite,
      updateSosDamagedSite,
      deleteSosDamagedSite,

      // Extended SOS Module
      addSosMaterialNeed,
      updateSosMaterialNeed,
      deleteSosMaterialNeed,
      pledgeSosMaterialDonation,
      addSosCall,
      updateSosCall,
      deleteSosCall,
      submitSosApplication,
      acceptSosApplication,
      rejectSosApplication,
      waitlistSosApplication,
      cancelSosApplicationAcceptance,
      recordSosAttendance,
      addSosIntervention,
      updateSosIntervention,
      deleteSosIntervention,
      addTeamToIntervention,
      addMemberToTeam,
    }),
    [
      data,
      updateAppData,
      reloadDemoData,
      clearDemoData,
      demoStats,
      addEvent,
      updateEvent,
      deleteEvent,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      addActivity,
      updateActivity,
      deleteActivity,
      addInstitution,
      updateInstitution,
      deleteInstitution,
      addNews,
      updateNews,
      deleteNews,
      addRegistrant,
      deleteRegistrant,
      findRegistrantByScan,
      extractAdherent,
      previewParticipationPoints,
      validateParticipation,
      cancelParticipation,
      modifyParticipationPoints,
      getVolunteerParticipations,
      getVolunteerStats,

      // Volunteer Rewards Account
      addVolunteerAccount,
      updateVolunteerAccount,
      deleteVolunteerAccount,
      adjustVolunteerPoints,
      setVolunteerStatus,
      getVolunteerTransactions,

      // Gamification, Leaderboards & Hall of Honor
      getVolunteerLeaderboards,
      getChallengesWithProgress,
      claimChallengeReward,
      getHallOfHonorData,
      getPhysicalPerksCatalog,
      createCustomChallenge,
      toggleChallengeStatus,
      proposeAwardNomination,
      decideAwardNomination,

      // Connected Volunteer Ecosystem
      awardVolunteerPoints,
      recordPresenceCheckIn,
      recordPresenceCheckOut,
      recordManualPresence,
      submitMissionReport,
      reviewMissionReport,
      markNotificationRead,
      markAllNotificationsRead,
      updatePointRulesConfig,
      getVolunteerBadges,

      addAssociation,
      updateAssociation,
      deleteAssociation,
      addSosCollectionSite,
      updateSosCollectionSite,
      deleteSosCollectionSite,
      addSosDamagedSite,
      updateSosDamagedSite,
      deleteSosDamagedSite,

      addSosMaterialNeed,
      updateSosMaterialNeed,
      deleteSosMaterialNeed,
      pledgeSosMaterialDonation,
      addSosCall,
      updateSosCall,
      deleteSosCall,
      submitSosApplication,
      acceptSosApplication,
      rejectSosApplication,
      waitlistSosApplication,
      cancelSosApplicationAcceptance,
      recordSosAttendance,
      addSosIntervention,
      updateSosIntervention,
      deleteSosIntervention,
      addTeamToIntervention,
      addMemberToTeam,
    ]
  )

  if (!data || !lastData) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return <DataContext.Provider value={value as any}>{children}</DataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useAppData must be used within DataProvider")
  return ctx
}
