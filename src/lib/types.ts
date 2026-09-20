import type { AssociationSectorId } from "./associations"
import type { CategoryId } from "./categories"
import type { CagnotteTypeId } from "./cagnottes"
import type { InstitutionAuthority, StructureKind } from "./wilayas"

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
  lat?: number
  lng?: number
  structureKind?: StructureKind
  authority?: InstitutionAuthority
}

export type NewsArticle = {
  id: string
  title: string
  description: string
  category: string
  categoryId?: CategoryId
  date: string
  imageDataUrl: string | null
  featured: boolean
  published: boolean
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
}

export type AppData = {
  events: EventItem[]
  announcements: Announcement[]
  activities: Activity[]
  institutions: Institution[]
  news: NewsArticle[]
  registrants: Registrant[]
  cagnottes: Cagnotte[]
  donations: Donation[]
  associations: Association[]
  sosCollectionSites: SosCollectionSite[]
  sosDamagedSites: SosDamagedSite[]
}

export type Cagnotte = {
  id: string
  typeId: CagnotteTypeId
  wilayaCode: number
  goalAmount: number
  raisedAmount: number
  published: boolean
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
}

export type DonationStatus = "completed" | "cancelled"

export type Donation = {
  id: string
  /** Human-readable ledger reference for strict audit */
  reference: string
  cagnotteId: string
  /** Snapshots at donation time — never mutate after create */
  cagnotteTypeId: CagnotteTypeId
  wilayaCode: number
  associationId: string | null
  associationName: string | null
  associationCcp: string | null
  amount: number
  donorName: string
  /** Only last 4 digits — never store full PAN/CVV */
  cardLast4: string
  status: DonationStatus
  createdAt: string
  cancelledAt: string | null
  cancelReason: string | null
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
}
