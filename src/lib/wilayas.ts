export type StructureKind =
  | "maison_jeunes"
  | "auberge"
  | "foyer"
  | "centre_culturel"
  | "terrain"
  | "camp"
  | "autre"

export type InstitutionAuthority = "ODEJ" | "DJS"

export type WilayaMeta = {
  code: number
  name: string
  name_ar: string
  latitude: number
  longitude: number
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
