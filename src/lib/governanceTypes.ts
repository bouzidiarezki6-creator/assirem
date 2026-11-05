/**
 * ============================================================================
 * MODULE DE GOUVERNANCE ET DE TRAÇABILITÉ INSTITUTIONNELLE — YED FEL YED (يد في يد)
 * Définitions TypeScript : Rôles, Permissions RBAC/ABAC, Cycle de Validation,
 * Attestations Numériques et Registre Central de Traçabilité.
 * ============================================================================
 */

export type InstitutionalRole =
  | "national_admin"      // Niveau 1 — Administrateur National
  | "wilaya_admin"        // Niveau 2 — Administrateur de Wilaya
  | "local_coordinator"   // Niveau 3 — Coordinateur Local (Commune / Daïra)
  | "mission_lead"        // Niveau 4 — Responsable de Mission
  | "national_auditor"    // Rôle Transversal — Auditeur National (Lecture seule)

export type InstitutionalUserStatus =
  | "pending_activation"
  | "active"
  | "suspended"
  | "deactivated"

export interface InstitutionalUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: InstitutionalRole
  wilayaCode?: number         // Obligatoire pour wilaya_admin, local_coordinator, mission_lead
  commune?: string            // Obligatoire pour local_coordinator, optionnel pour mission_lead
  daira?: string
  structure: string           // e.g. "Ministère de la Jeunesse et des Sports", "DJS Béjaïa", "ODEJ"
  assignedOperationIds?: string[] // Pour mission_lead (missions sous sa responsabilité directe)
  status: InstitutionalUserStatus
  mfaEnabled: boolean
  createdBy?: string          // ID de l'administrateur ayant créé/affecté le compte (chaîne hiérarchique)
  createdByName?: string      // Nom de l'administrateur créateur
  createdByRole?: InstitutionalRole // Rôle du créateur
  invitationToken?: string    // Jeton d'invitation sécurisé
  invitationSentAt?: string   // Date d'envoi de l'invitation
  invitationExpiresAt?: string // Expiration de l'invitation
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/**
 * Cycle standardisé de validation des opérations (Section 3 du protocole)
 */
export type OperationWorkflowStatus =
  | "draft"         // 1. DRAFT — Brouillon
  | "submitted"     // 2. SUBMITTED — Soumise
  | "under_review"  // 3. UNDER_REVIEW — En cours de vérification
  | "approved"      // 4. APPROVED — Validée
  | "published"     // 5. PUBLISHED — Publiée
  | "in_progress"   // 6. IN_PROGRESS — En cours d'exécution
  | "completed"     // 7. COMPLETED — Réalisée
  | "closed"        // 8. CLOSED — Clôturée
  // Statuts d'exception :
  | "rejected"      // REJECTED — Refusée
  | "suspended"     // SUSPENDED — Suspendue
  | "cancelled"     // CANCELLED — Annulée

export type OperationCategory =
  | "humanitarian_sos"
  | "solidarity_convoi"
  | "youth_empowerment"
  | "environmental_protection"
  | "health_medical"
  | "sports_civic"
  | "infrastructure_renovation"

export type OperationRiskLevel = "standard" | "elevated" | "high" | "critical_emergency"

export type OperationValidationLevel = "local" | "wilaya" | "national"

export type VerificationStage = "declared" | "verified" | "validated" | "consolidated"

/**
 * Attestation Numérique Interne (Section 4 du protocole)
 * Produite à chaque jalon critique avec empreinte cryptographique SHA-256
 */
export interface DigitalAttestation {
  id: string                  // e.g. "ATT-20261104-ABC123"
  operationId: string         // Référence UUID
  operationReference: string  // Référence normalisée (ex: "OP-2026-06-001")
  actionType:
    | "submission"
    | "verification"
    | "approval"
    | "publication"
    | "completion"
    | "closure"
    | "suspension"
    | "rejection"
    | "emergency_override"
  actorId: string             // Identifiant du compte du signataire
  actorName: string           // Nom et prénom
  actorRole: InstitutionalRole
  structure: string           // Structure représentée (ex: "DJS Béjaïa")
  wilayaCode: number
  commune?: string
  timestamp: string           // ISO 8601
  justification: string       // Commentaire ou justification obligatoire
  documentHash: string        // Empreinte SHA-256 de la charge utile de l'opération
  previousAttestationHash?: string // Chaînage cryptographique
  qrPayload: string           // Jeton de vérification interne sur la plateforme
}

/**
 * Opération Institutionnelle
 */
export interface InstitutionalOperation {
  id: string
  reference: string           // Normalisée (ex: "YFY-OP-2026-06-001")
  title: string
  description: string
  category: OperationCategory
  riskLevel: OperationRiskLevel
  requiredValidationLevel: OperationValidationLevel
  wilayaCode: number
  commune: string
  address?: string
  startDate: string
  endDate?: string
  status: OperationWorkflowStatus
  isUrgent?: boolean
  urgentJustification?: string
  createdById: string
  createdByName: string
  assignedLeadId?: string     // Identifiant du Responsable de Mission
  assignedLeadName?: string
  participatingAssociations?: string[]
  budgetDZD?: number
  kpis: {
    volunteersNeeded: number
    volunteersMobilized: number
    beneficiariesCount?: number
    materialsDistributed?: number
  }
  verificationStage: VerificationStage
  attestations: DigitalAttestation[]
  history: {
    id: string
    fromStatus: OperationWorkflowStatus
    toStatus: OperationWorkflowStatus
    changedAt: string
    actorId: string
    actorName: string
    actorRole: InstitutionalRole
    reason: string
  }[]
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

/**
 * Entrée du Registre Central de Traçabilité (« Registre des activités et des décisions » - Section 5)
 */
export interface AuditRegistryEntry {
  id: string                  // UUID
  sequenceNumber: number      // Séquence incrémentale stricte (1, 2, 3...)
  timestamp: string           // ISO 8601
  actorId: string
  actorName: string
  actorRole: InstitutionalRole
  wilayaCode?: number
  action:
    | "operation_create"
    | "operation_update"
    | "operation_transition"
    | "operation_suspend"
    | "operation_cancel"
    | "operation_close"
    | "attestation_generated"
    | "points_adjusted"
    | "volunteer_account_status"
    | "admin_user_create"
    | "admin_user_invite"
    | "admin_user_activate"
    | "admin_user_update"
    | "admin_user_territory_change"
    | "admin_user_suspend"
    | "admin_user_reactivate"
    | "admin_user_revoke"
    | "role_assigned"
    | "password_reset_request"
    | "report_exported"
    | "emergency_override"
  resourceType: "operation" | "user" | "volunteer_account" | "points" | "report" | "system"
  resourceId: string
  resourceReference?: string
  previousState?: Record<string, unknown>
  newState?: Record<string, unknown>
  justification?: string
  metadata?: {
    ipAddress?: string
    isEmergency?: boolean
    userAgent?: string
  }
  previousEntryHash: string   // Chaîne de hachage Merkle / Blockchain
  entryHash: string           // SHA-256(id + sequenceNumber + timestamp + actorId + action + resourceId + previousEntryHash)
  isDemo?: boolean
}

/**
 * Résumé des indicateurs nationaux institutionnels (Section 9)
 */
export interface InstitutionalKpis {
  totalOperations: number
  byStatus: Record<OperationWorkflowStatus, number>
  byStage: {
    declared: number          // Données déclarées
    verified: number          // Données vérifiées
    validated: number         // Données validées
    consolidated: number      // Données consolidées
  }
  totalVolunteersMobilized: number
  totalBeneficiariesReached: number
  wilayaBreakdown: Record<number, {
    wilayaCode: number
    wilayaName: string
    totalOps: number
    activeOps: number
    volunteersCount: number
  }>
}

export interface AccountAnomaly {
  id: string
  userId: string
  userEmail: string
  type:
    | "missing_wilaya"
    | "missing_commune"
    | "creator_mismatch"
    | "orphan_account"
    | "unauthorized_role"
    | "self_escalation"
  severity: "critical" | "warning" | "info"
  description: string
  detectedAt: string
}


