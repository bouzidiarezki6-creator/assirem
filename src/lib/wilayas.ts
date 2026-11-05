import rawWilayas from "./wilayasData.json"

export type StructureKind =
  | "maison_jeunes"
  | "auberge"
  | "foyer"
  | "centre_culturel"
  | "terrain"
  | "camp"
  | "autre"

export type InstitutionAuthority = "Yed fel yed" | "DJS"

export type WilayaMeta = {
  code: number
  name: string
  name_ar: string
  latitude: number
  longitude: number
  nameFr?: string
}

export const STRUCTURE_KIND_I18N: Record<StructureKind, string> = {
  maison_jeunes: "map.kinds.maison_jeunes",
  auberge: "map.kinds.auberge",
  foyer: "map.kinds.foyer",
  centre_culturel: "map.kinds.centre_culturel",
  terrain: "map.kinds.terrain",
  camp: "map.kinds.camp",
  autre: "map.kinds.autre",
}

export function padWilayaCode(code: number | string): string {
  return String(code).padStart(2, "0")
}

export const ALGERIA_WILAYAS: WilayaMeta[] = (rawWilayas as Array<{
  code: number
  name: string
  name_ar: string
  latitude: number
  longitude: number
}>).map((w) => ({
  ...w,
  nameFr: w.name,
}))

export const WILAYAS = ALGERIA_WILAYAS
export const WILAYAS_LIST = ALGERIA_WILAYAS

export function getWilaya(code: number | string | null | undefined): (WilayaMeta & { nameFr: string }) | undefined {
  if (code === null || code === undefined) return undefined
  const num = typeof code === "string" ? parseInt(code, 10) : code
  const found = ALGERIA_WILAYAS.find((w) => w.code === num)
  if (!found) return undefined
  return {
    ...found,
    nameFr: found.name,
  }
}

export const getWilayaByCode = getWilaya
