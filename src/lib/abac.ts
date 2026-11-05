/**
 * ============================================================================
 * MOTEUR D'AUTORISATION RBAC + ABAC — YED FEL YED (يد في يد)
 * Contrôle d'accès basé sur les Rôles et sur les Attributs Territoriaux.
 * ============================================================================
 */

import type {
  InstitutionalRole,
  InstitutionalUser,
  InstitutionalOperation,
  OperationWorkflowStatus,
  AuditRegistryEntry,
  AccountAnomaly,
} from "./governanceTypes"

/**
 * Matrice des privilèges de base par rôle (RBAC)
 */
export const ROLE_CAPABILITIES: Record<
  InstitutionalRole,
  {
    labelFr: string
    labelAr: string
    level: number
    canViewNationalData: boolean
    canManageWilayaAdmins: boolean
    canManageLocalCoordinators: boolean
    canManageMissionLeads: boolean
    canApproveLocalOperations: boolean
    canApproveWilayaOperations: boolean
    canApproveNationalOperations: boolean
    canExecuteEmergencyFastTrack: boolean
    canAdjustVolunteerPoints: boolean
    canManageInstitutionalSettings: boolean
    isReadOnlyAudit: boolean
  }
> = {
  national_admin: {
    labelFr: "Administrateur National",
    labelAr: "المشرف الوطني",
    level: 1,
    canViewNationalData: true,
    canManageWilayaAdmins: true,
    canManageLocalCoordinators: true,
    canManageMissionLeads: true,
    canApproveLocalOperations: true,
    canApproveWilayaOperations: true,
    canApproveNationalOperations: true,
    canExecuteEmergencyFastTrack: true,
    canAdjustVolunteerPoints: true,
    canManageInstitutionalSettings: true,
    isReadOnlyAudit: false,
  },
  wilaya_admin: {
    labelFr: "Administrateur de Wilaya",
    labelAr: "مشرف الولاية",
    level: 2,
    canViewNationalData: false,
    canManageWilayaAdmins: false,
    canManageLocalCoordinators: true,
    canManageMissionLeads: true,
    canApproveLocalOperations: true,
    canApproveWilayaOperations: true,
    canApproveNationalOperations: false,
    canExecuteEmergencyFastTrack: true, // Dans le périmètre de sa wilaya
    canAdjustVolunteerPoints: true,
    canManageInstitutionalSettings: false,
    isReadOnlyAudit: false,
  },
  local_coordinator: {
    labelFr: "Coordinateur Local",
    labelAr: "المنسق المحلي",
    level: 3,
    canViewNationalData: false,
    canManageWilayaAdmins: false,
    canManageLocalCoordinators: false,
    canManageMissionLeads: true,
    canApproveLocalOperations: true,
    canApproveWilayaOperations: false,
    canApproveNationalOperations: false,
    canExecuteEmergencyFastTrack: false,
    canAdjustVolunteerPoints: false,
    canManageInstitutionalSettings: false,
    isReadOnlyAudit: false,
  },
  mission_lead: {
    labelFr: "Responsable de Mission",
    labelAr: "مسؤول المهمة",
    level: 4,
    canViewNationalData: false,
    canManageWilayaAdmins: false,
    canManageLocalCoordinators: false,
    canManageMissionLeads: false,
    canApproveLocalOperations: false,
    canApproveWilayaOperations: false,
    canApproveNationalOperations: false,
    canExecuteEmergencyFastTrack: false,
    canAdjustVolunteerPoints: false,
    canManageInstitutionalSettings: false,
    isReadOnlyAudit: false,
  },
  national_auditor: {
    labelFr: "Auditeur National",
    labelAr: "المدقق الوطني",
    level: 0,
    canViewNationalData: true,
    canManageWilayaAdmins: false,
    canManageLocalCoordinators: false,
    canManageMissionLeads: false,
    canApproveLocalOperations: false,
    canApproveWilayaOperations: false,
    canApproveNationalOperations: false,
    canExecuteEmergencyFastTrack: false,
    canAdjustVolunteerPoints: false,
    canManageInstitutionalSettings: false,
    isReadOnlyAudit: true, // Contrôle strict : AUCUNE écriture
  },
}

/**
 * ABAC 1 : Vérification d'accès territorial par Wilaya
 */
export function canAccessWilaya(
  user: InstitutionalUser | null,
  targetWilayaCode: number
): boolean {
  if (!user || user.status !== "active") return false
  if (user.role === "national_admin" || user.role === "national_auditor") return true
  return user.wilayaCode === targetWilayaCode
}

/**
 * ABAC 2 : Vérification d'accès territorial par Commune
 */
export function canAccessCommune(
  user: InstitutionalUser | null,
  targetWilayaCode: number,
  targetCommune: string
): boolean {
  if (!user || user.status !== "active") return false
  if (user.role === "national_admin" || user.role === "national_auditor") return true
  if (user.wilayaCode !== targetWilayaCode) return false
  if (user.role === "wilaya_admin") return true // L'admin de wilaya couvre toutes ses communes
  if (user.role === "local_coordinator") {
    return !user.commune || user.commune.toLowerCase().trim() === targetCommune.toLowerCase().trim()
  }
  return false
}

/**
 * ABAC 3 : Vérification de consultation d'une opération
 */
export function canViewOperation(
  user: InstitutionalUser | null,
  operation: InstitutionalOperation
): boolean {
  if (!user || user.status !== "active") return false
  if (user.role === "national_admin" || user.role === "national_auditor") return true

  // Restriction Wilaya
  if (user.wilayaCode !== operation.wilayaCode) return false

  // Coordinateur local
  if (user.role === "local_coordinator") {
    if (user.commune && user.commune.toLowerCase().trim() !== operation.commune.toLowerCase().trim()) {
      return false
    }
    return true
  }

  // Responsable de mission : doit être expressément assigné à l'opération
  if (user.role === "mission_lead") {
    if (operation.assignedLeadId === user.id) return true
    if (user.assignedOperationIds && user.assignedOperationIds.includes(operation.id)) return true
    return false
  }

  return user.role === "wilaya_admin"
}

/**
 * ABAC 4 : Vérification de transition d'état d'une opération
 */
export function canTransitionOperation(
  user: InstitutionalUser | null,
  operation: InstitutionalOperation,
  targetStatus: OperationWorkflowStatus,
  options?: { isEmergency?: boolean; justification?: string }
): { allowed: boolean; reason?: string } {
  if (!user) return { allowed: false, reason: "Utilisateur non authentifié." }
  if (user.status !== "active") return { allowed: false, reason: "Compte administratif inactif ou suspendu." }

  // 1. L'auditeur ne peut STRICTEMENT RIEN modifier
  if (user.role === "national_auditor") {
    return {
      allowed: false,
      reason: "Rôle Auditeur National : consultation uniquement. Aucune modification autorisée.",
    }
  }

  // 2. Vérification territoriale
  if (user.role !== "national_admin") {
    if (user.wilayaCode !== operation.wilayaCode) {
      return {
        allowed: false,
        reason: `Accès refusé : opération située hors de votre wilaya d'affectation (${operation.wilayaCode} != ${user.wilayaCode}).`,
      }
    }
    if (
      user.role === "local_coordinator" &&
      user.commune &&
      user.commune.toLowerCase().trim() !== operation.commune.toLowerCase().trim()
    ) {
      return {
        allowed: false,
        reason: `Accès refusé : opération située hors de votre commune (${operation.commune} != ${user.commune}).`,
      }
    }
    if (
      user.role === "mission_lead" &&
      operation.assignedLeadId !== user.id &&
      (!user.assignedOperationIds || !user.assignedOperationIds.includes(operation.id))
    ) {
      return {
        allowed: false,
        reason: "Accès refusé : cette opération ne vous est pas assignée.",
      }
    }
  }

  // 3. Séparation des responsabilités (Separation of Duties)
  // Un créateur ne peut pas auto-valider (APPROVED) son opération si elle requiert une validation hiérarchique
  if (
    targetStatus === "approved" &&
    operation.createdById === user.id &&
    operation.requiredValidationLevel !== "local" &&
    user.role !== "national_admin"
  ) {
    return {
      allowed: false,
      reason: "Séparation des responsabilités : vous ne pouvez pas approuver votre propre opération.",
    }
  }

  // 4. Circuit accéléré d'urgence (Emergency Fast-Track)
  if (options?.isEmergency || operation.isUrgent) {
    if (targetStatus === "published") {
      if (user.role === "national_admin" || user.role === "wilaya_admin") {
        if (!options?.justification || options.justification.trim().length < 8) {
          return {
            allowed: false,
            reason: "Le circuit accéléré d'urgence exige une justification formelle d'au moins 8 caractères.",
          }
        }
        return { allowed: true }
      } else {
        return {
          allowed: false,
          reason: "Seuls l'Administrateur National ou l'Administrateur de Wilaya peuvent ordonner une publication accélérée d'urgence.",
        }
      }
    }
  }

  // 5. Matrice du circuit régulier selon l'état actuel et la cible
  const current = operation.status

  // DRAFT -> SUBMITTED (Créateur, Coordinateur, Mission Lead)
  if (current === "draft" && targetStatus === "submitted") {
    return { allowed: true }
  }

  // SUBMITTED -> UNDER_REVIEW (Coordinateur ou Admin Wilaya)
  if (current === "submitted" && targetStatus === "under_review") {
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "Seul un coordinateur ou un administrateur peut mettre en vérification." }
    }
    return { allowed: true }
  }

  // UNDER_REVIEW / SUBMITTED -> APPROVED (Validation hiérarchique)
  if ((current === "under_review" || current === "submitted") && targetStatus === "approved") {
    if (operation.requiredValidationLevel === "national" && user.role !== "national_admin") {
      return { allowed: false, reason: "Cette opération à impact national requiert l'approbation de l'Administrateur National." }
    }
    if (operation.requiredValidationLevel === "wilaya" && user.role === "local_coordinator") {
      return { allowed: false, reason: "Cette opération requiert la validation de l'Administrateur de Wilaya." }
    }
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "Un responsable de mission ne peut pas valider une opération." }
    }
    return { allowed: true }
  }

  // UNDER_REVIEW / SUBMITTED -> REJECTED
  if ((current === "under_review" || current === "submitted") && targetStatus === "rejected") {
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "Rôle non habilité à rejeter une opération." }
    }
    return { allowed: true }
  }

  // APPROVED -> PUBLISHED
  if (current === "approved" && targetStatus === "published") {
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "Un responsable de mission ne peut pas publier sur le portail." }
    }
    return { allowed: true }
  }

  // PUBLISHED / APPROVED -> IN_PROGRESS
  if ((current === "published" || current === "approved") && targetStatus === "in_progress") {
    return { allowed: true } // Responsable de mission peut lancer le terrain
  }

  // IN_PROGRESS -> COMPLETED (Réalisée)
  if (current === "in_progress" && targetStatus === "completed") {
    return { allowed: true } // Responsable de mission soumet son rapport
  }

  // COMPLETED -> CLOSED (Clôture institutionnelle définitive)
  if (current === "completed" && targetStatus === "closed") {
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "La clôture institutionnelle doit être prononcée par le coordinateur ou l'administrateur." }
    }
    return { allowed: true }
  }

  // N'importe quel état actif -> SUSPENDED (Mesure de précaution justifiée)
  if (["approved", "published", "in_progress"].includes(current) && targetStatus === "suspended") {
    if (!options?.justification || options.justification.trim().length < 5) {
      return { allowed: false, reason: "La suspension d'une opération requiert un motif explicatif obligatoire." }
    }
    return { allowed: true }
  }

  // SUSPENDED -> IN_PROGRESS (Levée de suspension)
  if (current === "suspended" && targetStatus === "in_progress") {
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "La reprise d'une opération suspendue requiert la décision d'un administrateur ou d'un coordinateur." }
    }
    return { allowed: true }
  }

  // CANCELLED
  if (targetStatus === "cancelled") {
    if (user.role === "mission_lead") {
      return { allowed: false, reason: "Seul un coordinateur ou un administrateur peut annuler formellement une opération." }
    }
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Transition non autorisée du statut "${current}" vers "${targetStatus}".`,
  }
}

/**
 * ABAC 5 : Gestion des utilisateurs administratifs (Création, modification, révocation)
 */

export function canCreateInstitutionalUser(
  actor: InstitutionalUser | null,
  targetRole: InstitutionalRole,
  targetWilayaCode?: number
): { allowed: boolean; reason?: string } {
  if (!actor) {
    return { allowed: false, reason: "Accès refusé : utilisateur non authentifié." }
  }
  if (actor.status !== "active") {
    return { allowed: false, reason: "Compte suspendu : aucune opération administrative n'est autorisée." }
  }

  // 1. Visiteur ou Rôle non autorisé
  if (actor.role === "local_coordinator") {
    return { allowed: false, reason: "Un coordinateur local ne peut créer aucun compte administratif." }
  }
  if (actor.role === "national_auditor") {
    return { allowed: false, reason: "L'auditeur national possède des permissions en lecture seule stricte." }
  }

  // 2. Administrateur de Wilaya
  if (actor.role === "wilaya_admin") {
    if (targetRole === "national_admin") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut pas créer d'administrateur national." }
    }
    if (targetRole === "national_auditor") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut pas créer d'auditeur national." }
    }
    if (targetRole === "wilaya_admin") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut pas créer un autre administrateur de wilaya." }
    }
    if (targetWilayaCode !== actor.wilayaCode) {
      return {
        allowed: false,
        reason: `Confinement territorial : un administrateur de wilaya (${actor.wilayaCode}) ne peut affecter de coordinateur que dans sa propre wilaya.`,
      }
    }
    return { allowed: true }
  }

  // 3. Administrateur National
  if (actor.role === "national_admin") {
    if (targetRole === "wilaya_admin") {
      if (!targetWilayaCode || targetWilayaCode < 1 || targetWilayaCode > 69) {
        return { allowed: false, reason: "Un administrateur de wilaya doit être affecté à un code wilaya valide (1 à 69)." }
      }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: "Action non autorisée pour votre profil." }
}

export function canUpdateInstitutionalUser(
  actor: InstitutionalUser | null,
  targetUser: InstitutionalUser,
  updates?: { role?: InstitutionalRole; wilayaCode?: number; commune?: string }
): { allowed: boolean; reason?: string } {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Compte inactif ou privilèges insuffisants." }
  }

  // Auto-élévation de privilèges interdite
  if (actor.id === targetUser.id) {
    if (updates?.role && updates.role !== targetUser.role) {
      return { allowed: false, reason: "Auto-élévation de privilèges strictement interdite." }
    }
    if (updates?.wilayaCode && updates.wilayaCode !== targetUser.wilayaCode) {
      return { allowed: false, reason: "Auto-modification de wilaya d'affectation interdite." }
    }
  }

  if (actor.role === "national_auditor" || actor.role === "local_coordinator") {
    return { allowed: false, reason: "Permissions insuffisantes pour modifier un compte." }
  }

  if (actor.role === "wilaya_admin") {
    if (targetUser.role !== "local_coordinator" && targetUser.role !== "mission_lead") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut modifier que les coordinateurs de son territoire." }
    }
    if (targetUser.wilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: "Ce coordinateur est rattaché à une autre wilaya." }
    }
    if (updates?.wilayaCode && updates.wilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: "Impossible de transférer un coordinateur hors de votre wilaya." }
    }
    if (updates?.role && updates.role !== targetUser.role) {
      return { allowed: false, reason: "Seul l'administrateur national peut modifier les rôles hiérarchiques." }
    }
    return { allowed: true }
  }

  if (actor.role === "national_admin") {
    return { allowed: true }
  }

  return { allowed: false, reason: "Opération non autorisée." }
}

export function canChangeInstitutionalUserStatus(
  actor: InstitutionalUser | null,
  targetUser: InstitutionalUser,
  newStatus: string
): { allowed: boolean; reason?: string } {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Compte inactif ou suspendu." }
  }

  if (actor.role === "national_auditor" || actor.role === "local_coordinator") {
    return { allowed: false, reason: "Rôle non habilité à modifier le statut d'un compte." }
  }

  // Ne pas se suspendre soi-même sans administrateur national actif de secours
  if (actor.id === targetUser.id && (newStatus === "suspended" || newStatus === "deactivated")) {
    return { allowed: false, reason: "Un administrateur ne peut pas suspendre ou révoquer son propre compte." }
  }

  if (actor.role === "wilaya_admin") {
    if (targetUser.role !== "local_coordinator" && targetUser.role !== "mission_lead") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut suspendre que les coordinateurs de son territoire." }
    }
    if (targetUser.wilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: "Ce compte n'est pas sous votre juridiction territoriale." }
    }
    return { allowed: true }
  }

  if (actor.role === "national_admin") {
    return { allowed: true }
  }

  return { allowed: false, reason: "Action non autorisée." }
}

export function canManageInstitutionalUser(
  actor: InstitutionalUser | null,
  targetUserRole: InstitutionalRole,
  targetUserWilaya?: number
): boolean {
  return canCreateInstitutionalUser(actor, targetUserRole, targetUserWilaya).allowed
}

/**
 * Détection automatique des anomalies sur les comptes administratifs (Audit & Conformité)
 */
export function detectAccountAnomalies(allUsers: InstitutionalUser[]): AccountAnomaly[] {
  const anomalies: AccountAnomaly[] = []
  const userMap = new Map(allUsers.map((u) => [u.id, u]))

  for (const user of allUsers) {
    const stamp = user.updatedAt || user.createdAt

    // 1. Wilaya admin sans code wilaya
    if (user.role === "wilaya_admin" && (!user.wilayaCode || user.wilayaCode < 1 || user.wilayaCode > 69)) {
      anomalies.push({
        id: `anom-${user.id}-wilaya`,
        userId: user.id,
        userEmail: user.email,
        type: "missing_wilaya",
        severity: "critical",
        description: `L'administrateur de wilaya ${user.firstName} ${user.lastName} n'est associé à aucun code wilaya valide (1–69).`,
        detectedAt: stamp,
      })
    }

    // 2. Coordinateur local sans commune ou sans wilaya
    if (user.role === "local_coordinator") {
      if (!user.wilayaCode) {
        anomalies.push({
          id: `anom-${user.id}-wilaya-coord`,
          userId: user.id,
          userEmail: user.email,
          type: "missing_wilaya",
          severity: "critical",
          description: `Le coordinateur ${user.firstName} ${user.lastName} n'a aucune wilaya de rattachement.`,
          detectedAt: stamp,
        })
      }
      if (!user.commune || !user.commune.trim()) {
        anomalies.push({
          id: `anom-${user.id}-commune`,
          userId: user.id,
          userEmail: user.email,
          type: "missing_commune",
          severity: "warning",
          description: `Le coordinateur ${user.firstName} ${user.lastName} n'a aucune commune assignée.`,
          detectedAt: stamp,
        })
      }
    }

    // 3. Parentage / Créateur incohérent
    if (user.createdBy && userMap.has(user.createdBy)) {
      const creator = userMap.get(user.createdBy)!
      if (user.role === "local_coordinator" && creator.role === "wilaya_admin") {
        if (creator.wilayaCode !== user.wilayaCode) {
          anomalies.push({
            id: `anom-${user.id}-cross-wilaya`,
            userId: user.id,
            userEmail: user.email,
            type: "creator_mismatch",
            severity: "critical",
            description: `Le coordinateur (Wilaya ${user.wilayaCode}) a été créé par un admin de wilaya non concordante (Wilaya ${creator.wilayaCode}).`,
            detectedAt: stamp,
          })
        }
      }
      if (creator.role === "local_coordinator") {
        anomalies.push({
          id: `anom-${user.id}-coord-creator`,
          userId: user.id,
          userEmail: user.email,
          type: "unauthorized_role",
          severity: "critical",
          description: `Ce compte a été créé par un coordinateur local (${creator.email}), ce qui est formellement interdit par le protocole hiérarchique.`,
          detectedAt: stamp,
        })
      }
      if (user.role === "national_auditor" && creator.role !== "national_admin") {
        anomalies.push({
          id: `anom-${user.id}-auditor-creator`,
          userId: user.id,
          userEmail: user.email,
          type: "unauthorized_role",
          severity: "critical",
          description: `L'auditeur national (${user.email}) doit être exclusivement nommé par un administrateur national.`,
          detectedAt: stamp,
        })
      }
    } else if (user.role !== "national_admin" && !user.createdBy) {
      anomalies.push({
        id: `anom-${user.id}-orphan`,
        userId: user.id,
        userEmail: user.email,
        type: "orphan_account",
        severity: "warning",
        description: `Compte sans filiation administrative traçable (aucun créateur identifié).`,
        detectedAt: stamp,
      })
    }
  }

  return anomalies
}

/**
 * Filtre les opérations selon les attributs de l'utilisateur actif
 */
export function filterOperationsForUser(
  user: InstitutionalUser | null,
  operations: InstitutionalOperation[]
): InstitutionalOperation[] {
  if (!user || user.status !== "active") return []
  return operations.filter((op) => canViewOperation(user, op))
}

/**
 * Filtre les logs d'audit selon le périmètre de l'utilisateur
 */
export function filterAuditLogsForUser(
  user: InstitutionalUser | null,
  logs: AuditRegistryEntry[]
): AuditRegistryEntry[] {
  if (!user || user.status !== "active") return []
  if (user.role === "national_admin" || user.role === "national_auditor") return logs
  if (user.role === "wilaya_admin") {
    return logs.filter((l) => !l.wilayaCode || l.wilayaCode === user.wilayaCode)
  }
  return logs.filter((l) => l.actorId === user.id)
}

/**
 * ABAC 6 : Validation de présence sur le terrain d'un volontaire
 */
export function canValidateVolunteerPresence(
  actor: InstitutionalUser | null,
  targetWilayaCode?: number,
  targetCommune?: string
): { allowed: boolean; reason?: string } {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Accès refusé : compte inactif ou non authentifié." }
  }
  if (actor.role === "national_auditor") {
    return { allowed: false, reason: "Rôle Auditeur National : consultation uniquement. Aucune validation de présence autorisée." }
  }
  if (actor.role === "national_admin") {
    return { allowed: true }
  }
  if (actor.role === "wilaya_admin") {
    if (targetWilayaCode && targetWilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: `Confinement territorial : un administrateur de wilaya (${actor.wilayaCode}) ne peut valider que dans sa propre wilaya.` }
    }
    return { allowed: true }
  }
  if (actor.role === "local_coordinator") {
    if (targetWilayaCode && targetWilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: `Confinement territorial : un coordinateur ne peut valider que dans sa wilaya d'affectation (${actor.wilayaCode}).` }
    }
    if (targetCommune && actor.commune && targetCommune.toLowerCase().trim() !== actor.commune.toLowerCase().trim()) {
      return { allowed: false, reason: `Périmètre communal non concordant (${targetCommune} != ${actor.commune}).` }
    }
    return { allowed: true }
  }
  if (actor.role === "mission_lead") {
    return { allowed: true }
  }
  return { allowed: false, reason: "Profil non habilité à valider des présences." }
}

/**
 * ABAC 7 : Correction / Ajustement manuel du solde de points d'un volontaire
 */
export function canAdjustVolunteerPointsManually(
  actor: InstitutionalUser | null,
  targetVolunteerWilayaCode?: number,
  justification?: string
): { allowed: boolean; reason?: string } {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Accès refusé : compte inactif ou non authentifié." }
  }
  if (actor.role === "national_auditor") {
    return { allowed: false, reason: "Rôle Auditeur National : consultation uniquement. Aucune modification de solde autorisée." }
  }
  if (actor.role === "local_coordinator" || actor.role === "mission_lead") {
    return { allowed: false, reason: "Un coordinateur local ne peut pas modifier librement les soldes de points. Utilisez la validation de présence officielle." }
  }
  if (!justification || justification.trim().length < 5) {
    return { allowed: false, reason: "Une justification administrative obligatoire (minimum 5 caractères) est requise pour toute correction manuelle." }
  }
  if (actor.role === "wilaya_admin") {
    if (targetVolunteerWilayaCode && targetVolunteerWilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: `Confinement territorial : impossible de modifier les points d'un bénévole rattaché à une autre wilaya (${targetVolunteerWilayaCode} != ${actor.wilayaCode}).` }
    }
    return { allowed: true }
  }
  if (actor.role === "national_admin") {
    return { allowed: true }
  }
  return { allowed: false, reason: "Opération non autorisée." }
}


