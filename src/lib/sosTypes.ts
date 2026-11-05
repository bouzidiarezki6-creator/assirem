/** =========================================================================
 * 1. BESOINS MATÉRIELS (SosMaterialNeed)
 * ========================================================================= */

export type SosMaterialCategory =
  | "food_water"
  | "clothing_blankets"
  | "medical_supplies"
  | "hygiene_products"
  | "construction_materials"
  | "technical_equipment"
  | "shelter_housing"
  | "other"

export type SosPriorityLevel = "critical" | "high" | "medium" | "low"

export type SosMaterialStatus = "pending" | "validated" | "fulfilled" | "closed" | "rejected"

export type SosMaterialNeed = {
  id: string
  reference: string
  title: string
  description: string
  category: SosMaterialCategory
  wilayaCode: number
  commune: string
  address?: string
  lat?: number
  lng?: number
  requiredQuantity: number
  unit: string // e.g. "kg", "cartons", "packs", "unités", "litres"
  receivedQuantity: number
  priority: SosPriorityLevel
  deadline?: string
  status: SosMaterialStatus
  adminNote?: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export type SosDonationPledge = {
  id: string
  materialNeedId: string
  donorName: string
  donorPhone: string
  donorEmail?: string
  wilayaCode: number
  quantityPledged: number
  status: "pledged" | "received" | "cancelled"
  note?: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/** =========================================================================
 * 2. APPELS À MOBILISATION (SosCall - Professionnels & Bénévoles)
 * ========================================================================= */

export type SosCallType = "professional" | "volunteer"

export type SosProfessionCategory =
  | "health"
  | "construction_technical"
  | "transport"
  | "social"
  | "other"

export type SosCallUrgency = "critical" | "urgent" | "moderate" | "low"

export type SosCallStatus =
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "suspended"
  | "closed"

export type SosCall = {
  id: string
  reference: string
  type: SosCallType
  title: string
  description: string
  // For professionals
  professionCategory?: SosProfessionCategory
  professionId?: string // e.g. "doctor", "nurse", "veterinarian", "mason", "electrician", "driver"
  customProfessionTitle?: string
  mandatoryQualifications?: boolean
  // Slots & Capacity
  requiredSlots: number
  acceptedCount: number
  receivedCount: number
  // Location
  wilayaCode: number
  commune: string
  address?: string
  lat?: number
  lng?: number
  // Timing
  startDate: string
  endDate?: string
  timeSchedule?: string // e.g. "08h00 - 17h00"
  estimatedDuration?: string // e.g. "3 jours"
  // Operational
  urgencyLevel: SosCallUrgency
  conditions?: string
  requiredEquipment?: string
  coordinatorName: string
  coordinatorContact?: string
  // State
  status: SosCallStatus
  adminNote?: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/** =========================================================================
 * 3. CANDIDATURES (SosApplication)
 * ========================================================================= */

export type SosApplicationStatus =
  | "pending"
  | "accepted"
  | "waitlist"
  | "rejected"
  | "cancelled"

export type SosApplication = {
  id: string
  reference: string
  callId: string
  applicationType: SosCallType
  fullName: string
  phone: string
  email?: string
  nationalId?: string // NIN 18 chiffres
  wilayaCode: number
  commune: string
  // Pro specifics
  professionId?: string
  customProfession?: string
  experienceYears?: number
  qualifications?: string
  certificateUrl?: string
  // Volunteer specifics
  hasTransport?: boolean
  skillsNotes?: string
  volunteerId?: string // Optional link to registered VolunteerAccount
  // Availability & Message
  availability: string
  message?: string
  // Workflow
  status: SosApplicationStatus
  adminNote?: string
  isWaitlisted?: boolean
  // Attendance & QR integration
  checkInAt?: string
  checkOutAt?: string
  pointsAwarded?: number
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/** =========================================================================
 * 4. INTERVENTIONS & ÉQUIPES (SosIntervention & SosTeam)
 * ========================================================================= */

export type SosInterventionStatus =
  | "preparation"
  | "in_progress"
  | "suspended"
  | "completed"
  | "cancelled"

export type SosTeamMember = {
  id: string
  applicationId?: string
  name: string
  phone: string
  role: "leader" | "member" | "specialist"
  profession?: string
  addedAt: string
}

export type SosTeam = {
  id: string
  name: string
  leaderName: string
  leaderPhone: string
  members: SosTeamMember[]
  mission: string
}

export type SosIntervention = {
  id: string
  reference: string
  callId?: string
  title: string
  description: string
  coordinatorName: string
  coordinatorPhone?: string
  wilayaCode: number
  commune: string
  address?: string
  lat?: number
  lng?: number
  startDate: string
  endDate?: string
  status: SosInterventionStatus
  instructions?: string
  teams: SosTeam[]
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/** =========================================================================
 * 5. SUIVI PUBLIC TRAÇABLE DES DEMANDES ET SIGNALEMENTS (9 ÉTAPES OFFICIELLES)
 * ========================================================================= */
export type SosTrackingStatus =
  | "received" // 1. Reçu
  | "under_review" // 2. En cours de vérification
  | "verified" // 3. Vérifié
  | "forwarded" // 4. Transmis aux équipes locales
  | "scheduled" // 5. Intervention programmée
  | "in_progress" // 6. En cours d'intervention
  | "resolved" // 7. Résolu sur le terrain
  | "closed" // 8. Clôturé administrativement
  | "rejected" // 9. Rejeté avec motif

export type SosUnifiedTrackableItem = {
  reference: string
  kind: "material_need" | "application" | "incident_report" | "intervention"
  title: string
  wilayaCode: number
  commune: string
  status: SosTrackingStatus
  statusLabelFr: string
  statusLabelAr: string
  submittedAt: string
  updatedAt: string
  adminNote?: string
  rejectionReason?: string
  contactName?: string
}
