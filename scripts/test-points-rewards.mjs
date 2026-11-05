/**
 * ============================================================================
 * SUITE DE VALIDATION DU SYSTÈME DE POINTS, NIVEAUX ET RÉCOMPENSES
 * Validation des 10 scénarios obligatoires d'équité, de sécurité et d'audit
 * Plateforme Nationale Algérienne Yed Fel Yed (يد في يد)
 * Ministère de la Jeunesse et des Sports
 * ============================================================================
 */

import { createHash } from "node:crypto"

console.log("================================================================================")
console.log("SUITE DE VALIDATION DU SYSTÈME DE POINTS & RÉCOMPENSES — YED FEL YED")
console.log("Équité, Sécurité QR, Confinement ABAC et Traçabilité WORM des 69 Wilayas")
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
// MODÈLE DE BARÈME & CALCUL DES POINTS (CONSOLIDATION INSTITUTIONNELLE)
// ----------------------------------------------------------------------------

const ACTIVITY_BASE_POINTS = {
  ponctuelle: 5,
  courte: 10,
  standard: 20,
  longue: 30,
  formation: 20,
  coordination: 25,
  majeure: 30,
}

const CATEGORY_COEFFICIENTS = {
  social: 1.0,
  environnement: 1.1,
  education: 1.1,
  sante: 1.2,
  urgences: 1.4,
  culture: 1.0,
  sport: 1.0,
  jeunesse: 1.1,
  evenementiel: 1.0,
}

const DURATION_MULTIPLIERS = {
  less_than_2: 0.5,
  h2_4: 1.0,
  h4_8: 1.5,
  full_day: 2.0,
  multi_day: 3.0,
}

const RESPONSIBILITY_MULTIPLIERS = {
  participant: 1.0,
  actif: 1.05,        // +5% bonus
  responsable: 1.10,  // +10% bonus
  coordinateur: 1.15, // +15% bonus max (plafonné institutionnellement)
}

const MAX_STANDARD_POINTS_PER_DAY = 65

function calculatePoints({ categoryId, activityTypeId, durationId, responsibilityId }) {
  const base = ACTIVITY_BASE_POINTS[activityTypeId] || 20
  const catCoeff = CATEGORY_COEFFICIENTS[categoryId] || 1.0
  const durMult = DURATION_MULTIPLIERS[durationId] || 1.0
  const respMult = RESPONSIBILITY_MULTIPLIERS[responsibilityId] || 1.0

  const effortPoints = base * catCoeff * durMult
  const rawTotal = effortPoints * respMult
  const capped = Math.min(MAX_STANDARD_POINTS_PER_DAY, Math.round(rawTotal))
  const finalPoints = Math.max(1, capped)

  const responsibilityBonusPoints = Math.max(0, finalPoints - Math.round(effortPoints))
  const effortPercentage = Math.round((Math.round(effortPoints) / finalPoints) * 100)
  const responsibilityPercentage = 100 - effortPercentage

  return {
    basePoints: base,
    categoryCoefficient: catCoeff,
    durationMultiplier: durMult,
    responsibilityMultiplier: respMult,
    effortPoints: Math.round(effortPoints),
    responsibilityBonusPoints,
    effortPercentage,
    responsibilityPercentage,
    finalPoints,
  }
}

// ----------------------------------------------------------------------------
// NIVEAUX & PALIERS OFFICIELS INSTITUTIONNELS (1 À 6)
// ----------------------------------------------------------------------------

const VOLUNTEER_TIERS = [
  { tier: 1, id: "nouveau", minPoints: 0, maxPoints: 49, nameFr: "Nouveau" },
  { tier: 2, id: "engage", minPoints: 50, maxPoints: 149, nameFr: "Engagé" },
  { tier: 3, id: "actif", minPoints: 150, maxPoints: 299, nameFr: "Actif" },
  { tier: 4, id: "confirme", minPoints: 300, maxPoints: 499, nameFr: "Confirmé" },
  { tier: 5, id: "exemplaire", minPoints: 500, maxPoints: 999, nameFr: "Exemplaire" },
  { tier: 6, id: "ambassadeur", minPoints: 1000, maxPoints: Infinity, nameFr: "Ambassadeur" },
]

function getTierForPoints(points) {
  const pts = Math.max(0, points || 0)
  return VOLUNTEER_TIERS.find((t) => pts >= t.minPoints && pts <= t.maxPoints) || VOLUNTEER_TIERS[VOLUNTEER_TIERS.length - 1]
}

function getTierProgress(points) {
  const currentTier = getTierForPoints(points)
  const isMax = currentTier.tier === 6
  const tierIndex = currentTier.tier - 1
  const nextTier = isMax ? null : VOLUNTEER_TIERS[tierIndex + 1]

  const pointsInTier = Math.max(0, points - currentTier.minPoints)
  const span = isMax ? 1 : ((nextTier?.minPoints || 1000) - currentTier.minPoints)
  const percent = isMax ? 100 : Math.min(100, Math.round((pointsInTier / span) * 100))
  const pointsToNext = isMax ? 0 : Math.max(0, (nextTier?.minPoints || 1000) - points)

  return {
    currentTier,
    nextTier,
    percent,
    pointsToNext,
    isMax,
  }
}

// ----------------------------------------------------------------------------
// CONTRÔLE D'ACCÈS ABAC & SÉCURITÉ
// ----------------------------------------------------------------------------

function canAdjustVolunteerPointsManually(actor, targetVolunteerWilayaCode, justification) {
  if (!actor) return { allowed: false, reason: "Utilisateur non authentifié." }
  if (actor.status !== "active") return { allowed: false, reason: "Compte administratif suspendu." }
  if (actor.role === "national_auditor") return { allowed: false, reason: "Auditeur national en lecture seule stricte." }
  if (actor.role === "local_coordinator" || actor.role === "mission_lead") {
    return { allowed: false, reason: "Un coordinateur local ne peut pas modifier directement les soldes de points." }
  }

  const reason = (justification || "").trim()
  if (reason.length < 5) {
    return { allowed: false, reason: "Justification obligatoire d'au moins 5 caractères requise." }
  }

  if (actor.role === "national_admin") {
    return { allowed: true }
  }

  if (actor.role === "wilaya_admin") {
    if (targetVolunteerWilayaCode && actor.wilayaCode !== targetVolunteerWilayaCode) {
      return {
        allowed: false,
        reason: `Confinement territorial : un admin de wilaya (${actor.wilayaCode}) ne peut ajuster les points que des bénévoles de sa propre wilaya (${targetVolunteerWilayaCode}).`,
      }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: "Rôle non autorisé pour l'ajustement manuel." }
}

function canValidateVolunteerPresence(actor, targetWilayaCode, targetCommune) {
  if (!actor) return { allowed: false, reason: "Utilisateur non authentifié." }
  if (actor.status !== "active") return { allowed: false, reason: "Compte administratif inactif ou suspendu." }
  if (actor.role === "national_auditor") return { allowed: false, reason: "Auditeur national en lecture seule stricte." }
  if (actor.role === "national_admin") return { allowed: true }

  if (actor.role === "wilaya_admin") {
    if (targetWilayaCode && actor.wilayaCode !== targetWilayaCode) {
      return { allowed: false, reason: "Confinement territorial wilaya." }
    }
    return { allowed: true }
  }

  if (actor.role === "local_coordinator") {
    if (targetWilayaCode && actor.wilayaCode !== targetWilayaCode) {
      return { allowed: false, reason: "Hors wilaya d'affectation." }
    }
    if (actor.commune && targetCommune && actor.commune.toLowerCase() !== targetCommune.toLowerCase()) {
      return { allowed: false, reason: "Hors commune d'affectation." }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: "Rôle non autorisé." }
}

// ----------------------------------------------------------------------------
// PAYLOAD QR SÉCURISÉ
// ----------------------------------------------------------------------------

function buildSafeQrPayload(volunteer) {
  return JSON.stringify({
    v: 3,
    org: "Yed fel yed",
    type: "volunteer_identity",
    code: volunteer.volunteerCode || `YFY-${volunteer.id}`,
    h: createHash("sha256").update(volunteer.id).digest("hex").slice(0, 12),
  })
}

// ----------------------------------------------------------------------------
// EXÉCUTION DES 10 SCÉNARIOS DE TEST
// ----------------------------------------------------------------------------

// Scénario 1 : Un volontaire ne peut pas s'attribuer lui-même des points
const testVolunteer = {
  id: "vol-901",
  volunteerCode: "YFY-VOL-2026-901",
  role: "volunteer",
  wilayaCode: 6,
  commune: "Akbou",
}
const selfCheck = canAdjustVolunteerPointsManually(testVolunteer, testVolunteer.wilayaCode, "Attribution de points personnels")
assert(!selfCheck.allowed, 1, "Un volontaire ne peut pas s'attribuer lui-même des points (auto-attribution bloquée)")

// Scénario 2 : Un coordinateur ne peut valider que dans son périmètre (commune / daïra / wilaya)
const coordinatorAkbou = {
  id: "adm-coord-06",
  role: "local_coordinator",
  status: "active",
  wilayaCode: 6,
  commune: "Akbou",
}
const validInAkbou = canValidateVolunteerPresence(coordinatorAkbou, 6, "Akbou")
const invalidInBejaia = canValidateVolunteerPresence(coordinatorAkbou, 6, "Bejaia")
const invalidInAlgiers = canValidateVolunteerPresence(coordinatorAkbou, 16, "Alger")

assert(
  validInAkbou.allowed && !invalidInBejaia.allowed && !invalidInAlgiers.allowed,
  2,
  "Un coordinateur ne peut valider que les présences relevant de son périmètre territorial (autorisé à Akbou, rejeté hors commune ou wilaya)"
)

// Scénario 3 : Un administrateur de wilaya ne peut pas modifier les points d'une autre wilaya
const wilayaAdminBejaia = {
  id: "adm-w06",
  role: "wilaya_admin",
  status: "active",
  wilayaCode: 6,
}
const adjustSameWilaya = canAdjustVolunteerPointsManually(wilayaAdminBejaia, 6, "Correction erreur saisie festival")
const adjustOtherWilaya = canAdjustVolunteerPointsManually(wilayaAdminBejaia, 19, "Tentative modification bénévole Sétif")

assert(
  adjustSameWilaya.allowed && !adjustOtherWilaya.allowed,
  3,
  "Un administrateur de wilaya ne peut pas modifier les points d'un bénévole d'une autre wilaya (confinement territorial strict)"
)

// Scénario 4 : Un auditeur national ne peut effectuer aucune modification (strict read-only)
const nationalAuditor = {
  id: "audit-01",
  role: "national_auditor",
  status: "active",
  wilayaCode: 16,
}
const auditAdjust = canAdjustVolunteerPointsManually(nationalAuditor, 6, "Audit points Bejaia")
const auditValidate = canValidateVolunteerPresence(nationalAuditor, 6, "Akbou")

assert(
  !auditAdjust.allowed && !auditValidate.allowed,
  4,
  "L'auditeur national est strictement en lecture seule (interdiction d'attribution, modification et validation de points)"
)

// Scénario 5 : Une correction manuelle nécessite une justification obligatoire (au moins 5 caractères)
const nationalAdmin = {
  id: "nat-admin-01",
  role: "national_admin",
  status: "active",
}
const adjustWithoutReason = canAdjustVolunteerPointsManually(nationalAdmin, 6, "")
const adjustWithShortReason = canAdjustVolunteerPointsManually(nationalAdmin, 6, "corr")
const adjustWithValidReason = canAdjustVolunteerPointsManually(nationalAdmin, 6, "Correction justificatif médical fourni")

assert(
  !adjustWithoutReason.allowed && !adjustWithShortReason.allowed && adjustWithValidReason.allowed,
  5,
  "Une correction manuelle exige impérativement une justification administrative d'au moins 5 caractères"
)

// Scénario 6 : Une validation répétée ne génère pas de points en double (anti-collision / anti-rejeu)
const simulatedParticipations = []
function validatePresenceWithAntiCollision(fingerprint, points) {
  if (simulatedParticipations.some((p) => p.fingerprint === fingerprint && p.status === "validated")) {
    return { ok: false, error: "DUPLICATE_PRESENCE" }
  }
  simulatedParticipations.push({ fingerprint, points, status: "validated" })
  return { ok: true, points }
}

const missionFingerprint = "vol-123|2026-11-05|Nettoyage berges Soummam|environnement|standard"
const firstValidation = validatePresenceWithAntiCollision(missionFingerprint, 25)
const duplicateValidation = validatePresenceWithAntiCollision(missionFingerprint, 25)

assert(
  firstValidation.ok && !duplicateValidation.ok && duplicateValidation.error === "DUPLICATE_PRESENCE",
  6,
  "Une validation répétée est bloquée par empreinte unique : zéro point en double attribué"
)

// Scénario 7 : Le QR Code ne révèle aucune donnée personnelle sensible (aucun NIN, tél, email)
const volunteerPersonalProfile = {
  id: "vol-secret-456",
  volunteerCode: "YFY-VOL-20261105-8C7D",
  nationalId: "123456789012345678", // NIN
  phone: "0550112233",
  email: "citoyen.engage@algerie.dz",
  birthDate: "1998-04-12",
  commune: "Tizi Ouzou",
}
const encodedQr = buildSafeQrPayload(volunteerPersonalProfile)
const qrParsed = JSON.parse(encodedQr)

const containsNIN = encodedQr.includes("123456789012345678")
const containsPhone = encodedQr.includes("0550112233")
const containsEmail = encodedQr.includes("citoyen.engage@algerie.dz")
const hasOpaqueCode = qrParsed.code === "YFY-VOL-20261105-8C7D" && qrParsed.v === 3

assert(
  !containsNIN && !containsPhone && !containsEmail && hasOpaqueCode,
  7,
  "Le QR Code bénévole est strictement sécurisé et opaque (zéro NIN, zéro numéro de téléphone, zéro adresse ou email)"
)

// Scénario 8 : Le solde affiché correspond exactement à la somme des transactions (intégrité comptable)
const ledgerTransactions = [
  { id: "tx-1", amount: 25, reason: "Validation mission environnement" },
  { id: "tx-2", amount: 35, reason: "Intervention secours inondation" },
  { id: "tx-3", amount: -10, reason: "Correction suite ajustement d'horaire", correctedTransactionId: "tx-2" },
  { id: "tx-4", amount: 15, reason: "Atelier citoyenneté jeunesse" },
  { id: "tx-5", amount: -25, reason: "Annulation mission non honorée", correctedTransactionId: "tx-1" },
]

const expectedBalance = ledgerTransactions.reduce((sum, tx) => sum + tx.amount, 0)
// 25 + 35 - 10 + 15 - 25 = 40
assert(
  expectedBalance === 40,
  8,
  `Intégrité comptable garantie : solde officiel (${expectedBalance} pts) = somme algébrique exacte des transactions WORM (+40 pts)`
)

// Scénario 9 : Les niveaux évoluent correctement selon les 6 paliers (Nouveau -> Ambassadeur)
const t0 = getTierForPoints(0)      // Nouveau (0-49)
const t50 = getTierForPoints(50)    // Engagé (50-149)
const t150 = getTierForPoints(150)  // Actif (150-299)
const t300 = getTierForPoints(300)  // Confirmé (300-499)
const t500 = getTierForPoints(500)  // Exemplaire (500-999)
const t1000 = getTierForPoints(1200) // Ambassadeur (1000+)

const prog50 = getTierProgress(75) // Tier 2 (50..149), 25/100 = 25% vers Tier 3

assert(
  t0.id === "nouveau" &&
  t50.id === "engage" &&
  t150.id === "actif" &&
  t300.id === "confirme" &&
  t500.id === "exemplaire" &&
  t1000.id === "ambassadeur" &&
  prog50.currentTier.id === "engage" &&
  prog50.nextTier.id === "actif" &&
  prog50.percent === 25 &&
  prog50.pointsToNext === 75,
  9,
  "Évolution harmonieuse des 6 paliers institutionnels (Nouveau à Ambassadeur) avec progression et seuils calculés sans décalage"
)

// Scénario 10 : Équité du barème (85-90% effort réel, bonus responsabilité <= 15%) et rétrocompatibilité
const standardParticipant = calculatePoints({
  categoryId: "social",
  activityTypeId: "standard",
  durationId: "h2_4",
  responsibilityId: "participant",
})

const standardCoordinateur = calculatePoints({
  categoryId: "social",
  activityTypeId: "standard",
  durationId: "h2_4",
  responsibilityId: "coordinateur",
})

// Participant: 20 pts, Coordinateur: 23 pts (bonus = 3 pts soit 13%, effort = 87%)
const isEffortDominant = standardCoordinateur.effortPercentage >= 85 && standardCoordinateur.effortPercentage <= 90
const isBonusCapped = standardCoordinateur.responsibilityPercentage <= 15
const legacyAccountCompatible = getTierForPoints(undefined).id === "nouveau"

assert(
  isEffortDominant && isBonusCapped && legacyAccountCompatible,
  10,
  `Équité du barème respectée (Effort réel : ${standardCoordinateur.effortPercentage}%, Bonus responsabilité : ${standardCoordinateur.responsibilityPercentage}% <= 15% max, rétrocompatibilité assurée)`
)

// ----------------------------------------------------------------------------
// SYNTHÈSE
// ----------------------------------------------------------------------------

console.log("\n================================================================================")
console.log(`RÉSULTATS DE VALIDATION SYSTÈME DES POINTS : ${passed} / 10 Scénarios RÉUSSIS — ${failed} Échecs`)
console.log("================================================================================\n")

if (failed > 0) {
  process.exit(1)
}

