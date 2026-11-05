/**
 * ============================================================================
 * TEST COMPLET DE L'ÉCOSYSTÈME DE BÉNÉVOLAT INTELLIGENT ET INTERACTIF
 * Vérification des 12 piliers : Points, Badges, Tiers, QR Présence, Rapports, Audit
 * ============================================================================
 */

import assert from "node:assert/strict"

// 1. Charger et tester la logique des modules
import {
  DEFAULT_POINT_RULES,
  getPointsForAction,
  executeAwardPoints,
  executeAdminPointsCorrection,
  isDuplicateTransaction,
} from "../src/lib/pointsEngine.ts"

import {
  OFFICIAL_BADGES,
  computeVolunteerBadgesProgress,
  evaluateAndAwardBadges,
} from "../src/lib/badgeEngine.ts"

import {
  executeCheckIn,
  executeCheckOut,
  executeManualPresenceValidation,
  resolveVolunteer,
} from "../src/lib/presenceEngine.ts"

import {
  executeSubmitMissionReport,
  executeReviewMissionReport,
} from "../src/lib/missionReportChain.ts"

import {
  addNotification,
  markAsRead,
  markAllAsRead,
  getVolunteerNotifications,
  countUnreadNotifications,
} from "../src/lib/notificationEngine.ts"

import {
  VOLUNTEER_TIERS,
  getLevelProgress,
  getVolunteerTier,
} from "../src/lib/levels.ts"

import { seedData } from "../src/lib/storage.ts"

console.log("==================================================================")
console.log("   DÉBUT DES TESTS DE L'ÉCOSYSTÈME YED FEL YED")
console.log("==================================================================")

let totalTests = 0
let passedTests = 0

function test(description, fn) {
  totalTests++
  try {
    fn()
    passedTests++
    console.log(`  [OK] ${description}`)
  } catch (err) {
    console.error(`  [FAIL] ${description}`)
    console.error(`         ${err.message}`)
    process.exitCode = 1
  }
}

// --------------------------------------------------------------------------
// TEST 1 : Barèmes de points par défaut
// --------------------------------------------------------------------------
test("1. Barèmes officiels de points par défaut", () => {
  assert.equal(getPointsForAction("registration_validated", DEFAULT_POINT_RULES), 5)
  assert.equal(getPointsForAction("presence_confirmed", DEFAULT_POINT_RULES), 10)
  assert.equal(getPointsForAction("mission_completed", DEFAULT_POINT_RULES), 30)
  assert.equal(getPointsForAction("report_accepted", DEFAULT_POINT_RULES), 15)
  assert.equal(getPointsForAction("critical_bonus", DEFAULT_POINT_RULES), 10)
  assert.equal(getPointsForAction("exceptional_bonus", DEFAULT_POINT_RULES), 20)
})

// --------------------------------------------------------------------------
// TEST 2 : Données initiales et comptes démo Béjaïa / Sétif / El Eulma
// --------------------------------------------------------------------------
test("2. Données initiales démo conformes aux 3 zones géographiques", () => {
  const allowedWilayas = [6, 19]
  const allowedCommunes = ["Béjaïa", "Akbou", "Sétif", "El Eulma"]

  for (const vol of seedData.volunteerAccounts) {
    assert.ok(allowedWilayas.includes(vol.wilayaCode), `Wilaya interdite: ${vol.wilayaCode}`)
    assert.ok(allowedCommunes.includes(vol.commune), `Commune interdite: ${vol.commune}`)
  }
})

// --------------------------------------------------------------------------
// TEST 3 : Résolution d'un bénévole par QR Code / Code public
// --------------------------------------------------------------------------
test("3. Résolution d'un bénévole par code public ou QR", () => {
  const amine = resolveVolunteer(seedData, "YFY-VOL-20261105-06AM")
  assert.ok(amine, "Amine doit être résolu")
  assert.equal(amine.firstName, "Amine")
  assert.equal(amine.commune, "Béjaïa")

  const yasmine = resolveVolunteer(seedData, "YFY-VOL-20261105-19YK")
  assert.ok(yasmine, "Yasmine doit être résolue")
  assert.equal(yasmine.firstName, "Yasmine")
  assert.equal(yasmine.commune, "Sétif")
})

// --------------------------------------------------------------------------
// TEST 4 : Pointage de présence (Check-in) et attribution immédiate de 10 points
// --------------------------------------------------------------------------
test("4. Check-in QR : Horodatage et crédit automatique de 10 points", () => {
  let appData = structuredClone(seedData)
  const initialAminePts = appData.volunteerAccounts.find((v) => v.id === "demo-vol-amine").points

  const { nextData, result } = executeCheckIn(appData, {
    volunteerCodeOrId: "YFY-VOL-20261105-06AM",
    targetType: "event",
    targetId: "test-mission-01",
    targetTitle: "Test Mission Terrain",
    wilayaCode: 6,
    commune: "Béjaïa",
    scanner: { id: "admin-01", name: "Karima B.", role: "wilaya_admin", wilayaCode: 6 },
  })

  assert.equal(result.success, true)
  assert.equal(result.pointsAwarded, 10)

  const updatedAmine = nextData.volunteerAccounts.find((v) => v.id === "demo-vol-amine")
  assert.equal(updatedAmine.points, initialAminePts + 10)

  // Vérifier la présence d'une notification
  const notifs = getVolunteerNotifications(nextData, "demo-vol-amine")
  const checkInNotif = notifs.find((n) => n.type === "presence_confirmed")
  assert.ok(checkInNotif, "Notification de présence créée")
  assert.equal(checkInNotif.points, 10)
})

// --------------------------------------------------------------------------
// TEST 5 : Anti-doublon strict lors du check-in le même jour
// --------------------------------------------------------------------------
test("5. Anti-doublon check-in : refus du 2ème pointage le même jour", () => {
  let appData = structuredClone(seedData)

  const first = executeCheckIn(appData, {
    volunteerCodeOrId: "YFY-VOL-20261105-06AM",
    targetType: "event",
    targetId: "test-mission-same-day",
    targetTitle: "Même Mission",
    wilayaCode: 6,
    commune: "Béjaïa",
  })
  assert.equal(first.result.success, true)
  assert.equal(first.result.pointsAwarded, 10)

  // 2ème tentative immédiate
  const second = executeCheckIn(first.nextData, {
    volunteerCodeOrId: "YFY-VOL-20261105-06AM",
    targetType: "event",
    targetId: "test-mission-same-day",
    targetTitle: "Même Mission",
    wilayaCode: 6,
    commune: "Béjaïa",
  })
  assert.equal(second.result.alreadyCheckedIn, true)
  assert.equal(second.result.pointsAwarded, 0)
})

// --------------------------------------------------------------------------
// TEST 6 : Check-out et calcul de la durée d'intervention
// --------------------------------------------------------------------------
test("6. Check-out : Horodatage de départ et calcul d'heures", () => {
  let appData = structuredClone(seedData)
  const checkInRes = executeCheckIn(appData, {
    volunteerCodeOrId: "YFY-VOL-20261105-19YK",
    targetType: "event",
    targetId: "test-mission-duration",
    targetTitle: "Mission Forêt Zenadia",
    wilayaCode: 19,
    commune: "Sétif",
  })

  const recordId = checkInRes.result.record.id
  const checkOutRes = executeCheckOut(checkInRes.nextData, recordId)
  assert.equal(checkOutRes.success, true)
  assert.ok(checkOutRes.durationHours >= 0.5, "Durée minimale calculée")

  const updatedRecord = checkOutRes.nextData.presenceRecords.find((r) => r.id === recordId)
  assert.equal(updatedRecord.status, "checked_out")
  assert.ok(updatedRecord.checkOutAt)
})

// --------------------------------------------------------------------------
// TEST 7 : Validation manuelle de secours avec motif obligatoire
// --------------------------------------------------------------------------
test("7. Validation manuelle de secours avec justificatif", () => {
  let appData = structuredClone(seedData)
  const admin = {
    id: "demo-user-wil-19",
    firstName: "Tarek",
    lastName: "Mansouri",
    role: "wilaya_admin",
    wilayaCode: 19,
  }

  // Échec si motif trop court
  const failRes = executeManualPresenceValidation(appData, {
    volunteerId: "demo-vol-walid",
    targetType: "event",
    targetId: "test-manual-01",
    targetTitle: "Caravane El Eulma",
    wilayaCode: 19,
    commune: "El Eulma",
    reason: "bad", // < 5 caractères
    admin,
  })
  assert.equal(failRes.result.success, false)

  // Succès avec motif valable
  const okRes = executeManualPresenceValidation(appData, {
    volunteerId: "demo-vol-walid",
    targetType: "event",
    targetId: "test-manual-01",
    targetTitle: "Caravane El Eulma",
    wilayaCode: 19,
    commune: "El Eulma",
    reason: "Smartphone déchargé, présence physique confirmée à l'accueil",
    admin,
  })
  assert.equal(okRes.result.success, true)
  assert.equal(okRes.result.pointsAwarded, 10)
})

// --------------------------------------------------------------------------
// TEST 8 : Chaîne de rapport de mission (Soumission -> Audit -> Récompenses)
// --------------------------------------------------------------------------
test("8. Chaîne complète : Rapport soumis -> Audit -> Distribution +15 et +30 points", () => {
  let appData = structuredClone(seedData)

  const lead = {
    id: "demo-user-lead-01",
    firstName: "Sofiane",
    lastName: "Belkacemi",
    role: "mission_lead",
    wilayaCode: 6,
  }

  const auditor = {
    id: "demo-user-aud-01",
    firstName: "Rachid",
    lastName: "Hamidi",
    role: "national_auditor",
    wilayaCode: 0,
  }

  // 1. Check-in d'Amine et Nabila sur cette mission
  const missionId = "test-chain-mission-99"
  const m1 = executeCheckIn(appData, {
    volunteerCodeOrId: "demo-vol-amine",
    targetType: "event",
    targetId: missionId,
    targetTitle: "Grande Opération de Solidarité",
    wilayaCode: 6,
    commune: "Béjaïa",
  })
  const m2 = executeCheckIn(m1.nextData, {
    volunteerCodeOrId: "demo-vol-nabila",
    targetType: "event",
    targetId: missionId,
    targetTitle: "Grande Opération de Solidarité",
    wilayaCode: 6,
    commune: "Béjaïa",
  })

  // 2. Soumission du rapport par le chef de mission
  const submitRes = executeSubmitMissionReport(m2.nextData, {
    missionId,
    missionType: "event",
    title: "Rapport : Grande Opération de Solidarité",
    wilayaCode: 6,
    commune: "Béjaïa",
    missionDate: "2026-11-05",
    attendeesCount: 2,
    hoursCompleted: 5,
    summary: "Distribution et nettoyage coordonnés avec succès sur la corniche.",
    achievements: ["Objectif atteint", "Zéro incident"],
    author: lead,
  })
  assert.equal(submitRes.report.status, "submitted")

  // 3. Validation par l'auditeur national
  const preAmine = submitRes.nextData.volunteerAccounts.find((v) => v.id === "demo-vol-amine").points
  const reviewRes = executeReviewMissionReport(submitRes.nextData, {
    reportId: submitRes.report.id,
    decision: "validated",
    reviewNote: "Audit complet certifié conforme.",
    reviewer: auditor,
  })

  assert.equal(reviewRes.success, true)
  assert.ok(reviewRes.pointsAwardedCount >= 2)

  // Amine doit avoir reçu +30 points de complétion de mission
  const postAmine = reviewRes.nextData.volunteerAccounts.find((v) => v.id === "demo-vol-amine").points
  assert.equal(postAmine, preAmine + 30)

  // Notifications générées pour mission_completed
  const notifs = getVolunteerNotifications(reviewRes.nextData, "demo-vol-amine")
  const missionNotif = notifs.find((n) => n.type === "mission_completed")
  assert.ok(missionNotif, "Notification de mission complétée présente")
  assert.equal(missionNotif.points, 30)
})

// --------------------------------------------------------------------------
// TEST 9 : Système de 10 Badges et calcul de progression
// --------------------------------------------------------------------------
test("9. Les 10 Badges officiels calculés dynamiquement", () => {
  assert.equal(OFFICIAL_BADGES.length, 10, "Exactement 10 badges officiels")

  const amine = seedData.volunteerAccounts.find((v) => v.id === "demo-vol-amine")
  const amineBadges = computeVolunteerBadgesProgress(amine, seedData.participations)
  assert.equal(amineBadges.length, 10)

  // Amine a plus de 1 mission validée -> "Premier Pas" doit être débloqué
  const premierPas = amineBadges.find((b) => b.id === "premier_pas")
  assert.equal(premierPas.isEarned, true)
  assert.equal(premierPas.percent, 100)

  // Nabila a plus de 1000 points -> "Légende Solidaire" doit être débloqué
  const nabila = seedData.volunteerAccounts.find((v) => v.id === "demo-vol-nabila")
  const nabilaBadges = computeVolunteerBadgesProgress(nabila, seedData.participations)
  const legende = nabilaBadges.find((b) => b.id === "legende_solidaire")
  assert.equal(legende.isEarned, true)
})

// --------------------------------------------------------------------------
// TEST 10 : Paliers officiels (6 Tiers) et promotion de niveau
// --------------------------------------------------------------------------
test("10. Grille des 6 Paliers (N0 à N5) et détection de palier", () => {
  assert.equal(VOLUNTEER_TIERS.length, 6)

  assert.equal(getVolunteerTier(0).id, "nouveau") // 0-49 pts
  assert.equal(getVolunteerTier(40).id, "nouveau")
  assert.equal(getVolunteerTier(50).id, "engage") // 50-149 pts
  assert.equal(getVolunteerTier(150).id, "actif") // 150-299 pts
  assert.equal(getVolunteerTier(340).id, "confirme") // 300-499 pts
  assert.equal(getVolunteerTier(550).id, "exemplaire") // 500-999 pts
  assert.equal(getVolunteerTier(1450).id, "ambassadeur") // 1000+ pts

  const p = getLevelProgress(100)
  assert.equal(p.tierId, "engage")
  assert.equal(p.nextTierName, "Actif")
  assert.equal(p.remaining, 50) // 150 - 100 = 50 pts
})

// --------------------------------------------------------------------------
// TEST 11 : Correction administrative manuelle avec audit trail obligatoire
// --------------------------------------------------------------------------
test("11. Correction administrative de points avec justification et journalisation", () => {
  let appData = structuredClone(seedData)
  const admin = {
    id: "demo-user-nat-01",
    firstName: "Mustapha",
    lastName: "Belkacem",
    role: "national_admin",
    wilayaCode: 0,
  }

  const { nextData, result } = executeAdminPointsCorrection(
    appData,
    "demo-vol-walid",
    25,
    "Régularisation après vérification des feuilles d'émargement de la caravane",
    admin
  )

  assert.equal(result.success, true)
  assert.equal(result.transaction.status, "corrected")
  assert.equal(result.transaction.amount, 25)
  assert.equal(result.transaction.authorRole, "national_admin")
})

// --------------------------------------------------------------------------
// TEST 12 : Système de notifications en temps réel
// --------------------------------------------------------------------------
test("12. Notifications : ajout, lecture individuelle et lecture globale", () => {
  let appData = structuredClone(seedData)

  const { nextData, notification } = addNotification(appData, {
    volunteerId: "demo-vol-walid",
    type: "admin_message",
    title: "Bienvenue sur Yed Fel Yed",
    message: "Votre compte est actif à El Eulma.",
  })

  assert.equal(notification.read, false)
  const unreadBefore = countUnreadNotifications(nextData, "demo-vol-walid")
  assert.ok(unreadBefore >= 1)

  const markedOne = markAsRead(nextData, notification.id)
  const notifFound = markedOne.notifications.find((n) => n.id === notification.id)
  assert.equal(notifFound.read, true)

  const markedAll = markAllAsRead(nextData, "demo-vol-walid")
  const unreadAfter = countUnreadNotifications(markedAll, "demo-vol-walid")
  assert.equal(unreadAfter, 0)
})

console.log("==================================================================")
console.log(`   RÉSULTAT : ${passedTests} / ${totalTests} TESTS RÉUSSIS AVEC SUCCÈS !`)
console.log("==================================================================")

