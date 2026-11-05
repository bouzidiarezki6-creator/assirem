/**
 * ============================================================================
 * UTILITAIRES CRYPTOGRAPHIQUES ET TRAÇABILITÉ IMMUABLE — YED FEL YED
 * Empreintes SHA-256, signature numérique interne, canonical JSON
 * et vérification de la chaîne de hachage du registre d'audit.
 * ============================================================================
 */

import type { AuditRegistryEntry, DigitalAttestation } from "./governanceTypes"

/**
 * Implémentation pure-TypeScript de SHA-256 (FIPS 180-4).
 * Fonctionne de manière synchrone et déterministe dans tous les environnements
 * (Navigateur, Node.js, Web Worker, SSR) sans dépendance externe.
 */
function sha256Sync(ascii: string): string {
  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  const lengthProperty = "length"
  let i = 0
  let j = 0
  let result = ""

  const words: number[] = []
  const asciiBitLength = ascii[lengthProperty] * 8

  // Initialisation des constantes de hachage (premiers 32 bits des racines carrées des 8 premiers nombres premiers)
  let hash: number[] = []
  let k: number[] = []
  let primeCounter = 0

  const isPrime = (n: number) => {
    for (let factor = 2, max = Math.sqrt(n); factor <= max; factor++) {
      if (n % factor === 0) return false
    }
    return true
  }

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0
      primeCounter++
    }
  }

  ascii += "\x80"
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00"
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i)
    if (j >> 8) return "" // caractères multi-octets non autorisés directement
    words[i >> 2] |= j << (((3 - i) % 4) * 8)
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0
  words[words[lengthProperty]] = asciiBitLength | 0

  // Boucle principale
  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16))
    const oldHash = hash
    hash = hash.slice(0, 8)

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15]
      const w2 = w[i - 2]

      const a = hash[0]
      const e = hash[4]

      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0)

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))

      hash = [(temp1 + temp2) | 0].concat(hash)
      hash[4] = (hash[4] + temp1) | 0
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255
      result += (byte < 16 ? "0" : "") + byte.toString(16)
    }
  }
  return result
}

function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount))
}

/**
 * Calcul d'empreinte SHA-256 déterministe
 */
export function computeSha256(content: string): string {
  // Encodage UTF-8 propre
  const utf8 = unescape(encodeURIComponent(content))
  return sha256Sync(utf8)
}

/**
 * Sérialisation JSON canonique (clés triées récursivement) pour garantir
 * qu'un même objet produit toujours exactement la même empreinte cryptographique.
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj)
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]"
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  const entries = keys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJson((obj as Record<string, unknown>)[key])}`
  )
  return "{" + entries.join(",") + "}"
}

/**
 * Calcule l'empreinte cryptographique d'un document ou d'une opération
 */
export function calculateDocumentHash(data: unknown): string {
  const canonical = canonicalJson(data)
  return computeSha256(canonical)
}

/**
 * Génère une référence d'attestation sécurisée normalisée
 * Ex : ATT-20261104-9B3EA1
 */
export function generateAttestationId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ATT-${dateStr}-${rand}`
}

/**
 * Calcule le hachage d'une entrée de registre pour former la chaîne immuable
 */
export function calculateAuditEntryHash(
  entry: Omit<AuditRegistryEntry, "entryHash">
): string {
  const payload = [
    entry.id,
    entry.sequenceNumber,
    entry.timestamp,
    entry.actorId,
    entry.actorRole,
    entry.action,
    entry.resourceType,
    entry.resourceId,
    entry.justification || "",
    entry.previousEntryHash,
    canonicalJson(entry.newState || {}),
  ].join("|")
  return computeSha256(payload)
}

/**
 * Vérifie l'intégrité intégrale de la chaîne de hachage du registre d'audit.
 * Détecte toute altération, insertion ou suppression d'événement.
 */
export function verifyAuditChainIntegrity(chain: AuditRegistryEntry[]): {
  valid: boolean
  totalChecked: number
  brokenAtIndex?: number
  error?: string
} {
  if (!chain || chain.length === 0) {
    return { valid: true, totalChecked: 0 }
  }

  // 1. Première entrée (Genesis)
  const genesis = chain[0]
  const genesisExpectedHash = calculateAuditEntryHash({
    id: genesis.id,
    sequenceNumber: genesis.sequenceNumber,
    timestamp: genesis.timestamp,
    actorId: genesis.actorId,
    actorName: genesis.actorName,
    actorRole: genesis.actorRole,
    wilayaCode: genesis.wilayaCode,
    action: genesis.action,
    resourceType: genesis.resourceType,
    resourceId: genesis.resourceId,
    resourceReference: genesis.resourceReference,
    previousState: genesis.previousState,
    newState: genesis.newState,
    justification: genesis.justification,
    metadata: genesis.metadata,
    previousEntryHash: genesis.previousEntryHash,
  })

  if (genesis.entryHash !== genesisExpectedHash) {
    return {
      valid: false,
      totalChecked: 1,
      brokenAtIndex: 0,
      error: `Altération détectée sur l'entrée initiale #1 (Hash invalide).`,
    }
  }

  // 2. Chaînage séquentiel
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i]
    const previous = chain[i - 1]

    // Vérifier la séquence incrémentale
    if (current.sequenceNumber !== previous.sequenceNumber + 1) {
      return {
        valid: false,
        totalChecked: i + 1,
        brokenAtIndex: i,
        error: `Rupture de séquence : entrée #${current.sequenceNumber} après #${previous.sequenceNumber}.`,
      }
    }

    // Vérifier le pointeur de hachage vers l'entrée précédente
    if (current.previousEntryHash !== previous.entryHash) {
      return {
        valid: false,
        totalChecked: i + 1,
        brokenAtIndex: i,
        error: `Rupture de chaînage cryptographique à l'index ${i} (previousEntryHash != hash précédent).`,
      }
    }

    // Vérifier le hash intrinsèque de l'entrée courante
    const expectedHash = calculateAuditEntryHash({
      id: current.id,
      sequenceNumber: current.sequenceNumber,
      timestamp: current.timestamp,
      actorId: current.actorId,
      actorName: current.actorName,
      actorRole: current.actorRole,
      wilayaCode: current.wilayaCode,
      action: current.action,
      resourceType: current.resourceType,
      resourceId: current.resourceId,
      resourceReference: current.resourceReference,
      previousState: current.previousState,
      newState: current.newState,
      justification: current.justification,
      metadata: current.metadata,
      previousEntryHash: current.previousEntryHash,
    })

    if (current.entryHash !== expectedHash) {
      return {
        valid: false,
        totalChecked: i + 1,
        brokenAtIndex: i,
        error: `Altération détectée du contenu à l'index ${i} (Hash altéré).`,
      }
    }
  }

  return { valid: true, totalChecked: chain.length }
}

/**
 * Crée le payload QR Code de vérification d'une attestation numérique interne
 */
export function generateAttestationQrPayload(attestation: DigitalAttestation): string {
  return JSON.stringify({
    v: 1,
    org: "Yed fel yed — MJS",
    type: "internal_attestation",
    id: attestation.id,
    op: attestation.operationReference,
    act: attestation.actionType,
    sign: attestation.actorName,
    role: attestation.actorRole,
    w: attestation.wilayaCode,
    ts: attestation.timestamp,
    hash: attestation.documentHash.slice(0, 16) + "...",
  })
}

