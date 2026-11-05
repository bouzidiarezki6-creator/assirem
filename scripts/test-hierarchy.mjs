/**
 * ============================================================================
 * SCRIPTS DE TEST AUTOMATISÉ — HIÉRARCHIE ADMINISTRATIVE & CONFINEMENT ABAC
 * Validation des 10 scénarios de sécurité obligatoires
 * Plateforme Nationale Yed Fel Yed (يد في يد)
 * ============================================================================
 */

import { createHash } from "node:crypto"

console.log("================================================================================")
console.log("SUITE DE VALIDATION HIÉRARCHIQUE DES ADMINISTRATEURS — YED FEL YED")
console.log("Ministère de la Jeunesse et des Sports — Test des 10 Scénarios de Sécurité")
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
// HARNESS DE SIMULATION DES RÈGLES MÉTIER ABAC & HIÉRARCHIE
// ----------------------------------------------------------------------------

function canCreateInstitutionalUser(actor, targetRole, targetWilayaCode) {
  // 1. Visiteur / Non authentifié
  if (!actor) {
    return { allowed: false, reason: "Accès refusé : utilisateur non authentifié." }
  }

  // 2. Compte suspendu
  if (actor.status !== "active") {
    return { allowed: false, reason: "Compte inactif ou suspendu : opérations interdites." }
  }

  // 3. Coordinateur local ou Responsable de mission : AUCUNE création de compte administratif
  if (actor.role === "local_coordinator" || actor.role === "mission_lead") {
    return { allowed: false, reason: "Un coordinateur local ne peut créer aucun compte administratif." }
  }

  // 4. Auditeur national : Lecture seule stricte
  if (actor.role === "national_auditor") {
    return { allowed: false, reason: "L'auditeur national possède des permissions en lecture seule stricte." }
  }

  // 5. Administrateur de Wilaya (Niveau 2)
  if (actor.role === "wilaya_admin") {
    // Ne peut pas créer de niveau 1
    if (targetRole === "national_admin") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut pas créer d'administrateur national." }
    }
    // Ne peut pas créer d'auditeur national
    if (targetRole === "national_auditor") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut pas créer d'auditeur national." }
    }
    // Ne peut pas créer d'autre administrateur de wilaya
    if (targetRole === "wilaya_admin") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut pas créer un autre administrateur de wilaya." }
    }
    // Confinement territorial strict pour création de coordinateur local
    if (targetWilayaCode !== actor.wilayaCode) {
      return {
        allowed: false,
        reason: `Confinement territorial : un administrateur de wilaya (${actor.wilayaCode}) ne peut affecter de coordinateur que dans sa propre wilaya.`,
      }
    }
    return { allowed: true }
  }

  // 6. Administrateur National (Niveau 1)
  if (actor.role === "national_admin") {
    if (targetRole === "wilaya_admin") {
      if (!targetWilayaCode || targetWilayaCode < 1 || targetWilayaCode > 69) {
        return { allowed: false, reason: "Un administrateur de wilaya doit être affecté à une wilaya valide (1 à 69)." }
      }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: "Action non autorisée." }
}

function canUpdateInstitutionalUser(actor, targetUser, updates = {}) {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Compte inactif ou privilèges insuffisants." }
  }

  // Auto-élévation de privilèges strictement interdite
  if (actor.id === targetUser.id) {
    if (updates.role && updates.role !== targetUser.role) {
      return { allowed: false, reason: "Auto-élévation de privilèges strictement interdite." }
    }
    if (updates.wilayaCode && updates.wilayaCode !== targetUser.wilayaCode) {
      return { allowed: false, reason: "Auto-modification de wilaya d'affectation interdite." }
    }
  }

  // Auditeur ou Coordinateur : aucune modification de compte
  if (actor.role === "national_auditor" || actor.role === "local_coordinator" || actor.role === "mission_lead") {
    return { allowed: false, reason: "Permissions insuffisantes pour modifier un compte." }
  }

  // Administrateur de Wilaya
  if (actor.role === "wilaya_admin") {
    if (targetUser.role !== "local_coordinator" && targetUser.role !== "mission_lead") {
      return { allowed: false, reason: "Un administrateur de wilaya ne peut modifier que les coordinateurs de son territoire." }
    }
    if (targetUser.wilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: "Ce coordinateur est rattaché à une autre wilaya." }
    }
    if (updates.wilayaCode && updates.wilayaCode !== actor.wilayaCode) {
      return { allowed: false, reason: "Impossible de transférer un coordinateur hors de votre wilaya." }
    }
    if (updates.role && updates.role !== targetUser.role) {
      return { allowed: false, reason: "Seul l'administrateur national peut modifier les rôles hiérarchiques." }
    }
    return { allowed: true }
  }

  // Administrateur National
  if (actor.role === "national_admin") {
    return { allowed: true }
  }

  return { allowed: false, reason: "Opération non autorisée." }
}

function canChangeInstitutionalUserStatus(actor, targetUser, newStatus) {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Compte inactif ou suspendu." }
  }

  if (actor.role === "national_auditor" || actor.role === "local_coordinator") {
    return { allowed: false, reason: "Rôle non habilité à modifier le statut d'un compte." }
  }

  // Ne pas se suspendre soi-même
  if (actor.id === targetUser.id && (newStatus === "suspended" || newStatus === "deactivated")) {
    return { allowed: false, reason: "Un administrateur ne peut pas révoquer ou suspendre son propre compte." }
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

function canTransitionOperation(actor, operation, targetStatus) {
  if (!actor || actor.status !== "active") {
    return { allowed: false, reason: "Compte administratif inactif ou suspendu." }
  }

  if (actor.role === "national_auditor") {
    return { allowed: false, reason: "Rôle Auditeur National : consultation uniquement. Aucune modification autorisée." }
  }

  if (actor.role !== "national_admin" && actor.wilayaCode !== operation.wilayaCode) {
    return { allowed: false, reason: "Périmètre wilaya non concordant." }
  }

  return { allowed: true }
}

// ----------------------------------------------------------------------------
// ACTEURS DE TEST
// ----------------------------------------------------------------------------

const visitor = null

const nationalAdmin = {
  id: "user-nat-01",
  email: "admin.national@mjs.gov.dz",
  role: "national_admin",
  status: "active",
}

const nationalAuditor = {
  id: "user-audit-nat",
  email: "auditeur.national@mjs.gov.dz",
  role: "national_auditor",
  status: "active",
}

const wilayaAdminBejaia = {
  id: "user-wil-06",
  email: "djs.bejaia@mjs.gov.dz",
  role: "wilaya_admin",
  wilayaCode: 6,
  status: "active",
}

const wilayaAdminSetif = {
  id: "user-wil-19",
  email: "djs.setif@mjs.gov.dz",
  role: "wilaya_admin",
  wilayaCode: 19,
  status: "active",
}

const localCoordAkbou = {
  id: "user-loc-akbou",
  email: "coord.akbou@djs-bejaia.dz",
  role: "local_coordinator",
  wilayaCode: 6,
  commune: "Akbou",
  status: "active",
}

const suspendedWilayaAdmin = {
  id: "user-wil-06-susp",
  email: "ancien.djs@mjs.gov.dz",
  role: "wilaya_admin",
  wilayaCode: 6,
  status: "suspended",
}

const testOperation = {
  id: "op-test-01",
  reference: "YFY-OP-2026-06-001",
  wilayaCode: 6,
  commune: "Akbou",
  status: "under_review",
}

// ----------------------------------------------------------------------------
// EXÉCUTION DES 10 SCÉNARIOS DE TEST OBLIGATOIRES
// ----------------------------------------------------------------------------

// SCÉNARIO 1 : Un visiteur ne peut pas créer un compte administratif
const s1_result = canCreateInstitutionalUser(visitor, "local_coordinator", 6)
assert(
  !s1_result.allowed && s1_result.reason.includes("non authentifié"),
  1,
  "Un visiteur (non authentifié) ne peut pas créer un compte administratif"
)

// SCÉNARIO 2 : Un coordinateur ne peut pas créer un autre coordinateur
const s2_result = canCreateInstitutionalUser(localCoordAkbou, "local_coordinator", 6)
assert(
  !s2_result.allowed && s2_result.reason.includes("coordinateur local ne peut créer aucun compte"),
  2,
  "Un coordinateur local ne peut pas créer un autre coordinateur"
)

// SCÉNARIO 3 : Un administrateur de Béjaïa ne peut pas créer un coordinateur à Sétif
const s3_result = canCreateInstitutionalUser(wilayaAdminBejaia, "local_coordinator", 19)
assert(
  !s3_result.allowed && s3_result.reason.includes("Confinement territorial"),
  3,
  "Un administrateur de Béjaïa (06) ne peut pas créer un coordinateur à Sétif (19)"
)

// SCÉNARIO 4 : Un administrateur de wilaya ne peut pas créer un autre administrateur de wilaya
const s4_result = canCreateInstitutionalUser(wilayaAdminBejaia, "wilaya_admin", 6)
assert(
  !s4_result.allowed && s4_result.reason.includes("ne peut pas créer un autre administrateur de wilaya"),
  4,
  "Un administrateur de wilaya ne peut pas créer un autre administrateur de wilaya"
)

// SCÉNARIO 5 : Un administrateur de wilaya ne peut pas créer un auditeur national
const s5_result = canCreateInstitutionalUser(wilayaAdminBejaia, "national_auditor")
assert(
  !s5_result.allowed && s5_result.reason.includes("ne peut pas créer d'auditeur national"),
  5,
  "Un administrateur de wilaya ne peut pas créer un auditeur national"
)

// SCÉNARIO 6 : Seul l'administrateur national peut gérer les auditeurs
const s6_natCanCreateAuditor = canCreateInstitutionalUser(nationalAdmin, "national_auditor").allowed
const s6_wilayaCannotManageAuditor = !canUpdateInstitutionalUser(wilayaAdminBejaia, nationalAuditor).allowed
const s6_natCanManageAuditor = canUpdateInstitutionalUser(nationalAdmin, nationalAuditor, { role: "national_auditor" }).allowed
assert(
  s6_natCanCreateAuditor && s6_wilayaCannotManageAuditor && s6_natCanManageAuditor,
  6,
  "Seul l'administrateur national peut créer et gérer les auditeurs nationaux"
)

// SCÉNARIO 7 : Seul l'administrateur national peut créer et gérer les administrateurs de wilaya
const s7_natCanCreateWilayaAdmin = canCreateInstitutionalUser(nationalAdmin, "wilaya_admin", 16).allowed
const s7_wilayaCannotCreateWilayaAdmin = !canCreateInstitutionalUser(wilayaAdminBejaia, "wilaya_admin", 16).allowed
const s7_wilayaCannotManageOtherWilaya = !canUpdateInstitutionalUser(wilayaAdminBejaia, wilayaAdminSetif).allowed
const s7_natCanManageWilayaAdmin = canUpdateInstitutionalUser(nationalAdmin, wilayaAdminBejaia).allowed
assert(
  s7_natCanCreateWilayaAdmin && s7_wilayaCannotCreateWilayaAdmin && s7_wilayaCannotManageOtherWilaya && s7_natCanManageWilayaAdmin,
  7,
  "Seul l'administrateur national peut créer et gérer les administrateurs de wilaya (69 wilayas)"
)

// SCÉNARIO 8 : L'auditeur ne peut modifier aucune donnée
const s8_auditorCannotCreate = !canCreateInstitutionalUser(nationalAuditor, "local_coordinator", 6).allowed
const s8_auditorCannotUpdate = !canUpdateInstitutionalUser(nationalAuditor, localCoordAkbou).allowed
const s8_auditorCannotSuspend = !canChangeInstitutionalUserStatus(nationalAuditor, localCoordAkbou, "suspended").allowed
const s8_auditorCannotTransitionOp = !canTransitionOperation(nationalAuditor, testOperation, "approved").allowed
assert(
  s8_auditorCannotCreate && s8_auditorCannotUpdate && s8_auditorCannotSuspend && s8_auditorCannotTransitionOp,
  8,
  "L'auditeur national est strictement en lecture seule (interdiction de création, modification, suspension, validation)"
)

// SCÉNARIO 9 : Un compte suspendu ne peut plus effectuer d'opérations administratives
const s9_suspendedCannotCreate = !canCreateInstitutionalUser(suspendedWilayaAdmin, "local_coordinator", 6).allowed
const s9_suspendedCannotUpdate = !canUpdateInstitutionalUser(suspendedWilayaAdmin, localCoordAkbou).allowed
const s9_suspendedCannotTransitionOp = !canTransitionOperation(suspendedWilayaAdmin, testOperation, "approved").allowed
assert(
  s9_suspendedCannotCreate && s9_suspendedCannotUpdate && s9_suspendedCannotTransitionOp,
  9,
  "Un compte suspendu ne peut plus effectuer aucune opération administrative (création, mise à jour, validation)"
)

// SCÉNARIO 10 : Un utilisateur ne peut pas augmenter lui-même ses permissions (auto-élévation)
const s10_wilayaSelfEscalate = !canUpdateInstitutionalUser(wilayaAdminBejaia, wilayaAdminBejaia, { role: "national_admin" }).allowed
const s10_coordSelfEscalate = !canUpdateInstitutionalUser(localCoordAkbou, localCoordAkbou, { role: "wilaya_admin" }).allowed
assert(
  s10_wilayaSelfEscalate && s10_coordSelfEscalate,
  10,
  "Auto-élévation de privilèges strictement interdite et bloquée au niveau ABAC"
)

console.log("\n================================================================================")
console.log(`RÉSULTATS DE VALIDATION HIÉRARCHIQUE : ${passed} / 10 Scénarios RÉUSSIS — ${failed} Échecs`)
console.log("================================================================================\n")

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}

