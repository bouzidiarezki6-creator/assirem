import type { SosAidCategoryId } from "./types"

export const SOS_AID_CATEGORY_IDS: SosAidCategoryId[] = [
  "food",
  "clothing",
  "medical",
  "shelter",
  "hygiene",
  "other",
]

export function isValidGps(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  )
}

export function parseGpsCoord(raw: string): number | null {
  const n = Number(String(raw).trim().replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function formatGps(lat: number, lng: number, digits = 5): string {
  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/**
 * Extract lat/lng from a pasted Google Maps / OSM / geo: link or "lat,lng" text.
 */
export function parseMapsLink(raw: string): { lat: number; lng: number } | null {
  const text = raw.trim()
  if (!text) return null

  // geo:36.75,5.08 or geo:36.75,5.08?z=14
  const geo = text.match(/^geo:(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i)
  if (geo) {
    const lat = Number(geo[1])
    const lng = Number(geo[2])
    if (isValidGps(lat, lng)) return { lat, lng }
  }

  // OpenStreetMap: #map=zoom/lat/lng
  const osm = text.match(/#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/)
  if (osm) {
    const lat = Number(osm[1])
    const lng = Number(osm[2])
    if (isValidGps(lat, lng)) return { lat, lng }
  }

  // Google Maps @lat,lng,zoom
  const at = text.match(/@(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
  if (at) {
    const lat = Number(at[1])
    const lng = Number(at[2])
    if (isValidGps(lat, lng)) return { lat, lng }
  }

  // Google Maps !3dLAT!4dLNG
  const bang = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  if (bang) {
    const lat = Number(bang[1])
    const lng = Number(bang[2])
    if (isValidGps(lat, lng)) return { lat, lng }
  }

  // Query params: q=, ll=, destination=, center=
  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`)
    const candidates = [
      url.searchParams.get("q"),
      url.searchParams.get("query"),
      url.searchParams.get("ll"),
      url.searchParams.get("destination"),
      url.searchParams.get("center"),
      url.searchParams.get("daddr"),
      url.searchParams.get("saddr"),
    ].filter(Boolean) as string[]

    for (const c of candidates) {
      const pair = extractLatLngPair(c)
      if (pair) return pair
    }

    // path like /maps/dir/36.7,5.0/...
    const pathPair = extractLatLngPair(decodeURIComponent(url.pathname))
    if (pathPair) return pathPair
  } catch {
    // not a URL — fall through to plain text
  }

  // Plain "36.75, 5.08" or "36.75 5.08"
  return extractLatLngPair(text)
}

function extractLatLngPair(raw: string): { lat: number; lng: number } | null {
  const cleaned = raw
    .replace(/^\s*place\//i, "")
    .replace(/\+/g, " ")
    .trim()

  const m = cleaned.match(
    /(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/
  )
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  // Prefer lat,lng order; if first looks like longitude (>90), swap
  if (isValidGps(a, b)) return { lat: a, lng: b }
  if (isValidGps(b, a)) return { lat: b, lng: a }
  return null
}
