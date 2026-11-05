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

/** =========================================================================
 * EXTENSION DU MODULE SOS : BESOINS MATÉRIELS & PROFESSIONS
 * ========================================================================= */

import type {
  SosMaterialCategory,
  SosPriorityLevel,
  SosProfessionCategory,
  SosCall,
  SosMaterialNeed,
} from "./sosTypes"

export const SOS_MATERIAL_CATEGORIES: {
  id: SosMaterialCategory
  labelKey: string
  iconName: string
}[] = [
  { id: "food_water", labelKey: "sos.material.food_water", iconName: "UtensilsCrossed" },
  { id: "clothing_blankets", labelKey: "sos.material.clothing_blankets", iconName: "Shirt" },
  { id: "medical_supplies", labelKey: "sos.material.medical_supplies", iconName: "Pill" },
  { id: "hygiene_products", labelKey: "sos.material.hygiene_products", iconName: "Sparkles" },
  { id: "construction_materials", labelKey: "sos.material.construction_materials", iconName: "Hammer" },
  { id: "technical_equipment", labelKey: "sos.material.technical_equipment", iconName: "Wrench" },
  { id: "shelter_housing", labelKey: "sos.material.shelter_housing", iconName: "Tent" },
  { id: "other", labelKey: "sos.material.other", iconName: "Package" },
]

export type SosProfessionDef = {
  id: string
  category: SosProfessionCategory
  labelKey: string
  requiresLicense?: boolean
}

export const SOS_PROFESSIONS: SosProfessionDef[] = [
  // SANTÉ
  { id: "doctor", category: "health", labelKey: "sos.professions.doctor", requiresLicense: true },
  { id: "nurse", category: "health", labelKey: "sos.professions.nurse", requiresLicense: true },
  { id: "psychologist", category: "health", labelKey: "sos.professions.psychologist", requiresLicense: true },
  { id: "veterinarian", category: "health", labelKey: "sos.professions.veterinarian", requiresLicense: true },
  { id: "pharmacist", category: "health", labelKey: "sos.professions.pharmacist", requiresLicense: true },
  { id: "first_aid", category: "health", labelKey: "sos.professions.first_aid", requiresLicense: false },

  // CONSTRUCTION ET TECHNIQUE
  { id: "mason", category: "construction_technical", labelKey: "sos.professions.mason" },
  { id: "electrician", category: "construction_technical", labelKey: "sos.professions.electrician" },
  { id: "plumber", category: "construction_technical", labelKey: "sos.professions.plumber" },
  { id: "carpenter", category: "construction_technical", labelKey: "sos.professions.carpenter" },
  { id: "welder", category: "construction_technical", labelKey: "sos.professions.welder" },
  { id: "technician", category: "construction_technical", labelKey: "sos.professions.technician" },

  // TRANSPORT
  { id: "driver", category: "transport", labelKey: "sos.professions.driver" },
  { id: "truck_driver", category: "transport", labelKey: "sos.professions.truck_driver" },
  { id: "heavy_machinery_driver", category: "transport", labelKey: "sos.professions.heavy_machinery_driver" },
  { id: "transporter", category: "transport", labelKey: "sos.professions.transporter" },

  // ACCOMPAGNEMENT SOCIAL
  { id: "social_worker", category: "social", labelKey: "sos.professions.social_worker" },
  { id: "educator", category: "social", labelKey: "sos.professions.educator" },
  { id: "teacher", category: "social", labelKey: "sos.professions.teacher" },
  { id: "translator", category: "social", labelKey: "sos.professions.translator" },
  { id: "chaperone", category: "social", labelKey: "sos.professions.chaperone" },

  // AUTRES
  { id: "other", category: "other", labelKey: "sos.professions.other" },
]

export const SOS_PROFESSION_CATEGORIES: {
  id: SosProfessionCategory
  labelKey: string
}[] = [
  { id: "health", labelKey: "sos.professionCategories.health" },
  { id: "construction_technical", labelKey: "sos.professionCategories.construction_technical" },
  { id: "transport", labelKey: "sos.professionCategories.transport" },
  { id: "social", labelKey: "sos.professionCategories.social" },
  { id: "other", labelKey: "sos.professionCategories.other" },
]

export const SOS_PRIORITIES: {
  id: SosPriorityLevel
  labelKey: string
  color: string
}[] = [
  { id: "critical", labelKey: "sos.priorities.critical", color: "text-rose-700 bg-rose-50 border-rose-200" },
  { id: "high", labelKey: "sos.priorities.high", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { id: "medium", labelKey: "sos.priorities.medium", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { id: "low", labelKey: "sos.priorities.low", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
]

export function getProfessionMeta(id?: string): SosProfessionDef | undefined {
  if (!id) return undefined
  return SOS_PROFESSIONS.find((p) => p.id === id)
}

export function getMaterialCategoryMeta(id: SosMaterialCategory) {
  return SOS_MATERIAL_CATEGORIES.find((m) => m.id === id)
}

export function calculateRemainingSlots(call: Pick<SosCall, "requiredSlots" | "acceptedCount">): number {
  return Math.max(0, call.requiredSlots - (call.acceptedCount || 0))
}

export function calculateRemainingMaterial(need: Pick<SosMaterialNeed, "requiredQuantity" | "receivedQuantity">): number {
  return Math.max(0, need.requiredQuantity - (need.receivedQuantity || 0))
}

export function isCallFull(call: Pick<SosCall, "requiredSlots" | "acceptedCount">): boolean {
  return (call.acceptedCount || 0) >= call.requiredSlots
}

export function generateSosReference(prefix: string, seed: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = seed.replace(/-/g, "").slice(0, 6).toUpperCase()
  return `SOS-${prefix}-${dateStr}-${suffix}`
}
