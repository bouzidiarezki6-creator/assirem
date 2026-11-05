/**
 * ============================================================================
 * SUITE DE VALIDATION DU MODULE SOS — RÈGLES MÉTIER ET CAPACITÉS
 * Plateforme Nationale Algérienne Yed Fel Yed (يد في يد)
 * ============================================================================
 */

function calculateRemainingSlots(call) {
  const req = call.requiredSlots ?? 0
  const acc = call.acceptedCount ?? 0
  return Math.max(0, req - acc)
}

function isCallFull(call) {
  return calculateRemainingSlots(call) === 0
}

function calculateRemainingMaterial(need) {
  const req = need.requiredQuantity ?? 0
  const rec = need.receivedQuantity ?? 0
  return Math.max(0, req - rec)
}

function generateSosReference(prefix, id) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const cleanId = (id || "000000").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()
  return `SOS-${prefix}-${dateStr}-${cleanId}`
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
    formula: `${base} × ${cat} × ${dur} × ${resp} = ${calculated.toFixed(2)} → ${Math.round(calculated)}`
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

console.log("=== TESTS MODULE SOS — RÈGLES MÉTIER ET CAPACITÉS ===")

// 1. Calcul des places restantes
const openCall = { requiredSlots: 5, acceptedCount: 3 }
assert(calculateRemainingSlots(openCall) === 2, "calculateRemainingSlots(5, 3) === 2")
assert(!isCallFull(openCall), "Call is not full when 3 < 5")

const fullCall = { requiredSlots: 5, acceptedCount: 5 }
assert(calculateRemainingSlots(fullCall) === 0, "calculateRemainingSlots(5, 5) === 0")
assert(isCallFull(fullCall), "Call is full when 5 === 5")

// 2. Calcul des ressources matérielles
const need = { requiredQuantity: 500, receivedQuantity: 340 }
assert(calculateRemainingMaterial(need) === 160, "calculateRemainingMaterial(500, 340) === 160")

const satisfiedNeed = { requiredQuantity: 500, receivedQuantity: 550 }
assert(calculateRemainingMaterial(satisfiedNeed) === 0, "calculateRemainingMaterial(500, 550) === 0 (pas de négatif)")

// 3. Génération des références normalisées
const refMat = generateSosReference("MAT", "abc123xyz")
assert(refMat.startsWith("SOS-MAT-") && refMat.endsWith("ABC123"), `Reference MAT: ${refMat}`)

const refPro = generateSosReference("PRO", "def456uvw")
assert(refPro.startsWith("SOS-PRO-") && refPro.endsWith("DEF456"), `Reference PRO: ${refPro}`)

const refApp = generateSosReference("APP", "ghi789rst")
assert(refApp.startsWith("SOS-APP-") && refApp.endsWith("GHI789"), `Reference APP: ${refApp}`)

// 4. Calcul des points bénévoles pour le module SOS (catégorie urgences coeff 1.4)
const urgencyPts = calculateVolunteerPoints({
  categoryId: "urgences",
  activityTypeId: "standard",
  durationId: "h4_8",
  responsibilityId: "actif",
})

assert(urgencyPts.categoryCoefficient === 1.4, "Category coefficient urgences === 1.4")
assert(urgencyPts.finalPoints === 37, `Points calculés pour mission urgences: ${urgencyPts.finalPoints} pts`)
console.log(`Formule calculée : ${urgencyPts.formula}`)

console.log(`\nTests terminés : ${passed} réussis, ${failed} échoués.`)
if (failed > 0) process.exit(1)
