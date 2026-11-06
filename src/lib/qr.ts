import type { AppData, Registrant, VolunteerAccount } from "./types"

/**
 * ============================================================================
 * SYSTÈME QR CODE & IDENTIFIANT UNIQUE POUR ADHÉRENTS & BÉNÉVOLES — YED FEL YED
 * Génération déterministe/collision-free, encodage enrichi et lecteur universel
 * ============================================================================
 */

export type ParsedQrScan = {
  code?: string
  volunteerCode?: string
  nin?: string
  id?: string
  name?: string
  email?: string
  phone?: string
  wilayaCode?: number
  commune?: string
  type?: "volunteer_badge" | "registrant_ticket" | "raw"
  rawText: string
}

export type ExtractedAdherent = {
  type: "volunteer" | "registrant"
  id: string
  displayName: string
  firstName: string
  lastName: string
  volunteerCode: string
  qrCode: string
  nationalId?: string
  email?: string
  phone?: string
  wilayaCode?: number
  commune?: string
  points: number
  status?: string
  volunteerAccount?: VolunteerAccount
  registrant?: Registrant
}

/**
 * Génère un code de bénévole unique et normalisé respectant le standard national :
 * Format : YFY-VOL-YYYYMMDD-{WILAYA}{INITIALES}-{ENTROPIE}
 * Exemple : YFY-VOL-20261105-19WB-8E32
 */
export function generateUniqueVolunteerCode(params: {
  wilayaCode: number
  firstName: string
  lastName: string
  date?: string
  existingCodes?: string[]
}): string {
  const wilayaStr = String(params.wilayaCode || 16).padStart(2, "0")
  const firstInitial = (params.firstName.trim().charAt(0) || "X").toUpperCase()
  const lastInitial = (params.lastName.trim().charAt(0) || "X").toUpperCase()
  const dateStr = (params.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "")

  const existing = new Set((params.existingCodes || []).map((c) => c.toUpperCase()))

  // Boucle de garantie anti-collision
  for (let attempt = 0; attempt < 100; attempt++) {
    const entropy = Math.random().toString(36).substring(2, 6).toUpperCase()
    const candidate = `YFY-VOL-${dateStr}-${wilayaStr}${firstInitial}${lastInitial}-${entropy}`
    if (!existing.has(candidate)) {
      return candidate
    }
  }

  // Fallback avec timestamp haute précision
  const ts = Date.now().toString(36).slice(-4).toUpperCase()
  return `YFY-VOL-${dateStr}-${wilayaStr}${firstInitial}${lastInitial}-${ts}`
}

/**
 * Génère un code unique d'inscription (événement / activité)
 * Format : YFY-REG-YYYYMMDD-{ENTROPIE}
 */
export function generateUniqueRegistrantCode(params?: {
  nin?: string
  date?: string
  existingCodes?: string[]
}): string {
  const dateStr = (params?.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "")
  const existing = new Set((params?.existingCodes || []).map((c) => c.toUpperCase()))

  for (let attempt = 0; attempt < 100; attempt++) {
    const suffix = params?.nin ? params.nin.slice(-4) : Math.random().toString(36).substring(2, 6).toUpperCase()
    const entropy = Math.random().toString(36).substring(2, 5).toUpperCase()
    const candidate = `YFY-REG-${dateStr}-${suffix}${entropy}`
    if (!existing.has(candidate)) {
      return candidate
    }
  }

  return `YFY-REG-${dateStr}-${Date.now().toString(36).slice(-4).toUpperCase()}`
}

/**
 * Rétrocompatibilité : génère un code court
 */
export function createQrCode(nin: string): string {
  const suffix = nin && nin.length >= 6 ? nin.slice(-6) : Math.random().toString(36).substring(2, 8).toUpperCase()
  return `YFY-${suffix}`
}

/**
 * Payload officiel encodé dans le QR code d'un bénévole officiel (Carte de Bénévole)
 */
export function buildVolunteerQrPayload(volunteer: {
  id: string
  volunteerCode: string
  firstName: string
  lastName: string
  wilayaCode?: number
  commune?: string
  email?: string
  phone?: string
}): string {
  return JSON.stringify({
    v: 2,
    type: "volunteer_badge",
    org: "Yed fel yed",
    id: volunteer.id,
    code: volunteer.volunteerCode,
    volunteerCode: volunteer.volunteerCode,
    name: `${volunteer.lastName} ${volunteer.firstName}`,
    wilayaCode: volunteer.wilayaCode,
    commune: volunteer.commune,
    ts: Date.now(),
  })
}

/**
 * Payload encodé dans le ticket QR d'inscription (événement / activité)
 */
export function buildQrPayload(
  registrant: Pick<Registrant, "id" | "qrCode" | "lastName" | "firstName" | "nationalId">
): string {
  const nin = registrant.nationalId || registrant.id
  return JSON.stringify({
    v: 2,
    type: "registrant_ticket",
    org: "Yed fel yed",
    id: nin,
    nin,
    code: registrant.qrCode,
    name: `${registrant.lastName} ${registrant.firstName}`,
  })
}

/**
 * Décodeur universel de scan QR :
 * Capable d'extraire les données qu'il s'agisse de :
 * 1. JSON complet (carte ou ticket)
 * 2. URL de vérification avec query param (?code=... ou ?volunteer=...)
 * 3. URL avec chemin (/v/YFY-... ou /verify/YFY-...)
 * 4. Code texte brut (YFY-VOL-..., YFY-REG-..., YFY-..., ODEJ-...)
 * 5. NIN algérien brut à 18 chiffres
 * 6. Adresse email ou numéro de téléphone
 */
export function parseQrScan(raw: string): ParsedQrScan | null {
  const text = (raw || "").trim()
  if (!text) return null

  // 1. Tenter le parsing JSON
  try {
    const data = JSON.parse(text)
    if (typeof data === "object" && data !== null) {
      const code = data.code || data.volunteerCode || data.qrCode
      const nin = data.nin || data.nationalId || (data.id && /^\d{18}$/.test(data.id) ? data.id : undefined)
      const id = data.id || nin || code
      const volunteerCode = data.volunteerCode || (code && code.startsWith("YFY-VOL-") ? code : undefined)

      return {
        code: code ? String(code) : undefined,
        volunteerCode: volunteerCode ? String(volunteerCode) : undefined,
        nin: nin ? String(nin) : undefined,
        id: id ? String(id) : undefined,
        name: data.name ? String(data.name) : undefined,
        email: data.email ? String(data.email) : undefined,
        phone: data.phone ? String(data.phone) : undefined,
        wilayaCode: typeof data.wilayaCode === "number" ? data.wilayaCode : undefined,
        commune: data.commune ? String(data.commune) : undefined,
        type: data.type || "volunteer_badge",
        rawText: text,
      }
    }
  } catch {
    // Pas du JSON strict, analyser comme URL ou texte brut
  }

  // 2. Tenter comme URL
  if (text.startsWith("http://") || text.startsWith("https://") || text.includes("?code=") || text.includes("?volunteer=")) {
    try {
      const url = new URL(text.startsWith("http") ? text : `https://yedfelyed.dz/${text}`)
      const codeParam = url.searchParams.get("code") || url.searchParams.get("volunteer") || url.searchParams.get("id") || url.searchParams.get("nin")
      if (codeParam) {
        return parseQrScan(codeParam)
      }
      const pathParts = url.pathname.split("/").filter(Boolean)
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart && (lastPart.startsWith("YFY-") || lastPart.startsWith("ODEJ-"))) {
        return parseQrScan(lastPart)
      }
    } catch {
      // ignore
    }
  }

  // 3. Détecter format NIN (18 chiffres algériens)
  if (/^\d{18}$/.test(text)) {
    return { nin: text, id: text, rawText: text }
  }

  // 4. Détecter code YFY / ODEJ officiel
  const codeMatch = text.match(/(YFY-VOL-[A-Z0-9-]+|YFY-REG-[A-Z0-9-]+|YFY-[A-Z0-9-]+|ODEJ-[A-Z0-9-]+)/i)
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase()
    return {
      code,
      volunteerCode: code.startsWith("YFY-VOL-") ? code : undefined,
      id: code,
      rawText: text,
    }
  }

  // 5. Détecter email
  if (text.includes("@") && text.includes(".")) {
    return { email: text.toLowerCase(), id: text, rawText: text }
  }

  // 6. Détecter téléphone algérien
  if (/^(0|\+213)[5-7][0-9]{8}$/.test(text.replace(/[\s.-]/g, ""))) {
    return { phone: text.replace(/[\s.-]/g, ""), id: text, rawText: text }
  }

  // Fallback brut
  return {
    id: text,
    code: text.toUpperCase(),
    rawText: text,
  }
}

/**
 * EXTRACTEUR D'ADHÉRENT INTELLIGENT :
 * Résout directement l'adhérent (bénévole ou inscrit) depuis n'importe quel scan QR ou code textuel.
 */
export function extractAdherentFromScan(
  raw: string,
  data: AppData
): ExtractedAdherent | null {
  const parsed = parseQrScan(raw)
  if (!parsed) return null

  const accounts = data.volunteerAccounts || []
  const registrants = data.registrants || []

  // Normalisation des cibles de recherche
  const targetCode = (parsed.volunteerCode || parsed.code || "").toUpperCase()
  const targetId = (parsed.id || "").toUpperCase()
  const targetNin = (parsed.nin || "").toUpperCase()
  const targetEmail = (parsed.email || "").toLowerCase()
  const targetPhone = (parsed.phone || "").replace(/[\s.-]/g, "")

  // 1. RECHERCHE DANS LES COMPTES BÉNÉVOLES (Priorité 1)
  const vol = accounts.find((v) => {
    if (targetCode && v.volunteerCode.toUpperCase() === targetCode) return true
    if (targetId && v.id.toUpperCase() === targetId) return true
    if (targetEmail && v.email.toLowerCase() === targetEmail) return true
    if (targetPhone && v.phone && v.phone.replace(/[\s.-]/g, "") === targetPhone) return true
    if (targetNin && (v as any).nationalId && (v as any).nationalId.toUpperCase() === targetNin) return true
    return false
  })

  if (vol) {
    return {
      type: "volunteer",
      id: vol.id,
      displayName: `${vol.firstName} ${vol.lastName}`,
      firstName: vol.firstName,
      lastName: vol.lastName,
      volunteerCode: vol.volunteerCode,
      qrCode: vol.volunteerCode,
      nationalId: (vol as any).nationalId,
      email: vol.email,
      phone: vol.phone,
      wilayaCode: vol.wilayaCode,
      commune: vol.commune,
      points: vol.points || 0,
      status: vol.status || "active",
      volunteerAccount: vol,
    }
  }

  // 2. RECHERCHE DANS LES REGISTRANTS (Inscrits aux événements / activités)
  const reg = registrants.find((r) => {
    if (targetCode && r.qrCode.toUpperCase() === targetCode) return true
    if (targetId && r.id.toUpperCase() === targetId) return true
    if (targetNin && r.nationalId && r.nationalId.toUpperCase() === targetNin) return true
    if (targetCode && `YFY-VOL-${r.qrCode}`.toUpperCase() === targetCode) return true
    return false
  })

  if (reg) {
    return {
      type: "registrant",
      id: reg.id,
      displayName: `${reg.firstName} ${reg.lastName}`,
      firstName: reg.firstName,
      lastName: reg.lastName,
      volunteerCode: `YFY-VOL-${reg.qrCode}`,
      qrCode: reg.qrCode,
      nationalId: reg.nationalId,
      commune: reg.birthPlace,
      points: reg.points || 0,
      registrant: reg,
    }
  }

  return null
}

/**
 * Utilitaire de téléchargement d'image QR générée
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}
