import type {
  AppData,
  Activity,
  Announcement,
  Association,
  EventItem,
  Institution,
  NewsArticle,
  Registrant,
  VolunteerAccount,
  VolunteerPointTransaction,
  VolunteerParticipation,
  SosCollectionSite,
  SosDamagedSite,
  SosMaterialNeed,
  SosDonationPledge,
  SosCall,
  SosApplication,
  SosIntervention,
  InstitutionalUser,
  InstitutionalOperation,
  AuditRegistryEntry,
} from "./types"

import { DEFAULT_CHALLENGES } from "./rewardsGamification"
import { DEFAULT_POINT_RULES } from "./pointsEngine"
import {
  DEMO_EVENTS,
  DEMO_ACTIVITIES,
  DEMO_ANNOUNCEMENTS,
  DEMO_INSTITUTIONS,
  DEMO_NEWS,
  DEMO_REGISTRANTS,
  DEMO_PARTICIPATIONS,
  DEMO_VOLUNTEERS,
  DEMO_POINT_TRANSACTIONS,
  DEMO_ASSOCIATIONS,
  DEMO_SOS_COLLECTION_SITES,
  DEMO_SOS_DAMAGED_SITES,
  DEMO_SOS_MATERIAL_NEEDS,
  DEMO_SOS_DONATION_PLEDGES,
  DEMO_SOS_CALLS,
  DEMO_SOS_APPLICATIONS,
  DEMO_SOS_INTERVENTIONS,
  DEMO_INSTITUTIONAL_USERS,
  DEMO_OPERATIONS,
  DEMO_AUDIT_REGISTRY,
  DEMO_PRESENCE_RECORDS,
  DEMO_MISSION_REPORTS,
  DEMO_NOTIFICATIONS,
  isDemoRecord,
  isDemoId,
  countDemoStats,
  purgeDemoData,
  injectDemoData,
  resetDemoData,
  type DemoStats,
} from "./demoData"

const STORAGE_KEY = "yfy-unified-data-v1"
const AUTH_KEY = "yfy-akbou-admin"

function uid() {
  return crypto.randomUUID()
}

export const seedData: AppData = {
  events: DEMO_EVENTS,
  announcements: DEMO_ANNOUNCEMENTS,
  activities: DEMO_ACTIVITIES,
  institutions: DEMO_INSTITUTIONS,
  news: DEMO_NEWS,
  registrants: DEMO_REGISTRANTS,
  participations: DEMO_PARTICIPATIONS,
  volunteerAccounts: DEMO_VOLUNTEERS,
  volunteerPointTransactions: DEMO_POINT_TRANSACTIONS,
  associations: DEMO_ASSOCIATIONS,
  sosCollectionSites: DEMO_SOS_COLLECTION_SITES,
  sosDamagedSites: DEMO_SOS_DAMAGED_SITES,
  sosMaterialNeeds: DEMO_SOS_MATERIAL_NEEDS,
  sosDonationPledges: DEMO_SOS_DONATION_PLEDGES,
  sosCalls: DEMO_SOS_CALLS,
  sosApplications: DEMO_SOS_APPLICATIONS,
  sosInterventions: DEMO_SOS_INTERVENTIONS,
  institutionalUsers: DEMO_INSTITUTIONAL_USERS,
  institutionalOperations: DEMO_OPERATIONS,
  auditRegistry: DEMO_AUDIT_REGISTRY,
  customChallenges: DEFAULT_CHALLENGES,
  awardNominations: [
    {
      id: "demo-nom-01",
      awardType: "best_ambassador",
      nomineeVolunteerId: "demo-vol-nabila",
      nomineeName: "Nabila Ait-Ouali",
      nomineeWilayaCode: 6,
      proposedByRole: "wilaya_admin",
      proposedById: "demo-user-wil-06",
      proposedByName: "Karima Bouzid",
      justification: "Dévouement exceptionnel sur la vallée de la Soummam et encadrement des jeunes bénévoles.",
      status: "approved",
      decisionAt: "2026-11-04T16:00:00.000Z",
      decisionById: "demo-user-nat-01",
      decisionByName: "Mustapha Belkacem",
      decisionReason: "Trophée annuel validé à l'unanimité du comité national.",
      createdAt: "2026-10-25T09:00:00.000Z",
      isDemo: true,
    },
    {
      id: "demo-nom-02",
      awardType: "young_civic_leader",
      nomineeVolunteerId: "demo-vol-yasmine",
      nomineeName: "Yasmine Kaci",
      nomineeWilayaCode: 19,
      proposedByRole: "wilaya_admin",
      proposedById: "demo-user-wil-19",
      proposedByName: "Tarek Mansouri",
      justification: "Animation d'ateliers de sensibilisation à la santé et coordination des visites aux personnes âgées à Sétif.",
      status: "pending",
      createdAt: "2026-11-03T11:00:00.000Z",
      isDemo: true,
    },
  ],
  seasonArchives: [
    {
      seasonId: "season-2026-q3",
      year: 2026,
      quarter: 3,
      title: "Saison 3 2026 (Juillet – Septembre)",
      archivedAt: "2026-10-01T00:00:00.000Z",
      totalPointsDistributed: 14200,
      totalHoursVolunteered: 2150,
      totalMissionsCompleted: 284,
      topVolunteers: [
        {
          volunteerId: "demo-vol-nabila",
          displayName: "Nabila A.",
          wilayaCode: 6,
          commune: "Akbou",
          tier: "ambassadeur",
          pointsInSeason: 580,
          rank: 1,
          awardTitle: "Championne Soummam T3 2026",
        },
        {
          volunteerId: "demo-vol-yasmine",
          displayName: "Yasmine K.",
          wilayaCode: 19,
          commune: "Sétif",
          tier: "exemplaire",
          pointsInSeason: 410,
          rank: 2,
          awardTitle: "Excellence Hauts Plateaux T3",
        },
        {
          volunteerId: "demo-vol-amine",
          displayName: "Amine M.",
          wilayaCode: 6,
          commune: "Béjaïa",
          tier: "confirme",
          pointsInSeason: 280,
          rank: 3,
          awardTitle: "Leader Éco-Citoyen Béjaïa",
        },
      ],
      topTeams: [
        { teamName: "Brigade Verte Gouraya", wilayaCode: 6, points: 1450, rank: 1 },
        { teamName: "Secours Solidaire Hauts Plateaux", wilayaCode: 19, points: 1180, rank: 2 },
      ],
    },
  ],
  notifications: DEMO_NOTIFICATIONS,
  presenceRecords: DEMO_PRESENCE_RECORDS,
  missionReports: DEMO_MISSION_REPORTS,
  pointRulesConfig: DEFAULT_POINT_RULES,
}

function load(): AppData {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      raw = localStorage.getItem("yfy-algeria-volunteer-v9") || localStorage.getItem("yfy-akbou-data-v3")
    }
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
      return structuredClone(seedData)
    }
    const parsed = JSON.parse(raw) as Partial<AppData>
    let changed = false

    // Identify legacy non-demo non-user items to migrate cleanly
    const isLegacySeedId = (id: any) =>
      typeof id === "string" && (
        id.startsWith("evt-") ||
        id.startsWith("act-") ||
        id.startsWith("news-") ||
        id.startsWith("ann-") ||
        id.startsWith("vol-seed-") ||
        id.startsWith("part-seed-") ||
        id.startsWith("op-alger-") ||
        id.startsWith("op-akbou-") ||
        id.startsWith("audit-gen-") ||
        id.startsWith("audit-00") ||
        id.startsWith("user-nat-") ||
        id.startsWith("user-wil-") ||
        id.startsWith("user-loc-") ||
        id.startsWith("user-lead-") ||
        id.startsWith("user-audit-") ||
        id.startsWith("nom-seed-")
      )

    // Events: keep user events, remove obsolete seed events, ensure DEMO_EVENTS present
    const rawEvents = (parsed.events || []).filter((e) => !isLegacySeedId(e.id))
    const hasDemoEvents = rawEvents.some((e) => isDemoRecord(e))
    let events: EventItem[] = hasDemoEvents ? rawEvents : [...DEMO_EVENTS, ...rawEvents]
    if (!hasDemoEvents) changed = true

    // Activities: keep user activities, remove obsolete seed activities, ensure DEMO_ACTIVITIES present
    const rawActivities = (parsed.activities || []).filter((a) => !isLegacySeedId(a.id))
    const hasDemoActivities = rawActivities.some((a) => isDemoRecord(a))
    let activities: Activity[] = hasDemoActivities ? rawActivities : [...DEMO_ACTIVITIES, ...rawActivities]
    if (!hasDemoActivities) changed = true

    // Announcements
    const rawAnnouncements = (parsed.announcements || []).filter((a) => !isLegacySeedId(a.id))
    const hasDemoAnn = rawAnnouncements.some((a) => isDemoRecord(a))
    let announcements: Announcement[] = hasDemoAnn ? rawAnnouncements : [...DEMO_ANNOUNCEMENTS, ...rawAnnouncements]
    if (!hasDemoAnn) changed = true

    // Institutions (Strictly Béjaïa, Sétif, El Eulma)
    const rawInst = (parsed.institutions || []).filter((i) => !isLegacySeedId(i.id))
    const hasDemoInst = rawInst.some((i) => isDemoRecord(i))
    let institutions: Institution[] = hasDemoInst ? rawInst : [...DEMO_INSTITUTIONS, ...rawInst]
    if (!hasDemoInst) changed = true

    // News
    const rawNews = (parsed.news || []).filter((n) => !isLegacySeedId(n.id))
    const hasDemoNews = rawNews.some((n) => isDemoRecord(n))
    let news: NewsArticle[] = hasDemoNews ? rawNews : [...DEMO_NEWS, ...rawNews]
    if (!hasDemoNews) changed = true

    // Volunteers
    const rawVols = (parsed.volunteerAccounts || []).filter((v) => !isLegacySeedId(v.id))
    const hasDemoVols = rawVols.some((v) => isDemoRecord(v))
    let volunteerAccounts: VolunteerAccount[] = hasDemoVols ? rawVols : [...DEMO_VOLUNTEERS, ...rawVols]
    if (!hasDemoVols) changed = true

    // Participations
    const rawParts = (parsed.participations || []).filter((p) => !isLegacySeedId(p.id))
    const hasDemoParts = rawParts.some((p) => isDemoRecord(p))
    let participations: VolunteerParticipation[] = hasDemoParts ? rawParts : [...DEMO_PARTICIPATIONS, ...rawParts]
    if (!hasDemoParts) changed = true

    // Registrants
    const rawRegs = (parsed.registrants || []).filter((r) => !isLegacySeedId(r.id))
    const hasDemoRegs = rawRegs.some((r) => isDemoRecord(r))
    let registrants: Registrant[] = hasDemoRegs ? rawRegs : [...DEMO_REGISTRANTS, ...rawRegs]
    if (!hasDemoRegs) changed = true

    // Point Transactions
    const rawTx = (parsed.volunteerPointTransactions || []).filter((t) => !isLegacySeedId(t.id))
    const hasDemoTx = rawTx.some((t) => isDemoRecord(t))
    let volunteerPointTransactions: VolunteerPointTransaction[] = hasDemoTx ? rawTx : [...DEMO_POINT_TRANSACTIONS, ...rawTx]
    if (!hasDemoTx) changed = true

    // Associations
    const rawAssoc = (parsed.associations || []).filter((a) => !isLegacySeedId(a.id))
    const hasDemoAssoc = rawAssoc.some((a) => isDemoRecord(a))
    let associations: Association[] = hasDemoAssoc ? rawAssoc : [...DEMO_ASSOCIATIONS, ...rawAssoc]
    if (!hasDemoAssoc) changed = true

    // SOS Collections, Damaged, Materials, Pledges, Calls, Applications, Interventions
    const rawSosCol = (parsed.sosCollectionSites || []).filter((s) => !isLegacySeedId(s.id))
    const hasDemoSosCol = rawSosCol.some((s) => isDemoRecord(s))
    let sosCollectionSites = hasDemoSosCol ? rawSosCol : [...DEMO_SOS_COLLECTION_SITES, ...rawSosCol]

    const rawSosDam = (parsed.sosDamagedSites || []).filter((s) => !isLegacySeedId(s.id))
    const hasDemoSosDam = rawSosDam.some((s) => isDemoRecord(s))
    let sosDamagedSites = hasDemoSosDam ? rawSosDam : [...DEMO_SOS_DAMAGED_SITES, ...rawSosDam]

    const rawSosMat = (parsed.sosMaterialNeeds || []).filter((m) => !isLegacySeedId(m.id))
    const hasDemoSosMat = rawSosMat.some((m) => isDemoRecord(m))
    let sosMaterialNeeds = hasDemoSosMat ? rawSosMat : [...DEMO_SOS_MATERIAL_NEEDS, ...rawSosMat]

    const rawSosPledges = (parsed.sosDonationPledges || []).filter((p) => !isLegacySeedId(p.id))
    const hasDemoSosPledges = rawSosPledges.some((p) => isDemoRecord(p))
    let sosDonationPledges = hasDemoSosPledges ? rawSosPledges : [...DEMO_SOS_DONATION_PLEDGES, ...rawSosPledges]

    const rawSosCalls = (parsed.sosCalls || []).filter((c) => !isLegacySeedId(c.id))
    const hasDemoSosCalls = rawSosCalls.some((c) => isDemoRecord(c))
    let sosCalls = hasDemoSosCalls ? rawSosCalls : [...DEMO_SOS_CALLS, ...rawSosCalls]

    const rawSosApps = (parsed.sosApplications || []).filter((a) => !isLegacySeedId(a.id))
    const hasDemoSosApps = rawSosApps.some((a) => isDemoRecord(a))
    let sosApplications = hasDemoSosApps ? rawSosApps : [...DEMO_SOS_APPLICATIONS, ...rawSosApps]

    const rawSosInterv = (parsed.sosInterventions || []).filter((i) => !isLegacySeedId(i.id))
    const hasDemoSosInterv = rawSosInterv.some((i) => isDemoRecord(i))
    let sosInterventions = hasDemoSosInterv ? rawSosInterv : [...DEMO_SOS_INTERVENTIONS, ...rawSosInterv]

    // Institutional Governance
    const rawInstUsers = (parsed.institutionalUsers || []).filter((u) => !isLegacySeedId(u.id))
    const hasDemoInstUsers = rawInstUsers.some((u) => isDemoRecord(u))
    let institutionalUsers = hasDemoInstUsers ? rawInstUsers : [...DEMO_INSTITUTIONAL_USERS, ...rawInstUsers]

    const rawOps = (parsed.institutionalOperations || []).filter((o) => !isLegacySeedId(o.id))
    const hasDemoOps = rawOps.some((o) => isDemoRecord(o))
    let institutionalOperations = hasDemoOps ? rawOps : [...DEMO_OPERATIONS, ...rawOps]

    const rawAudit = (parsed.auditRegistry || []).filter((a) => !isLegacySeedId(a.id))
    const hasDemoAudit = rawAudit.some((a) => isDemoRecord(a))
    let auditRegistry = hasDemoAudit ? rawAudit : [...DEMO_AUDIT_REGISTRY, ...rawAudit]

    const rawPresence = (parsed.presenceRecords || []).filter((p) => !isLegacySeedId(p.id))
    const hasDemoPresence = rawPresence.some((p) => isDemoRecord(p))
    let presenceRecords = hasDemoPresence ? rawPresence : [...DEMO_PRESENCE_RECORDS, ...rawPresence]

    const rawReports = (parsed.missionReports || []).filter((r) => !isLegacySeedId(r.id))
    const hasDemoReports = rawReports.some((r) => isDemoRecord(r))
    let missionReports = hasDemoReports ? rawReports : [...DEMO_MISSION_REPORTS, ...rawReports]

    const rawNotifs = (parsed.notifications || []).filter((n) => !isLegacySeedId(n.id))
    const hasDemoNotifs = rawNotifs.some((n) => isDemoRecord(n))
    let notifications = hasDemoNotifs ? rawNotifs : [...DEMO_NOTIFICATIONS, ...rawNotifs]

    const pointRulesConfig = parsed.pointRulesConfig ?? DEFAULT_POINT_RULES
    const customChallenges = parsed.customChallenges ?? DEFAULT_CHALLENGES
    const awardNominations = parsed.awardNominations ?? seedData.awardNominations
    const seasonArchives = parsed.seasonArchives ?? seedData.seasonArchives

    const next: AppData = {
      events,
      announcements,
      activities,
      institutions,
      news,
      registrants,
      participations,
      volunteerAccounts,
      volunteerPointTransactions,
      associations,
      sosCollectionSites,
      sosDamagedSites,
      sosMaterialNeeds,
      sosDonationPledges,
      sosCalls,
      sosApplications,
      sosInterventions,
      institutionalUsers,
      institutionalOperations,
      auditRegistry,
      customChallenges,
      awardNominations,
      seasonArchives,
      notifications,
      presenceRecords,
      missionReports,
      pointRulesConfig,
    }

    if (changed || !hasDemoEvents) {
      save(next)
    }
    return next
  } catch {
    return structuredClone(seedData)
  }
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn("Storage save error:", e)
  }
}

export function getData(): AppData {
  return load()
}

export function setData(data: AppData) {
  save(data)
}

export function createId() {
  return uid()
}

export function isAdminAuthenticated(): boolean {
  return (
    sessionStorage.getItem(AUTH_KEY) === "1" ||
    sessionStorage.getItem("odej-akbou-admin") === "1"
  )
}

export function loginAdmin(password: string): boolean {
  if (password === "admin123") {
    sessionStorage.setItem(AUTH_KEY, "1")
    return true
  }
  return false
}

export function logoutAdmin() {
  sessionStorage.removeItem(AUTH_KEY)
}

export {
  isDemoId,
  isDemoRecord,
  countDemoStats,
  purgeDemoData,
  injectDemoData,
  resetDemoData,
  type DemoStats,
}

export type {
  AppData,
  Activity,
  Announcement,
  Association,
  EventItem,
  Institution,
  NewsArticle,
  Registrant,
  VolunteerAccount,
  VolunteerPointTransaction,
  SosCollectionSite,
  SosDamagedSite,
  SosMaterialNeed,
  SosDonationPledge,
  SosCall,
  SosApplication,
  SosIntervention,
  InstitutionalUser,
  InstitutionalOperation,
  AuditRegistryEntry,
}
