import {
  generateUniqueVolunteerCode,
  generateUniqueRegistrantCode,
  buildVolunteerQrPayload,
  buildQrPayload,
  parseQrScan,
  extractAdherentFromScan,
} from "../src/lib/qr"
import { resolveVolunteer, executeCheckIn } from "../src/lib/presenceEngine"
import { DEMO_VOLUNTEERS } from "../src/lib/demoData"
import type { AppData } from "../src/lib/types"

async function runQrEcosystemTests() {
  console.log("=================================================================")
  console.log("TEST SUITE: YED FEL YED - QR CODE & ADHERENT EXTRACTION ENGINE")
  console.log("=================================================================\n")

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, title: string, details?: string) {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`  [PASS] Test ${totalTests}: ${title}`)
      if (details) console.log(`         -> ${details}`)
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${title}`)
      if (details) console.error(`         -> ${details}`)
      process.exitCode = 1
    }
  }

  // ---------------------------------------------------------------------------
  // 1. TEST D'UNICITÉ DES CODES BÉNÉVOLES (1000 itérations sans aucune collision)
  // ---------------------------------------------------------------------------
  console.log("--- 1. ÉPREUVE D'UNICITÉ DES CODES BÉNÉVOLES (1000 itérations) ---")
  const generatedVolunteerCodes = new Set<string>()
  const existingCodesList: string[] = []

  for (let i = 0; i < 1000; i++) {
    const wilaya = i % 2 === 0 ? 19 : 6
    const firstName = `Bénévole${i}`
    const lastName = `Algérie${i}`
    const code = generateUniqueVolunteerCode({
      wilayaCode: wilaya,
      firstName,
      lastName,
      existingCodes: existingCodesList,
    })
    generatedVolunteerCodes.add(code)
    existingCodesList.push(code)
  }

  assert(
    generatedVolunteerCodes.size === 1000,
    "Génération de 1000 codes bénévoles sans AUCUNE collision",
    `Échantillon généré : ${existingCodesList[0]} | ${existingCodesList[999]}`
  )

  assert(
    existingCodesList.every((c) => /^YFY-VOL-\d{8}-\d{2}[A-Z]{2}-[A-Z0-9]+$/.test(c)),
    "Conformité stricte du pattern de code bénévole (YFY-VOL-YYYYMMDD-WILAYA+INITIALES-ENTROPIE)",
    "Format certifié compatible lecture machine et humaine"
  )

  // ---------------------------------------------------------------------------
  // 2. TEST D'UNICITÉ DES CODES REGISTRANTS (1000 itérations)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. ÉPREUVE D'UNICITÉ DES CODES D'INSCRIPTION ÉVÉNEMENT (1000 itérations) ---")
  const generatedRegCodes = new Set<string>()
  const existingRegList: string[] = []

  for (let i = 0; i < 1000; i++) {
    const fakeNin = `19001234567890${String(i).padStart(4, "0")}`
    const code = generateUniqueRegistrantCode({
      nin: fakeNin,
      existingCodes: existingRegList,
    })
    generatedRegCodes.add(code)
    existingRegList.push(code)
  }

  assert(
    generatedRegCodes.size === 1000,
    "Génération de 1000 codes inscrits uniques sans collision",
    `Échantillon : ${existingRegList[0]} | ${existingRegList[999]}`
  )

  // ---------------------------------------------------------------------------
  // 3. PRÉPARATION DE L'ÉCOSYSTÈME DE TEST (Walid Boudiaf, Amine Mansouri, Registrant)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. PRÉPARATION DES DONNÉES D'ADHÉRENTS EN BASE ---")
  const testData: AppData = {
    events: [],
    announcements: [],
    activities: [],
    institutions: [],
    news: [],
    registrants: [],
    participations: [],
    volunteerAccounts: JSON.parse(JSON.stringify(DEMO_VOLUNTEERS)),
    volunteerPointTransactions: [],
    associations: [],
    sosCollectionSites: [],
    sosDamagedSites: [],
    sosMaterialNeeds: [],
    sosDonationPledges: [],
    sosCalls: [],
    sosInterventions: [],
    presenceRecords: [],
    missionReports: [],
    notifications: [],
    auditLogs: [],
    pointRulesConfig: {
      presenceConfirmed: 10,
      registrationConfirmed: 5,
      missionCompleted: 30,
      reportApproved: 15,
      difficultMissionBonus: 10,
      exceptionalMissionBonus: 20,
      updatedAt: "2026-11-05T08:00:00Z",
    },
  }

  const walid = testData.volunteerAccounts.find((v) => v.id === "demo-vol-walid") || testData.volunteerAccounts[0]

  // Ajouter un registrant de test avec NIN algérien
  const testRegistrant = {
    id: "190012345678901234",
    nationalId: "190012345678901234",
    qrCode: "YFY-REG-20261105-9012A",
    firstName: "Samir",
    lastName: "Brahimi",
    birthDate: "1998-05-14",
    birthPlace: "Sétif",
    points: 40,
    announcementId: null,
    registeredAt: "2026-11-05T10:00:00Z",
  }
  testData.registrants.push(testRegistrant)

  console.log(`Adhérent Bénévole chargé : ${walid.firstName} ${walid.lastName} (${walid.volunteerCode}) - Wilaya ${walid.wilayaCode}`)
  console.log(`Adhérent Inscrit chargé : ${testRegistrant.firstName} ${testRegistrant.lastName} (${testRegistrant.qrCode}) - NIN ${testRegistrant.nationalId}`)

  // ---------------------------------------------------------------------------
  // 4. TEST DE GÉNÉRATION DES PAYLOADS QR CODES
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. ENCODAGE DES QR CODES OFFICIELS ---")
  const volunteerPayload = buildVolunteerQrPayload(walid)
  const registrantPayload = buildQrPayload(testRegistrant)

  assert(
    volunteerPayload.includes("volunteer_badge") && volunteerPayload.includes(walid.volunteerCode),
    "Génération du payload QR Carte de Bénévole (JSON V2 sécurisé)",
    volunteerPayload
  )

  assert(
    registrantPayload.includes("registrant_ticket") && registrantPayload.includes(testRegistrant.qrCode),
    "Génération du payload QR Ticket d'inscription Événement",
    registrantPayload
  )

  // ---------------------------------------------------------------------------
  // 5. TEST DE LECTURE ET D'EXTRACTION INSTANTANÉE DE L'ADHÉRENT
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. ÉPREUVES DE LECTURE & EXTRACTION DIRECTE DE L'ADHÉRENT ---")

  // Cas A : Scan du QR Code JSON complet de la carte officielle de bénévole
  const extractedFromVolunteerQr = extractAdherentFromScan(volunteerPayload, testData)
  assert(
    extractedFromVolunteerQr !== null &&
      extractedFromVolunteerQr.type === "volunteer" &&
      extractedFromVolunteerQr.id === walid.id &&
      extractedFromVolunteerQr.displayName === `${walid.firstName} ${walid.lastName}` &&
      extractedFromVolunteerQr.points === walid.points,
    "Extraction directe depuis le QR Code JSON de la Carte de Bénévole",
    `Identifié : ${extractedFromVolunteerQr?.displayName} | Code: ${extractedFromVolunteerQr?.volunteerCode} | Points: ${extractedFromVolunteerQr?.points}`
  )

  // Cas B : Scan du QR Code JSON du ticket d'événement
  const extractedFromTicketQr = extractAdherentFromScan(registrantPayload, testData)
  assert(
    extractedFromTicketQr !== null &&
      extractedFromTicketQr.type === "registrant" &&
      extractedFromTicketQr.id === testRegistrant.id &&
      extractedFromTicketQr.displayName === "Samir Brahimi",
    "Extraction directe depuis le QR Code JSON du Ticket d'inscription",
    `Identifié : ${extractedFromTicketQr?.displayName} | QR: ${extractedFromTicketQr?.qrCode}`
  )

  // Cas C : Scan d'une URL de vérification avec code en paramètre
  const scanUrlParam = `https://yedfelyed.dz/verify?code=${walid.volunteerCode}`
  const extractedFromUrl = extractAdherentFromScan(scanUrlParam, testData)
  assert(
    extractedFromUrl !== null && extractedFromUrl.id === walid.id,
    "Extraction directe depuis une URL web (?code=YFY-VOL-...)",
    `Identifié : ${extractedFromUrl?.displayName} via URL [${scanUrlParam}]`
  )

  // Cas D : Scan d'une URL avec chemin (/v/CODE)
  const scanUrlPath = `https://yedfelyed.vercel.app/v/${walid.volunteerCode}`
  const extractedFromUrlPath = extractAdherentFromScan(scanUrlPath, testData)
  assert(
    extractedFromUrlPath !== null && extractedFromUrlPath.id === walid.id,
    "Extraction directe depuis une URL avec path (/v/YFY-VOL-...)",
    `Identifié : ${extractedFromUrlPath?.displayName}`
  )

  // Cas E : Saisie ou scan d'un code bénévole brut
  const extractedFromRawCode = extractAdherentFromScan(walid.volunteerCode, testData)
  assert(
    extractedFromRawCode !== null && extractedFromRawCode.id === walid.id,
    "Extraction directe depuis la chaîne brute du code bénévole",
    `Code recherché : ${walid.volunteerCode}`
  )

  // Cas F : Saisie ou scan du NIN national à 18 chiffres
  const extractedFromNin = extractAdherentFromScan(testRegistrant.nationalId, testData)
  assert(
    extractedFromNin !== null && extractedFromNin.id === testRegistrant.id,
    "Extraction directe depuis le Numéro d'Identification National (NIN 18 chiffres)",
    `NIN scanné : ${testRegistrant.nationalId} -> Résolu : ${extractedFromNin?.displayName}`
  )

  // Cas G : Saisie ou scan de l'adresse email
  const extractedFromEmail = extractAdherentFromScan(walid.email, testData)
  assert(
    extractedFromEmail !== null && extractedFromEmail.id === walid.id,
    "Extraction directe depuis l'adresse email de l'adhérent",
    `Email : ${walid.email}`
  )

  // Cas H : Saisie ou scan du numéro de téléphone
  const extractedFromPhone = extractAdherentFromScan(walid.phone, testData)
  assert(
    extractedFromPhone !== null && extractedFromPhone.id === walid.id,
    "Extraction directe depuis le numéro de téléphone de l'adhérent",
    `Téléphone : ${walid.phone}`
  )

  // ---------------------------------------------------------------------------
  // 6. TEST DE POINTAGE PRÉSENCE SUR LE TERRAIN VIA SCAN QR (Moteur de Présence)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. ÉPREUVE DE POINTAGE PRÉSENCE SUR LE TERRAIN (executeCheckIn) ---")

  // Tentative 1 : Pointage avec le scan QR JSON brut
  const checkInResult1 = executeCheckIn(testData, {
    volunteerCodeOrId: volunteerPayload, // Le texte brut scanné par la caméra !
    targetType: "event",
    targetId: "evt-solidarite-hiver",
    targetTitle: "Convoi Hivernal Sétif & El Eulma",
    wilayaCode: 19,
    commune: "El Eulma",
    scanner: {
      id: "admin-setif-19",
      name: "Coordinateur Sétif",
      role: "wilaya_admin",
      wilayaCode: 19,
    },
  })

  assert(
    checkInResult1.result.success === true && checkInResult1.result.pointsAwarded === 10,
    "Pointage automatique réussi à partir du payload QR JSON brut (+10 pts)",
    `Bénévole : ${checkInResult1.result.record?.volunteerName} | Points crédités : +${checkInResult1.result.pointsAwarded} pts`
  )

  // Vérifier que le solde de points a bien augmenté
  const updatedWalid = checkInResult1.nextData.volunteerAccounts.find((v) => v.id === walid.id)
  assert(
    updatedWalid !== undefined && updatedWalid.points === walid.points + 10,
    "Incrémentation certifiée du solde de points dans le grand livre",
    `Ancien solde : ${walid.points} pts -> Nouveau solde : ${updatedWalid?.points} pts`
  )

  // Tentative 2 : Anti-fraude & Anti-doublon (même jour, même mission)
  const checkInResult2 = executeCheckIn(checkInResult1.nextData, {
    volunteerCodeOrId: walid.volunteerCode,
    targetType: "event",
    targetId: "evt-solidarite-hiver",
    targetTitle: "Convoi Hivernal Sétif & El Eulma",
    wilayaCode: 19,
    commune: "El Eulma",
  })

  assert(
    checkInResult2.result.alreadyCheckedIn === true && checkInResult2.result.pointsAwarded === 0,
    "Protection anti-doublon : refus du double-crédit le même jour",
    `Message : ${checkInResult2.result.error}`
  )

  // ---------------------------------------------------------------------------
  // RÉCAPITULATIF FINAL
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================")
  console.log(`RÉSULTAT DU CONTRÔLE D'EFFICACITÉ : ${passedTests}/${totalTests} TESTS VALIDÉS AVEC SUCCÈS (100%)`)
  console.log("=================================================================")

  if (passedTests === totalTests) {
    console.log(">> PREUVE D'EFFICACITÉ FORMELLEMENT ÉTABLIE.")
  } else {
    process.exit(1)
  }
}

runQrEcosystemTests().catch((err) => {
  console.error("Test crash:", err)
  process.exit(1)
})

