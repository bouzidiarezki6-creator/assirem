import type { AssociationSectorId } from "./associations"
import type { CategoryId } from "./categories"
import type { InstitutionAuthority, StructureKind } from "./wilayas"
import type { ActivityTypeId, DurationId, ResponsibilityId } from "./volunteerPoints"
import type {
  SosMaterialCategory,
  SosPriorityLevel,
  SosMaterialStatus,
  SosMaterialNeed,
  SosDonationPledge,
  SosCallType,
  SosProfessionCategory,
  SosCallUrgency,
  SosCallStatus,
  SosCall,
  SosApplicationStatus,
  SosApplication,
  SosInterventionStatus,
  SosTeamMember,
  SosTeam,
  SosIntervention,
  SosTrackingStatus,
  SosUnifiedTrackableItem,
} from "./sosTypes"
import type {
  InstitutionalUser,
  InstitutionalOperation,
  InstitutionalRole,
  AuditRegistryEntry,
} from "./governanceTypes"
import type {
  VolunteerChallenge,
  SpecialAwardNomination,
  SeasonArchive,
} from "./rewardsGamification"

export type EventParticipationStatus =
  | "upcoming"
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled"

export type EventItem = {
  id: string
  title: string
  description: string
  date: string
  location: string
  institution: string
  imageDataUrl: string | null
  categoryId?: CategoryId
  requiresRegistration: boolean
  published: boolean
  /** 6 explicit participation states */
  status?: EventParticipationStatus
  hours?: string
  conditions?: string
  capacity?: number
  registeredCount?: number
  wilayaCode?: number
  commune?: string
  isDemo?: boolean
  /** Optional future multilingual CMS fields — never auto-invented */
  title_fr?: string
  title_en?: string
  title_ar?: string
  description_fr?: string
  description_en?: string
  description_ar?: string
}

export type Announcement = {
  id: string
  title: string
  description: string
  openFrom: string
  openUntil: string
  maxSlots: number
  active: boolean
  isDemo?: boolean
}

export type Activity = {
  id: string
  title: string
  description: string
  date: string
  day: string
  month: string
  location: string
  institution: string
  categoryId?: CategoryId
  imageDataUrl: string | null
  published: boolean
  /** 6 explicit participation states */
  status?: EventParticipationStatus
  hours?: string
  conditions?: string
  capacity?: number
  registeredCount?: number
  wilayaCode?: number
  commune?: string
  isDemo?: boolean
}

export type Institution = {
  id: string
  name: string
  type: string
  location: string
  phone: string
  imageDataUrl: string | null
  published: boolean
  /** Wilaya code 1–69 */
  wilayaCode?: number
  commune?: string
  lat?: number
  lng?: number
  structureKind?: StructureKind
  authority?: InstitutionAuthority
  isVerified?: boolean
  email?: string
  hours?: string
  domains?: string[]
  isDemo?: boolean
}

export type NewsArticle = {
  id: string
  title: string
  description: string
  content?: string
  category: string
  categoryId?: CategoryId
  date: string
  imageDataUrl: string | null
  featured: boolean
  published: boolean
  author?: string
  source?: string
  relatedArticleIds?: string[]
  wilayaCode?: number
  commune?: string
  isDemo?: boolean
}

export type Registrant = {
  id: string
  qrCode: string
  lastName: string
  firstName: string
  birthDate: string
  birthPlace: string
  nationalId: string
  points: number
  announcementId: string | null
  eventId?: string | null
  activityId?: string | null
  registeredAt: string
  isDemo?: boolean
}

export type ParticipationStatus = "validated" | "cancelled"

export type ParticipationPointChange = {
  id: string
  at: string
  previousPoints: number
  newPoints: number
  reason: string
  adminNote?: string
}

export type VolunteerParticipation = {
  id: string
  fingerprint: string
  volunteerId: string
  activityTitle: string
  activityDate: string
  categoryId: CategoryId
  activityTypeId: ActivityTypeId
  durationId: DurationId
  responsibilityId: ResponsibilityId
  hoursCounted: number
  pointsAwarded: number
  originalPoints: number
  status: ParticipationStatus
  authorId?: string
  authorName?: string
  authorRole?: InstitutionalRole
  authorWilayaCode?: number
  createdAt: string
  updatedAt: string
  changes: ParticipationPointChange[]
  isDemo?: boolean
}

export type VolunteerSkill =
  | "first_aid"
  | "health"
  | "psychology"
  | "logistics"
  | "transport"
  | "construction"
  | "it"
  | "education"
  | "communication"
  | "environment"
  | "distribution"
  | "other"

export type VolunteerAccount = {
  id: string
  email: string
  passwordHash?: string // For local auth fallback when Supabase Auth is offline
  firstName: string
  lastName: string
  phone: string
  wilayaCode: number
  commune: string
  birthDate?: string
  skills: VolunteerSkill[]
  interests: string[]
  volunteerCode: string // Public safe code e.g. YFY-VOL-20261104-9B3E
  points: number
  status: "active" | "suspended"
  isVerified: boolean
  acceptedTermsAt: string
  publicProfileConsent?: boolean // Consent to appear in public Hall of Honor / Leaderboards
  showWilayaInLeaderboard?: boolean
  completedChallenges?: string[] // IDs of completed challenges
  specialAwards?: string[] // IDs of special awards received
  earnedBadges?: EarnedBadge[] // Automatically awarded badges
  createdAt: string
  updatedAt: string
  avatarUrl?: string
  bio?: string
  isDemo?: boolean
}

export type VolunteerPointTransaction = {
  id: string
  volunteerId: string
  amount: number
  balanceAfter: number
  reason: string
  missionTitle?: string
  participationId?: string
  correctedTransactionId?: string
  adminNote?: string
  authorId?: string
  authorName?: string
  authorRole?: InstitutionalRole
  authorWilayaCode?: number
  status?: "validated" | "corrected" | "cancelled"
  createdAt: string
  isDemo?: boolean
}

export type AppData = {
  events: EventItem[]
  announcements: Announcement[]
  activities: Activity[]
  institutions: Institution[]
  news: NewsArticle[]
  registrants: Registrant[]
  participations: VolunteerParticipation[]

  // Volunteer Accounts for Rewards Program
  volunteerAccounts: VolunteerAccount[]
  volunteerPointTransactions: VolunteerPointTransaction[]

  // Associations & SOS Sites
  associations: Association[]
  sosCollectionSites: SosCollectionSite[]
  sosDamagedSites: SosDamagedSite[]

  // Extended SOS Module
  sosMaterialNeeds: SosMaterialNeed[]
  sosDonationPledges: SosDonationPledge[]
  sosCalls: SosCall[]
  sosApplications: SosApplication[]
  sosInterventions: SosIntervention[]

  // Institutional Governance & Traceability
  institutionalUsers: InstitutionalUser[]
  institutionalOperations: InstitutionalOperation[]
  auditRegistry: AuditRegistryEntry[]

  // Rewards, Challenges, Saisons & Gamification
  customChallenges?: VolunteerChallenge[]
  awardNominations?: SpecialAwardNomination[]
  seasonArchives?: SeasonArchive[]

  // Connected Volunteer Ecosystem
  notifications?: AppNotification[]
  presenceRecords?: PresenceRecord[]
  missionReports?: MissionReport[]
  pointRulesConfig?: PointRulesConfig
}

export type EarnedBadge = {
  badgeId: string
  unlockedAt: string
  isDemo?: boolean
}

export type NotificationType =
  | "points_awarded"
  | "badge_unlocked"
  | "tier_promoted"
  | "presence_confirmed"
  | "mission_completed"
  | "report_submitted"
  | "report_validated"
  | "report_rejected"
  | "registration_confirmed"
  | "admin_message"

export type AppNotification = {
  id: string
  volunteerId: string
  type: NotificationType
  title: string
  message: string
  points?: number
  badgeId?: string
  tierId?: string
  read: boolean
  createdAt: string
  link?: string
  isDemo?: boolean
}

export type PresenceStatus = "checked_in" | "checked_out" | "manual_validated" | "excused"

export type PresenceRecord = {
  id: string
  volunteerId: string
  volunteerName: string
  volunteerCode: string
  targetType: "event" | "activity" | "sos_call" | "sos_intervention"
  targetId: string
  targetTitle: string
  wilayaCode: number
  commune: string
  checkInAt: string
  checkOutAt?: string
  durationHours?: number
  status: PresenceStatus
  scannedByRole?: InstitutionalRole
  scannedById?: string
  scannedByName?: string
  manualValidationReason?: string
  pointsAwarded?: number
  createdAt: string
  isDemo?: boolean
}

export type MissionReportStatus = "draft" | "submitted" | "validated" | "rejected"

export type MissionReport = {
  id: string
  missionId: string
  missionType: "event" | "activity" | "sos_call" | "sos_intervention"
  title: string
  wilayaCode: number
  commune: string
  missionDate: string
  authorId: string
  authorName: string
  authorRole: InstitutionalRole
  attendeesCount: number
  hoursCompleted: number
  summary: string
  achievements: string[]
  challengesFaced?: string
  status: MissionReportStatus
  reviewedAt?: string
  reviewedById?: string
  reviewedByName?: string
  reviewNote?: string
  pointsDistributed?: boolean
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export type PointRulesConfig = {
  registrationValidated: number // default 5
  presenceConfirmed: number // default 10
  missionCompleted: number // default 30
  reportAccepted: number // default 15
  criticalMissionBonus: number // default 10
  exceptionalMissionBonus: number // default 20
  lastUpdated?: string
  updatedBy?: string
}

export type Association = {
  id: string
  name: string
  logoDataUrl: string | null
  sectorId: AssociationSectorId
  /** Algerian CCP / postal account number */
  ccpAccount: string
  published: boolean
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export type SosRequestStatus = "pending" | "validated" | "rejected" | "closed"

export type SosAidCategoryId =
  | "food"
  | "clothing"
  | "medical"
  | "shelter"
  | "hygiene"
  | "other"

/** Lieu de collecte */
export type SosCollectionSite = {
  id: string
  reference: string
  name: string
  lat: number
  lng: number
  wilayaCode: number
  /** Catégories d'aides collectées sur ce lieu */
  aidCategories: SosAidCategoryId[]
  status: SosRequestStatus
  adminNote: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/** Lieu endommagé */
export type SosDamagedSite = {
  id: string
  reference: string
  name: string
  lat: number
  lng: number
  wilayaCode: number
  /** Catégories d'aides que ce lieu va recevoir */
  aidCategories: SosAidCategoryId[]
  status: SosRequestStatus
  adminNote: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export type {
  SosMaterialCategory,
  SosPriorityLevel,
  SosMaterialStatus,
  SosMaterialNeed,
  SosDonationPledge,
  SosCallType,
  SosProfessionCategory,
  SosCallUrgency,
  SosCallStatus,
  SosCall,
  SosApplicationStatus,
  SosApplication,
  SosInterventionStatus,
  SosTeamMember,
  SosTeam,
  SosIntervention,
  SosTrackingStatus,
  SosUnifiedTrackableItem,
}

export type {
  InstitutionalRole,
  InstitutionalUserStatus,
  InstitutionalUser,
  OperationWorkflowStatus,
  OperationCategory,
  OperationRiskLevel,
  OperationValidationLevel,
  VerificationStage,
  DigitalAttestation,
  InstitutionalOperation,
  AuditRegistryEntry,
  InstitutionalKpis,
} from "./governanceTypes"

export type {
  VolunteerChallenge,
  SpecialAwardNomination,
  SeasonArchive,
  PerkStatus,
  TierPerkItem,
  LeaderboardEntry,
  TeamLeaderboardEntry,
  HallOfHonorData,
} from "./rewardsGamification"
