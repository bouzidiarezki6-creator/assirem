/**
 * ============================================================================
 * CONTEXTE DE GOUVERNANCE ET DE TRAÇABILITÉ INSTITUTIONNELLE — YED FEL YED
 * Gestion de session institutionnelle, ABAC, circuit de validation,
 * émission d'attestations et registre central cryptographique.
 * ============================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAppData } from "@/context/DataProvider"
import {
  canAccessWilaya,
  canAccessCommune,
  canViewOperation,
  canTransitionOperation,
  canManageInstitutionalUser,
  canCreateInstitutionalUser,
  canUpdateInstitutionalUser,
  canChangeInstitutionalUserStatus,
  detectAccountAnomalies,
  filterOperationsForUser,
  filterAuditLogsForUser,
} from "@/lib/abac"
import {
  calculateAuditEntryHash,
  calculateDocumentHash,
  generateAttestationId,
  generateAttestationQrPayload,
  verifyAuditChainIntegrity,
} from "@/lib/cryptoAudit"
import type {
  InstitutionalUser,
  InstitutionalUserStatus,
  InstitutionalOperation,
  OperationWorkflowStatus,
  DigitalAttestation,
  AuditRegistryEntry,
  InstitutionalKpis,
  AccountAnomaly,
} from "@/lib/governanceTypes"
import { INITIAL_INSTITUTIONAL_USERS } from "@/lib/governanceSeed"
import { ALGERIA_WILAYAS } from "@/lib/wilayas"

const SESSION_USER_KEY = "yfy-active-institutional-user-id"

interface GovernanceContextValue {
  currentUser: InstitutionalUser
  allUsers: InstitutionalUser[]
  switchUser: (userId: string) => void
  operations: InstitutionalOperation[]
  allOperations: InstitutionalOperation[]
  auditEntries: AuditRegistryEntry[]
  allAuditEntries: AuditRegistryEntry[]
  kpis: InstitutionalKpis

  // Permissions helpers
  canAccessWilaya: (wilayaCode: number) => boolean
  canAccessCommune: (wilayaCode: number, commune: string) => boolean
  canViewOperation: (op: InstitutionalOperation) => boolean

  // Operation Actions
  createOperation: (
    data: Omit<
      InstitutionalOperation,
      "id" | "reference" | "createdById" | "createdByName" | "attestations" | "history" | "createdAt" | "updatedAt"
    >
  ) => { ok: true; operation: InstitutionalOperation } | { ok: false; error: string }

  transitionOperationStatus: (
    operationId: string,
    targetStatus: OperationWorkflowStatus,
    justification: string,
    options?: { isEmergency?: boolean }
  ) => { ok: true; operation: InstitutionalOperation; attestation?: DigitalAttestation } | { ok: false; error: string }

  // Digital Attestations
  getOperationAttestations: (operationId: string) => DigitalAttestation[]

  // Audit Registry
  verifyAuditIntegrity: () => { valid: boolean; totalChecked: number; brokenAtIndex?: number; error?: string }

  // Admin User Management
  addInstitutionalUser: (
    user: Omit<InstitutionalUser, "id" | "createdAt" | "updatedAt">
  ) => { ok: true; user: InstitutionalUser } | { ok: false; error: string }

  updateInstitutionalUser: (
    user: InstitutionalUser
  ) => { ok: true; user: InstitutionalUser } | { ok: false; error: string }

  setInstitutionalUserStatus: (
    userId: string,
    status: InstitutionalUserStatus,
    justification: string
  ) => { ok: true } | { ok: false; error: string }

  sendUserInvitation: (
    userId: string
  ) => { ok: true; token: string; link: string } | { ok: false; error: string }

  accountAnomalies: AccountAnomaly[]

  transferUserOperations: (
    fromUserId: string,
    toUserId: string,
    justification: string
  ) => { ok: true; transferredCount: number } | { ok: false; error: string }
}

const GovernanceContext = createContext<GovernanceContextValue | null>(null)

export function GovernanceProvider({ children }: { children: ReactNode }) {
  const { data, updateAppData } = useAppData()

  const allUsers = useMemo(() => {
    return (data.institutionalUsers && data.institutionalUsers.length > 0)
      ? data.institutionalUsers
      : INITIAL_INSTITUTIONAL_USERS
  }, [data.institutionalUsers])

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_USER_KEY)
      if (stored && allUsers.some((u) => u.id === stored)) return stored
    } catch {
      // ignore
    }
    return allUsers[0]?.id || "user-nat-01"
  })

  const currentUser = useMemo(() => {
    return allUsers.find((u) => u.id === activeUserId) || allUsers[0]
  }, [allUsers, activeUserId])

  const switchUser = useCallback((userId: string) => {
    setActiveUserId(userId)
    try {
      sessionStorage.setItem(SESSION_USER_KEY, userId)
    } catch {
      // ignore
    }
  }, [])

  const allOperations = useMemo(() => {
    return data.institutionalOperations || []
  }, [data.institutionalOperations])

  const operations = useMemo(() => {
    return filterOperationsForUser(currentUser, allOperations)
  }, [currentUser, allOperations])

  const allAuditEntries = useMemo(() => {
    return data.auditRegistry || []
  }, [data.auditRegistry])

  const auditEntries = useMemo(() => {
    return filterAuditLogsForUser(currentUser, allAuditEntries)
  }, [currentUser, allAuditEntries])

  // =========================================================================
  // CALCUL DES KPIS NATIONAUX (Déclarées, Vérifiées, Validées, Consolidées)
  // =========================================================================
  const kpis = useMemo<InstitutionalKpis>(() => {
    const byStatus: Record<OperationWorkflowStatus, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      published: 0,
      in_progress: 0,
      completed: 0,
      closed: 0,
      rejected: 0,
      suspended: 0,
      cancelled: 0,
    }

    const byStage = {
      declared: 0,
      verified: 0,
      validated: 0,
      consolidated: 0,
    }

    let totalVolunteers = 0
    let totalBeneficiaries = 0
    const wilayaMap: Record<number, { wilayaCode: number; wilayaName: string; totalOps: number; activeOps: number; volunteersCount: number }> = {}

    // Initialiser les 69 wilayas
    ALGERIA_WILAYAS.forEach((w) => {
      wilayaMap[w.code] = {
        wilayaCode: w.code,
        wilayaName: w.name,
        totalOps: 0,
        activeOps: 0,
        volunteersCount: 0,
      }
    })

    allOperations.forEach((op) => {
      if (byStatus[op.status] !== undefined) {
        byStatus[op.status]++
      }
      if (byStage[op.verificationStage] !== undefined) {
        byStage[op.verificationStage]++
      }
      totalVolunteers += op.kpis.volunteersMobilized || 0
      totalBeneficiaries += op.kpis.beneficiariesCount || 0

      if (wilayaMap[op.wilayaCode]) {
        wilayaMap[op.wilayaCode].totalOps++
        if (["approved", "published", "in_progress"].includes(op.status)) {
          wilayaMap[op.wilayaCode].activeOps++
        }
        wilayaMap[op.wilayaCode].volunteersCount += op.kpis.volunteersMobilized || 0
      }
    })

    return {
      totalOperations: allOperations.length,
      byStatus,
      byStage,
      totalVolunteersMobilized: totalVolunteers,
      totalBeneficiariesReached: totalBeneficiaries,
      wilayaBreakdown: wilayaMap,
    }
  }, [allOperations])

  // =========================================================================
  // FONCTION DE JOURNALISATION D'AUDIT SÉCURISÉE AVEC CHAÎNE CRYPTOGRAPHIQUE
  // =========================================================================
  const logAudit = useCallback(
    (
      action: AuditRegistryEntry["action"],
      resourceType: AuditRegistryEntry["resourceType"],
      resourceId: string,
      resourceReference: string,
      options: {
        previousState?: Record<string, unknown>
        newState?: Record<string, unknown>
        justification?: string
        isEmergency?: boolean
      }
    ): AuditRegistryEntry => {
      const currentChain = data.auditRegistry || []
      const sequenceNumber = currentChain.length > 0 ? currentChain[currentChain.length - 1].sequenceNumber + 1 : 1
      const previousEntryHash = currentChain.length > 0
        ? currentChain[currentChain.length - 1].entryHash
        : "0000000000000000000000000000000000000000000000000000000000000000"

      const id = "audit-" + crypto.randomUUID()
      const timestamp = new Date().toISOString()

      const rawEntry = {
        id,
        sequenceNumber,
        timestamp,
        actorId: currentUser.id,
        actorName: `${currentUser.firstName} ${currentUser.lastName}`,
        actorRole: currentUser.role,
        wilayaCode: currentUser.wilayaCode,
        action,
        resourceType,
        resourceId,
        resourceReference,
        previousState: options.previousState,
        newState: options.newState,
        justification: options.justification,
        metadata: {
          ipAddress: "127.0.0.1",
          isEmergency: options.isEmergency,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Node/Server",
        },
        previousEntryHash,
      }

      const entryHash = calculateAuditEntryHash(rawEntry)
      const completeEntry: AuditRegistryEntry = { ...rawEntry, entryHash }

      return completeEntry
    },
    [data.auditRegistry, currentUser]
  )

  // =========================================================================
  // CRÉATION D'OPÉRATION
  // =========================================================================
  const createOperation = useCallback<GovernanceContextValue["createOperation"]>(
    (input) => {
      if (currentUser.role === "national_auditor") {
        return { ok: false, error: "L'auditeur national ne peut pas créer d'opérations." }
      }
      if (!canAccessWilaya(currentUser, input.wilayaCode)) {
        return { ok: false, error: "Vous ne pouvez pas créer d'opération hors de votre wilaya d'affectation." }
      }
      if (!canAccessCommune(currentUser, input.wilayaCode, input.commune)) {
        return { ok: false, error: "Vous ne pouvez pas créer d'opération hors de votre commune." }
      }

      const id = "op-" + crypto.randomUUID()
      const year = new Date().getFullYear()
      const wCode = String(input.wilayaCode).padStart(2, "0")
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      const reference = `YFY-OP-${year}-${wCode}-${rand}`
      const stamp = new Date().toISOString()

      const newOp: InstitutionalOperation = {
        ...input,
        id,
        reference,
        createdById: currentUser.id,
        createdByName: `${currentUser.firstName} ${currentUser.lastName} (${currentUser.structure})`,
        verificationStage: input.riskLevel === "standard" ? "declared" : "verified",
        attestations: [],
        history: [
          {
            id: "hist-" + crypto.randomUUID(),
            fromStatus: "draft",
            toStatus: input.status,
            changedAt: stamp,
            actorId: currentUser.id,
            actorName: `${currentUser.firstName} ${currentUser.lastName}`,
            actorRole: currentUser.role,
            reason: "Création initiale de l'opération institutionnelle.",
          },
        ],
        createdAt: stamp,
        updatedAt: stamp,
      }

      const audit = logAudit("operation_create", "operation", id, reference, {
        newState: { title: newOp.title, status: newOp.status, wilayaCode: newOp.wilayaCode },
        justification: "Création de l'opération dans le cadre du programme territorial.",
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalOperations: [newOp, ...(prev.institutionalOperations || [])],
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true, operation: newOp }
    },
    [currentUser, logAudit, updateAppData]
  )

  // =========================================================================
  // TRANSITION DU CYCLE DE VALIDATION + ATTESTATION NUMÉRIQUE
  // =========================================================================
  const transitionOperationStatus = useCallback<GovernanceContextValue["transitionOperationStatus"]>(
    (operationId, targetStatus, justification, options) => {
      const op = allOperations.find((o) => o.id === operationId)
      if (!op) return { ok: false, error: "Opération introuvable." }

      // 1. Contrôle ABAC strict
      const check = canTransitionOperation(currentUser, op, targetStatus, {
        isEmergency: options?.isEmergency,
        justification,
      })
      if (!check.allowed) {
        return { ok: false, error: check.reason || "Transition non autorisée." }
      }

      const stamp = new Date().toISOString()
      let generatedAttestation: DigitalAttestation | undefined

      // 2. Émission d'attestation numérique pour jalons critiques
      const isCriticalAction = [
        "approved",
        "published",
        "completed",
        "closed",
        "suspended",
        "rejected",
      ].includes(targetStatus) || options?.isEmergency

      if (isCriticalAction) {
        const attestationId = generateAttestationId()
        const actionType: DigitalAttestation["actionType"] =
          options?.isEmergency
            ? "emergency_override"
            : targetStatus === "approved"
            ? "approval"
            : targetStatus === "published"
            ? "publication"
            : targetStatus === "completed"
            ? "completion"
            : targetStatus === "closed"
            ? "closure"
            : targetStatus === "suspended"
            ? "suspension"
            : "rejection"

        const previousAttestation = op.attestations[op.attestations.length - 1]

        const docHash = calculateDocumentHash({
          operationReference: op.reference,
          title: op.title,
          wilayaCode: op.wilayaCode,
          commune: op.commune,
          category: op.category,
          targetStatus,
          timestamp: stamp,
          actorId: currentUser.id,
        })

        const rawAttestation: DigitalAttestation = {
          id: attestationId,
          operationId: op.id,
          operationReference: op.reference,
          actionType,
          actorId: currentUser.id,
          actorName: `${currentUser.firstName} ${currentUser.lastName}`,
          actorRole: currentUser.role,
          structure: currentUser.structure,
          wilayaCode: currentUser.wilayaCode ?? op.wilayaCode,
          commune: currentUser.commune ?? op.commune,
          timestamp: stamp,
          justification: justification.trim(),
          documentHash: docHash,
          previousAttestationHash: previousAttestation ? previousAttestation.documentHash : undefined,
          qrPayload: "",
        }

        rawAttestation.qrPayload = generateAttestationQrPayload(rawAttestation)
        generatedAttestation = rawAttestation
      }

      // 3. Déterminer le palier de vérification institutionnel
      let newStage = op.verificationStage
      if (targetStatus === "under_review") newStage = "verified"
      if (targetStatus === "approved" || targetStatus === "published") newStage = "validated"
      if (targetStatus === "completed" || targetStatus === "closed") newStage = "consolidated"

      const updatedOp: InstitutionalOperation = {
        ...op,
        status: targetStatus,
        verificationStage: newStage,
        attestations: generatedAttestation ? [...op.attestations, generatedAttestation] : op.attestations,
        history: [
          ...op.history,
          {
            id: "hist-" + crypto.randomUUID(),
            fromStatus: op.status,
            toStatus: targetStatus,
            changedAt: stamp,
            actorId: currentUser.id,
            actorName: `${currentUser.firstName} ${currentUser.lastName}`,
            actorRole: currentUser.role,
            reason: justification.trim(),
          },
        ],
        updatedAt: stamp,
      }

      // 4. Enregistrement immuable au registre d'audit
      const auditAction =
        targetStatus === "suspended"
          ? "operation_suspend"
          : targetStatus === "closed"
          ? "operation_close"
          : targetStatus === "cancelled"
          ? "operation_cancel"
          : options?.isEmergency
          ? "emergency_override"
          : "operation_transition"

      const audit = logAudit(auditAction, "operation", op.id, op.reference, {
        previousState: { status: op.status, stage: op.verificationStage },
        newState: {
          status: targetStatus,
          stage: newStage,
          attestationId: generatedAttestation?.id,
        },
        justification,
        isEmergency: options?.isEmergency,
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalOperations: (prev.institutionalOperations || []).map((o) =>
          o.id === op.id ? updatedOp : o
        ),
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true, operation: updatedOp, attestation: generatedAttestation }
    },
    [allOperations, currentUser, logAudit, updateAppData]
  )

  const getOperationAttestations = useCallback(
    (operationId: string) => {
      const op = allOperations.find((o) => o.id === operationId)
      return op ? op.attestations : []
    },
    [allOperations]
  )

  // =========================================================================
  // VÉRIFICATION D'INTÉGRITÉ DE LA CHAÎNE CRYPTOGRAPHIQUE
  // =========================================================================
  const verifyAuditIntegrity = useCallback(() => {
    return verifyAuditChainIntegrity(data.auditRegistry || [])
  }, [data.auditRegistry])

  // =========================================================================
  // GESTION DES COMPTES ADMINISTRATIFS & AFFECTATIONS
  // =========================================================================
  const addInstitutionalUser = useCallback<GovernanceContextValue["addInstitutionalUser"]>(
    (input) => {
      const check = canCreateInstitutionalUser(currentUser, input.role, input.wilayaCode)
      if (!check.allowed) {
        return { ok: false, error: check.reason || "Création non autorisée par le protocole hiérarchique." }
      }

      const id = "user-" + crypto.randomUUID()
      const stamp = new Date().toISOString()
      const inviteToken = "INV-" + crypto.randomUUID().slice(0, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase()
      const expiresAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString()

      const newUser: InstitutionalUser = {
        ...input,
        id,
        createdBy: currentUser.id,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdByRole: currentUser.role,
        invitationToken: inviteToken,
        invitationSentAt: stamp,
        invitationExpiresAt: expiresAt,
        createdAt: stamp,
        updatedAt: stamp,
      }

      const audit = logAudit("admin_user_create", "user", id, input.email, {
        newState: {
          email: input.email,
          role: input.role,
          wilayaCode: input.wilayaCode,
          commune: input.commune,
          structure: input.structure,
          createdBy: currentUser.id,
          createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        },
        justification: "Création et nomination hiérarchique de compte administratif par responsable habilité.",
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalUsers: [...(prev.institutionalUsers || []), newUser],
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true, user: newUser }
    },
    [currentUser, logAudit, updateAppData]
  )

  const updateInstitutionalUser = useCallback<GovernanceContextValue["updateInstitutionalUser"]>(
    (updatedUser) => {
      const target = allUsers.find((u) => u.id === updatedUser.id)
      if (!target) return { ok: false, error: "Utilisateur cible introuvable." }

      const check = canUpdateInstitutionalUser(currentUser, target, {
        role: updatedUser.role,
        wilayaCode: updatedUser.wilayaCode,
        commune: updatedUser.commune,
      })
      if (!check.allowed) {
        return { ok: false, error: check.reason || "Privilèges insuffisants pour modifier ce responsable." }
      }

      const stamp = new Date().toISOString()
      const finalUser: InstitutionalUser = { ...updatedUser, updatedAt: stamp }

      let auditAction: AuditRegistryEntry["action"] = "admin_user_update"
      let justification = "Mise à jour des coordonnées et profil administratif."

      if (updatedUser.wilayaCode !== target.wilayaCode || updatedUser.commune !== target.commune) {
        auditAction = "admin_user_territory_change"
        justification = `Modification d'affectation territoriale : Wilaya ${updatedUser.wilayaCode || "Nationale"} (${updatedUser.commune || "Toute la wilaya"}).`
      } else if (updatedUser.role !== target.role) {
        auditAction = "role_assigned"
        justification = `Changement officiel de rôle hiérarchique : de ${target.role} vers ${updatedUser.role}.`
      }

      const audit = logAudit(auditAction, "user", updatedUser.id, updatedUser.email, {
        previousState: { role: target.role, wilayaCode: target.wilayaCode, commune: target.commune },
        newState: { role: updatedUser.role, wilayaCode: updatedUser.wilayaCode, commune: updatedUser.commune },
        justification,
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalUsers: (prev.institutionalUsers || []).map((u) =>
          u.id === updatedUser.id ? finalUser : u
        ),
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true, user: finalUser }
    },
    [allUsers, currentUser, logAudit, updateAppData]
  )

  const setInstitutionalUserStatus = useCallback<GovernanceContextValue["setInstitutionalUserStatus"]>(
    (userId, status, justification) => {
      const target = allUsers.find((u) => u.id === userId)
      if (!target) return { ok: false, error: "Utilisateur introuvable." }

      const check = canChangeInstitutionalUserStatus(currentUser, target, status)
      if (!check.allowed) {
        return { ok: false, error: check.reason || "Privilèges insuffisants pour modifier le statut de ce compte." }
      }

      if (!justification || justification.trim().length < 5) {
        return { ok: false, error: "Une justification formelle obligatoire est requise pour modifier le statut administratif." }
      }

      const stamp = new Date().toISOString()
      const updatedUser: InstitutionalUser = { ...target, status, updatedAt: stamp }

      const actionType = status === "active" ? "admin_user_reactivate" : "admin_user_suspend"

      const audit = logAudit(actionType, "user", userId, target.email, {
        previousState: { status: target.status },
        newState: { status },
        justification: justification.trim(),
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalUsers: (prev.institutionalUsers || []).map((u) =>
          u.id === userId ? updatedUser : u
        ),
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true }
    },
    [allUsers, currentUser, logAudit, updateAppData]
  )

  const sendUserInvitation = useCallback<GovernanceContextValue["sendUserInvitation"]>(
    (userId) => {
      const target = allUsers.find((u) => u.id === userId)
      if (!target) return { ok: false, error: "Utilisateur introuvable." }

      const check = canManageInstitutionalUser(currentUser, target.role, target.wilayaCode)
      if (!check) {
        return { ok: false, error: "Vous n'avez pas l'autorité hiérarchique pour émettre une invitation à ce compte." }
      }

      const stamp = new Date().toISOString()
      const token = "INV-" + crypto.randomUUID().slice(0, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase()
      const expiresAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString()
      const link = `${window.location.origin}/admin?invitation=${token}&email=${encodeURIComponent(target.email)}`

      const updatedUser: InstitutionalUser = {
        ...target,
        invitationToken: token,
        invitationSentAt: stamp,
        invitationExpiresAt: expiresAt,
        status: target.status === "active" ? "active" : "pending_activation",
        updatedAt: stamp,
      }

      const audit = logAudit("admin_user_invite", "user", target.id, target.email, {
        newState: { invitationToken: token, expiresAt },
        justification: "Émission d'un lien d'invitation et réinitialisation d'accès sécurisé (validité 72h).",
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalUsers: (prev.institutionalUsers || []).map((u) =>
          u.id === target.id ? updatedUser : u
        ),
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true, token, link }
    },
    [allUsers, currentUser, logAudit, updateAppData]
  )

  const accountAnomalies = useMemo(() => {
    return detectAccountAnomalies(allUsers)
  }, [allUsers])

  const transferUserOperations = useCallback<GovernanceContextValue["transferUserOperations"]>(
    (fromUserId, toUserId, justification) => {
      if (currentUser.role !== "national_admin" && currentUser.role !== "wilaya_admin") {
        return { ok: false, error: "Seul un administrateur peut ordonner le transfert d'opérations." }
      }

      const targetTo = allUsers.find((u) => u.id === toUserId)
      if (!targetTo) return { ok: false, error: "Responsable cible introuvable." }

      let transferredCount = 0
      const stamp = new Date().toISOString()

      const updatedOps = allOperations.map((op) => {
        if (op.assignedLeadId === fromUserId && ["approved", "published", "in_progress"].includes(op.status)) {
          transferredCount++
          return {
            ...op,
            assignedLeadId: targetTo.id,
            assignedLeadName: `${targetTo.firstName} ${targetTo.lastName} (${targetTo.structure})`,
            updatedAt: stamp,
          }
        }
        return op
      })

      const audit = logAudit("operation_update", "operation", "BATCH-TRANSFER", `Transfert ${fromUserId} -> ${toUserId}`, {
        justification: justification.trim(),
        newState: { fromUserId, toUserId, transferredCount },
      })

      updateAppData((prev) => ({
        ...prev,
        institutionalOperations: updatedOps,
        auditRegistry: [...(prev.auditRegistry || []), audit],
      }))

      return { ok: true, transferredCount }
    },
    [allOperations, allUsers, currentUser.role, logAudit, updateAppData]
  )

  const value: GovernanceContextValue = {
    currentUser,
    allUsers,
    switchUser,
    operations,
    allOperations,
    auditEntries,
    allAuditEntries,
    kpis,
    canAccessWilaya: (w) => canAccessWilaya(currentUser, w),
    canAccessCommune: (w, c) => canAccessCommune(currentUser, w, c),
    canViewOperation: (op) => canViewOperation(currentUser, op),
    createOperation,
    transitionOperationStatus,
    getOperationAttestations,
    verifyAuditIntegrity,
    addInstitutionalUser,
    updateInstitutionalUser,
    setInstitutionalUserStatus,
    sendUserInvitation,
    accountAnomalies,
    transferUserOperations,
  }

  return (
    <GovernanceContext.Provider value={value}>
      {children}
    </GovernanceContext.Provider>
  )
}

export function useGovernance() {
  const ctx = useContext(GovernanceContext)
  if (!ctx) {
    throw new Error("useGovernance must be used within a GovernanceProvider")
  }
  return ctx
}
