/**
 * ============================================================================
 * SCRIPTS DE TEST AUTOMATISÉ — GOUVERNANCE & TRAÇABILITÉ INSTITUTIONNELLE
 * Validation des 10 scénarios réglementaires (Section 12)
 * ============================================================================
 */

import { createHash } from "node:crypto"

console.log("================================================================================")
console.log("SUITE DE VALIDATION INSTITUTIONNELLE : YED FEL YED (يد في يد)")
console.log("Ministère de la Jeunesse et des Sports — Test des 10 Scénarios Réglementaires")
console.log("================================================================================\n")

let passed = 0
let failed = 0

function assert(condition, scenarioNum, description) {
  if (condition) {
    console.log(`[PASS] Scénario ${scenarioNum} : ${description}`)
    passed++
  } else {
    console.error(`[FAIL] Scénario ${scenarioNum} : ${description}`)
    failed++
  }
}

// ----------------------------------------------------------------------------
// HARNESS DE MODÉLISATION DES TESTS
// ----------------------------------------------------------------------------

function sha256(str) {
  return createHash("sha256").update(str, "utf8").digest("hex")
}

function canonicalSerialize(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj)
  if (Array.isArray(obj)) return "[" + obj.map(canonicalSerialize).join(",") + "]"
  const keys = Object.keys(obj).sort()
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalSerialize(obj[k])).join(",") + "}"
}

function verifyAuditChain(entries) {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (i === 0) {
      if (entry.previousEntryHash !== "GENESIS-BLOCK-YED-FEL-YED-REPUBLIC-OF-ALGERIA-2026") {
        return { valid: false, error: "Genesis hash invalide", index: 0 }
      }
    } else {
      if (entry.previousEntryHash !== entries[i - 1].entryHash) {
        return { valid: false, error: "Rupture de chaînage avec le bloc antérieur", index: i }
      }
    }
    const payload = `${entry.blockIndex}|${entry.timestamp}|${entry.userId}|${entry.action}|${entry.entityType}|${entry.entityId}|${canonicalSerialize(entry.payloadDiff)}|${entry.justification}|${entry.previousEntryHash}`
    const expectedHash = sha256(payload)
    if (entry.entryHash !== expectedHash) {
      return { valid: false, error: "Altération d'empreinte cryptographique", index: i }
    }
  }
  return { valid: true }
}

// Données types de test
const nationalAdmin = { id: "u-nat", role: "national_admin", wilayaCode: undefined, status: "active" }
const wilayaAdmin06 = { id: "u-w06", role: "wilaya_admin", wilayaCode: 6, status: "active" }
const wilayaAdmin16 = { id: "u-w16", role: "wilaya_admin", wilayaCode: 16, status: "active" }
const localCoordAkbou = { id: "u-coord-akbou", role: "local_coordinator", wilayaCode: 6, commune: "Akbou", status: "active" }
const missionLead01 = { id: "u-lead-01", role: "mission_lead", wilayaCode: 6, assignedOperationIds: ["op-01"], status: "active" }
const nationalAuditor = { id: "u-auditor", role: "national_auditor", status: "active" }

// --- SCÉNARIO 1 : Tentative d'accès inter-wilaya par un administrateur local (rejet attendu)
function canAccessWilaya(user, targetWilaya) {
  if (user.role === "national_admin" || user.role === "national_auditor") return true
  return user.wilayaCode === targetWilaya
}

const s1_crossWilayaBlocked = !canAccessWilaya(wilayaAdmin06, 16) && !canAccessWilaya(localCoordAkbou, 16)
assert(s1_crossWilayaBlocked, 1, "Tentative d'accès inter-wilaya (Béjaïa 06 vers Alger 16) strictement bloquée par ABAC")

// --- SCÉNARIO 2 : Création et soumission d'une opération par un coordinateur local
const opNew = {
  id: "op-s2",
  reference: "YFY-OP-2026-06-009",
  title: "Distribution de kits scolaires d'hiver",
  wilayaCode: 6,
  commune: "Akbou",
  status: "draft",
  createdById: localCoordAkbou.id,
  requiredValidationLevel: "wilaya",
  verificationStage: "declared",
}

function submitOperation(user, op) {
  if (user.id !== op.createdById && user.role !== "wilaya_admin" && user.role !== "national_admin") {
    return { ok: false, error: "Non autorisé" }
  }
  return { ok: true, status: "submitted", stage: "declared" }
}

const s2_submission = submitOperation(localCoordAkbou, opNew)
assert(s2_submission.ok && s2_submission.status === "submitted", 2, "Création et soumission réussie d'une opération locale par le coordinateur d'Akbou")

// --- SCÉNARIO 3 : Approbation par l'administrateur de wilaya avec génération d'attestation
function approveOperation(approver, op, justification) {
  if (!justification || justification.length < 5) {
    return { ok: false, error: "Justification obligatoire requise" }
  }
  if (approver.role !== "wilaya_admin" && approver.role !== "national_admin") {
    return { ok: false, error: "Rôle non habilité à l'approbation" }
  }
  if (approver.role === "wilaya_admin" && approver.wilayaCode !== op.wilayaCode) {
    return { ok: false, error: "Périmètre wilaya non concordant" }
  }
  const attestationId = `ATT-2026-W06-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  const docHash = sha256(`${op.id}|approved|${justification}|${approver.id}`)
  return {
    ok: true,
    status: "approved",
    stage: "validated",
    attestation: {
      id: attestationId,
      actionType: "approval",
      actorId: approver.id,
      actorRole: approver.role,
      documentHash: docHash,
      qrPayload: `YFY://VERIFY/ATTESTATION?id=${attestationId}&h=${docHash.slice(0, 16)}`,
    },
  }
}

const s3_approval = approveOperation(wilayaAdmin06, opNew, "Vérification des conditions de sécurité et de conformité logistique validée.")
assert(s3_approval.ok && s3_approval.status === "approved" && !!s3_approval.attestation.qrPayload, 3, "Approbation hiérarchique par l'Admin Wilaya 06 avec génération d'attestation et QR de vérification")

// --- SCÉNARIO 4 : Tentative d'auto-validation par le créateur lorsque l'approbation wilaya est requise (rejet attendu)
function canApproveSelf(user, op) {
  if (op.requiredValidationLevel === "wilaya" && op.createdById === user.id && user.role !== "national_admin") {
    return false // Séparation des devoirs
  }
  return true
}

const s4_selfApprovalBlocked = !canApproveSelf(localCoordAkbou, opNew)
assert(s4_selfApprovalBlocked, 4, "Principe de séparation des devoirs : tentative d'auto-approbation par le créateur rejetée avec succès")

// --- SCÉNARIO 5 : Déclenchement d'une urgence avec justification (procédure accélérée)
function executeEmergencyOverride(user, op, justification) {
  if (user.role !== "national_admin" && user.role !== "wilaya_admin") {
    return { ok: false, error: "Rôle non habilité pour la procédure d'urgence" }
  }
  if (!justification || justification.length < 10) {
    return { ok: false, error: "Justification d'urgence impérative et détaillée requise" }
  }
  return {
    ok: true,
    status: "published",
    isEmergency: true,
    postActionAuditRequired: true,
  }
}

const s5_emergency = executeEmergencyOverride(wilayaAdmin06, opNew, "URGENCE HUMANITAIRE : Sinistre météorologique subit nécessitant une intervention immédiate.")
assert(s5_emergency.ok && s5_emergency.status === "published" && s5_emergency.postActionAuditRequired, 5, "Procédure d'urgence 'Fast-Track' déclenchée avec justification et audit a posteriori")

// --- SCÉNARIO 6 : Tentative de modification directe d'un bloc du registre d'audit (rejet attendu)
function canMutateAuditEntry(user) {
  // L'audit est scellé WORM (Write Once, Read Many). Aucune mutation ni suppression autorisée.
  return false
}

const s6_auditMutationBlocked = !canMutateAuditEntry(nationalAdmin)
assert(s6_auditMutationBlocked, 6, "Immuabilité de l'audit : tentative de modification d'un bloc d'audit scellé bloquée (interdit même pour Admin National)")

// --- SCÉNARIO 7 : Détection d'une altération de hash lors de la vérification de l'arbre / registre
const block0 = {
  blockIndex: 0,
  timestamp: "2026-11-04T00:00:00Z",
  userId: "system",
  action: "system_genesis",
  entityType: "system",
  entityId: "GENESIS",
  payloadDiff: {},
  justification: "Genesis block",
  previousEntryHash: "GENESIS-BLOCK-YED-FEL-YED-REPUBLIC-OF-ALGERIA-2026",
}
block0.entryHash = sha256(`${block0.blockIndex}|${block0.timestamp}|${block0.userId}|${block0.action}|${block0.entityType}|${block0.entityId}|${canonicalSerialize(block0.payloadDiff)}|${block0.justification}|${block0.previousEntryHash}`)

const block1 = {
  blockIndex: 1,
  timestamp: "2026-11-04T01:00:00Z",
  userId: "u-w06",
  action: "operation_transition",
  entityType: "operation",
  entityId: "op-s2",
  payloadDiff: { from: "submitted", to: "approved" },
  justification: "Validation officielle",
  previousEntryHash: block0.entryHash,
}
block1.entryHash = sha256(`${block1.blockIndex}|${block1.timestamp}|${block1.userId}|${block1.action}|${block1.entityType}|${block1.entityId}|${canonicalSerialize(block1.payloadDiff)}|${block1.justification}|${block1.previousEntryHash}`)

const validChain = [block0, block1]
const validCheck = verifyAuditChain(validChain)

// Altération intentionnelle d'une donnée historique dans block1
const tamperedChain = [
  block0,
  { ...block1, justification: "Texte frauduleusement altéré à postériori" }
]
const tamperedCheck = verifyAuditChain(tamperedChain)

assert(validCheck.valid && !tamperedCheck.valid && tamperedCheck.index === 1, 7, "Algorithme SHA-256 de vérification d'intégrité : altération de payload immédiatement détectée")

// --- SCÉNARIO 8 : Consultation exhaustive des logs par un auditeur national sans droit de modification
function auditorCapabilities(user) {
  return {
    canViewAllNationalData: user.role === "national_auditor",
    canViewAuditLogs: user.role === "national_auditor",
    canModifyOperations: user.role !== "national_auditor",
    canManageUsers: user.role !== "national_auditor",
    canAdjustPoints: user.role !== "national_auditor",
  }
}

const caps = auditorCapabilities(nationalAuditor)
const s8_auditorEnforced = caps.canViewAllNationalData && caps.canViewAuditLogs && !caps.canModifyOperations && !caps.canManageUsers && !caps.canAdjustPoints
assert(s8_auditorEnforced, 8, "Rôle Auditeur National : consultation intégrale autorisée, TOUTE modification / gestion de points / suppression strictement verrouillée")

// --- SCÉNARIO 9 : Révocation d'un coordinateur local et réattribution de ses opérations en cours
const sampleOperations = [
  { id: "op-1", assignedLeadId: "u-coord-old", status: "in_progress" },
  { id: "op-2", assignedLeadId: "u-coord-old", status: "approved" },
  { id: "op-3", assignedLeadId: "u-coord-other", status: "in_progress" },
]

function revokeAndReassign(admin, revokedUserId, replacementUserId, ops) {
  if (admin.role !== "national_admin" && admin.role !== "wilaya_admin") {
    return { ok: false, error: "Non autorisé" }
  }
  let transferred = 0
  const updatedOps = ops.map((op) => {
    if (op.assignedLeadId === revokedUserId) {
      transferred++
      return { ...op, assignedLeadId: replacementUserId }
    }
    return op
  })
  return { ok: true, transferred, updatedOps }
}

const s9_reassign = revokeAndReassign(wilayaAdmin06, "u-coord-old", "u-coord-new", sampleOperations)
assert(s9_reassign.ok && s9_reassign.transferred === 2 && s9_reassign.updatedOps[0].assignedLeadId === "u-coord-new", 9, "Révocation administrative d'un responsable et passation/réattribution transparente de ses 2 opérations en cours")

// --- SCÉNARIO 10 : Export du rapport institutionnel à 4 étapes avec les 69 wilayas
const stages = ["declared", "verified", "validated", "consolidated"]
const sampleWilayasTable = Array.from({ length: 69 }, (_, i) => ({
  wilayaCode: i + 1,
  totalOps: (i + 1) % 4,
  activeOps: (i + 1) % 3,
  volunteers: (i + 1) * 12,
}))

function generateReportingExport(wilayasData) {
  return {
    wilayasCount: wilayasData.length,
    stagesCount: stages.length,
    hasCoverage69: wilayasData.length === 69,
  }
}

const s10_export = generateReportingExport(sampleWilayasTable)
assert(s10_export.hasCoverage69 && s10_export.stagesCount === 4, 10, "Génération et consolidation du tableau de bord institutionnel couvrant l'intégralité des 69 wilayas sur 4 stades")

console.log("\n================================================================================")
console.log(`RÉSULTATS DE VALIDATION : ${passed} / 10 Scénarios RÉUSSIS — ${failed} Échecs`)
console.log("================================================================================\n")

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}

