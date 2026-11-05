/**
 * ============================================================================
 * SUITE DE VALIDATION DU SYSTÈME DE COMPTES BÉNÉVOLES & RÉCOMPENSES
 * Plateforme Nationale Algérienne Yed Fel Yed (يد في يد)
 * ============================================================================
 */

const VOLUNTEER_TIERS = [
  { level: 0, id: "nouveau", labelFr: "Nouveau", minPoints: 0, maxPoints: 49 },
  { level: 1, id: "engage", labelFr: "Engagé", minPoints: 50, maxPoints: 149 },
  { level: 2, id: "actif", labelFr: "Actif", minPoints: 150, maxPoints: 299 },
  { level: 3, id: "confirme", labelFr: "Confirmé", minPoints: 300, maxPoints: 499 },
  { level: 4, id: "exemplaire", labelFr: "Exemplaire", minPoints: 500, maxPoints: 999 },
  { level: 5, id: "ambassadeur", labelFr: "Ambassadeur", minPoints: 1000, maxPoints: null },
]

function getVolunteerTier(points = 0) {
  const pts = Math.max(0, Math.floor(points) || 0)
  for (let i = VOLUNTEER_TIERS.length - 1; i >= 0; i--) {
    if (pts >= VOLUNTEER_TIERS[i].minPoints) {
      return VOLUNTEER_TIERS[i]
    }
  }
  return VOLUNTEER_TIERS[0]
}

function getLevelProgress(totalPoints) {
  const pts = Math.max(0, Math.floor(totalPoints) || 0)
  const currentTier = getVolunteerTier(pts)
  const tierIndex = currentTier.level
  const levelNumber = tierIndex + 1
  const nextTier = VOLUNTEER_TIERS[tierIndex + 1] ?? null

  if (!nextTier) {
    const currentInLevel = pts - currentTier.minPoints
    return {
      level: 6,
      currentTier,
      nextTier: null,
      currentInLevel,
      neededForLevel: 1000,
      percent: 100,
      totalPoints: pts,
      remaining: 0,
      nextTierName: null,
      isMaxLevel: true,
    }
  }

  const range = nextTier.minPoints - currentTier.minPoints
  const currentInLevel = pts - currentTier.minPoints
  const percent = range > 0 ? Math.min(100, Math.max(0, Math.round((currentInLevel / range) * 100))) : 0

  return {
    level: levelNumber,
    currentTier,
    nextTier,
    currentInLevel,
    neededForLevel: range,
    percent,
    totalPoints: pts,
    remaining: Math.max(0, nextTier.minPoints - pts),
    nextTierName: nextTier.labelFr,
    isMaxLevel: false,
  }
}

function calculateVolunteerPoints(params) {
  const baseMap = { ponctuelle: 5, courte: 10, standard: 20, longue: 30, formation: 20, coordination: 25 }
  const durationMap = { h1_2: 1.0, h2_4: 1.0, h4_8: 1.2, plus_8: 1.5 }
  const respMap = { participant: 1.0, actif: 1.1, encadrant: 1.3, coordinateur: 1.4 }
  const catMap = { urgences: 1.4, sante: 1.2, environnemental: 1.1, educatif: 1.1, social: 1.0, scoutisme: 1.0, evenementiel: 1.0 }

  const base = baseMap[params.activityTypeId] || 20
  const cat = catMap[params.categoryId] || 1.0
  const dur = durationMap[params.durationId] || 1.0
  const resp = respMap[params.responsibilityId] || 1.0

  const calculated = base * cat * dur * resp
  return {
    basePoints: base,
    categoryCoefficient: cat,
    durationCoefficient: dur,
    responsibilityMultiplier: resp,
    finalPoints: Math.round(calculated),
  }
}

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`)
    passed++
  } else {
    console.error(`✗ FAIL: ${message}`)
    failed++
  }
}

console.log("=== TESTS SYSTÈME DE COMPTES BÉNÉVOLES & RÉCOMPENSES ===")

// 1. Calcul des niveaux et progression
const p0 = getLevelProgress(0)
assert(p0.level === 1 && p0.currentInLevel === 0 && p0.percent === 0, "0 points = Niveau 1 (0%)")

const p50 = getLevelProgress(50)
assert(p50.level === 2 && p50.currentInLevel === 0, "50 points débloque le Niveau 2")

const p200 = getLevelProgress(200)
assert(p200.level === 3, "200 points débloque le Niveau 3")

const tier0 = getVolunteerTier(30)
assert(tier0.id === "nouveau", "30 points = Palier 'nouveau'")

const tier1 = getVolunteerTier(80)
assert(tier1.id === "engage", "80 points = Palier 'engage'")

const tier2 = getVolunteerTier(200)
assert(tier2.id === "actif", "200 points = Palier 'actif'")

const tier3 = getVolunteerTier(350)
assert(tier3.id === "confirme", "350 points = Palier 'confirme'")

const tier4 = getVolunteerTier(600)
assert(tier4.id === "exemplaire", "600 points = Palier 'exemplaire'")

const tier5 = getVolunteerTier(1200)
assert(tier5.id === "ambassadeur", "1200 points = Palier 'ambassadeur'")

// 2. Attribution de points avec coefficient d'urgence SOS (coeff 1.4)
const sosPts = calculateVolunteerPoints({
  categoryId: "urgences",
  activityTypeId: "standard",
  durationId: "h4_8",
  responsibilityId: "actif",
})
assert(sosPts.categoryCoefficient === 1.4, "Catégorie urgences applique bien le multiplicateur 1.4")
assert(sosPts.finalPoints > 0, `Points calculés pour mission urgences: ${sosPts.finalPoints} pts`)

// 3. Validation de sécurité du QR Code (aucun champ sensible)
const dummyVolunteer = {
  id: "vol-1234",
  volunteerCode: "YFY-VOL-20261104-9B3E",
  firstName: "Karim",
  lastName: "Benali",
  email: "karim.benali@exemple.dz",
  phone: "0550123456",
  nationalId: "123456789012345678",
  passwordHash: "secret123",
  createdAt: "2026-11-04T12:00:00Z",
}

const safeQrPayload = JSON.stringify({
  v: 1,
  org: "Yed fel yed",
  type: "volunteer_badge",
  code: dummyVolunteer.volunteerCode,
  name: `${dummyVolunteer.firstName} ${dummyVolunteer.lastName}`,
  joined: dummyVolunteer.createdAt.slice(0, 10),
})

const parsedQr = JSON.parse(safeQrPayload)
assert(parsedQr.code === dummyVolunteer.volunteerCode, "QR contient le volunteerCode public")
assert(!safeQrPayload.includes(dummyVolunteer.email), "QR ne contient PAS l'email")
assert(!safeQrPayload.includes(dummyVolunteer.phone), "QR ne contient PAS le téléphone")
assert(!safeQrPayload.includes(dummyVolunteer.nationalId), "QR ne contient PAS le NIN")
assert(!safeQrPayload.includes("secret"), "QR ne contient AUCUN mot de passe ou hash")

console.log(`\nTests terminés : ${passed} réussis, ${failed} échoués.`)
if (failed > 0) process.exit(1)
