import type { Registrant } from "./types"

/** Payload encoded inside each registrant's unique QR code (id = NIN) */
export function buildQrPayload(
  registrant: Pick<Registrant, "id" | "qrCode" | "lastName" | "firstName" | "nationalId">
) {
  const nin = registrant.nationalId || registrant.id
  return JSON.stringify({
    v: 2,
    org: "ODEJ",
    id: nin,
    nin,
    code: registrant.qrCode,
    name: `${registrant.lastName} ${registrant.firstName}`,
  })
}

export function createQrCode(nin: string): string {
  const suffix = nin.slice(-6) || crypto.randomUUID().replace(/-/g, "").slice(0, 6)
  return `ODEJ-${suffix}`
}

export function parseQrScan(raw: string): { nin?: string; code?: string; id?: string } | null {
  const text = raw.trim()
  if (!text) return null

  try {
    const data = JSON.parse(text) as {
      nin?: string
      id?: string
      code?: string
      nationalId?: string
    }
    const nin = data.nin || data.nationalId || data.id
    return {
      nin: nin ? String(nin) : undefined,
      code: data.code ? String(data.code) : undefined,
      id: data.id ? String(data.id) : undefined,
    }
  } catch {
    // Plain NIN or ODEJ code pasted/scanned as text
    if (/^\d{18}$/.test(text)) return { nin: text, id: text }
    if (/^ODEJ-/i.test(text)) return { code: text.toUpperCase() }
    return { id: text, nin: text }
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}
