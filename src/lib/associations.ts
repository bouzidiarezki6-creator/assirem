import type { LucideIcon } from "lucide-react"
import { Accessibility, Baby, HeartPulse, HelpingHand, Users, UserRound } from "lucide-react"
import type { Association } from "./types"

export type AssociationSectorId =
  | "orphans"
  | "disability"
  | "cancer"
  | "elderly"
  | "widows"
  | "children"

export type AssociationSectorDef = {
  id: AssociationSectorId
  icon: LucideIcon
  accent: string
}

export const ASSOCIATION_SECTORS: AssociationSectorDef[] = [
  { id: "orphans", icon: Baby, accent: "bg-amber-50 text-amber-700" },
  { id: "disability", icon: Accessibility, accent: "bg-violet-50 text-violet-700" },
  { id: "cancer", icon: HeartPulse, accent: "bg-rose-50 text-rose-700" },
  { id: "elderly", icon: UserRound, accent: "bg-sky-50 text-sky-700" },
  { id: "widows", icon: Users, accent: "bg-emerald-50 text-emerald-700" },
  { id: "children", icon: HelpingHand, accent: "bg-orange-50 text-orange-700" },
]

export function getAssociationSector(id: AssociationSectorId) {
  return ASSOCIATION_SECTORS.find((s) => s.id === id)
}

/** Prefer Association from AppData — CharityOrgSeed kept for seed migration */
export type CharityOrgSeed = {
  id: string
  sectorId: AssociationSectorId
  name_fr: string
  name_ar: string
  name_en: string
  description_fr: string
  description_ar: string
  description_en: string
  ccpAccount?: string
}

/** National seed catalog — migrated into AppData.associations on first load */
export const CHARITY_ORGANIZATIONS: CharityOrgSeed[] = [
  {
    id: "org-orphelins-espoir",
    sectorId: "orphans",
    name_fr: "Espoir des Orphelins",
    name_ar: "أمل الأيتام",
    name_en: "Orphans' Hope",
    description_fr: "Soutien scolaire et alimentaire pour les orphelins.",
    description_ar: "دعم دراسي وغذائي للأيتام.",
    description_en: "School and food support for orphans.",
    ccpAccount: "00799999000012345678",
  },
  {
    id: "org-maison-rahma",
    sectorId: "orphans",
    name_fr: "Maison Rahma",
    name_ar: "دار الرحمة",
    name_en: "Rahma House",
    description_fr: "Accueil et accompagnement des enfants sans famille.",
    description_ar: "إيواء ومرافقة الأطفال بدون أسرة.",
    description_en: "Care and support for children without family.",
    ccpAccount: "00799999000022345678",
  },
  {
    id: "org-handi-solidarite",
    sectorId: "disability",
    name_fr: "Handi-Solidarité",
    name_ar: "تضامن ذوي الهمم",
    name_en: "Disability Solidarity",
    description_fr: "Aides techniques et inclusion des personnes handicapées.",
    description_ar: "مساعدات تقنية وإدماج الأشخاص ذوي الإعاقة.",
    description_en: "Assistive aids and inclusion for people with disabilities.",
    ccpAccount: "00799999000032345678",
  },
  {
    id: "org-cap-abilites",
    sectorId: "disability",
    name_fr: "Cap'Abilités",
    name_ar: "قدرات",
    name_en: "CapAbilities",
    description_fr: "Formation et insertion professionnelle.",
    description_ar: "تكوين وإدماج مهني.",
    description_en: "Training and professional integration.",
    ccpAccount: "00799999000042345678",
  },
  {
    id: "org-contre-cancer",
    sectorId: "cancer",
    name_fr: "Ensemble contre le Cancer",
    name_ar: "معاً ضد السرطان",
    name_en: "Together Against Cancer",
    description_fr: "Aide aux malades et à leurs familles pendant le traitement.",
    description_ar: "دعم المرضى وعائلاتهم أثناء العلاج.",
    description_en: "Support for patients and families during treatment.",
    ccpAccount: "00799999000052345678",
  },
  {
    id: "org-sourire-espoir",
    sectorId: "cancer",
    name_fr: "Sourire & Espoir",
    name_ar: "ابتسامة وأمل",
    name_en: "Smile & Hope",
    description_fr: "Accompagnement psychologique et logistique.",
    description_ar: "مرافقة نفسية ولوجستية.",
    description_en: "Psychological and logistical support.",
    ccpAccount: "00799999000062345678",
  },
  {
    id: "org-aines-dignite",
    sectorId: "elderly",
    name_fr: "Dignité des Aînés",
    name_ar: "كرامة كبار السن",
    name_en: "Elders' Dignity",
    description_fr: "Soins et compagnie pour les personnes âgées isolées.",
    description_ar: "رعاية ومرافقة لكبار السن المعزولين.",
    description_en: "Care and company for isolated elderly people.",
    ccpAccount: "00799999000072345678",
  },
  {
    id: "org-veuves-solidaires",
    sectorId: "widows",
    name_fr: "Veuves Solidaires",
    name_ar: "أرامل متضامنات",
    name_en: "Widows Solidarity",
    description_fr: "Aide sociale et micro-projets pour les veuves.",
    description_ar: "مساعدة اجتماعية ومشاريع صغيرة للأرامل.",
    description_en: "Social aid and micro-projects for widows.",
    ccpAccount: "00799999000082345678",
  },
  {
    id: "org-enfance-avenir",
    sectorId: "children",
    name_fr: "Enfance & Avenir",
    name_ar: "طفولة ومستقبل",
    name_en: "Childhood & Future",
    description_fr: "Santé et loisirs pour les enfants vulnérables.",
    description_ar: "صحة وترفيه للأطفال في وضع هش.",
    description_en: "Health and leisure for vulnerable children.",
    ccpAccount: "00799999000092345678",
  },
]

export function seedAssociationsFromCatalog(now = new Date().toISOString()): Association[] {
  return CHARITY_ORGANIZATIONS.map((org) => ({
    id: org.id,
    name: org.name_fr,
    logoDataUrl: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800&q=80",
    sectorId: org.sectorId,
    ccpAccount: org.ccpAccount ?? "",
    published: true,
    createdAt: now,
    updatedAt: now,
  }))
}

export function formatCcpDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length <= 3) return digits
  const parts: string[] = []
  let i = 0
  parts.push(digits.slice(i, 3))
  i = 3
  if (digits.length > i) {
    parts.push(digits.slice(i, i + 5))
    i += 5
  }
  if (digits.length > i) {
    parts.push(digits.slice(i, i + 2))
    i += 2
  }
  if (digits.length > i) {
    parts.push(digits.slice(i, i + 10))
    i += 10
  }
  if (digits.length > i) parts.push(digits.slice(i))
  return parts.filter(Boolean).join(" ")
}

export function normalizeCcp(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20)
}

export function isValidCcp(raw: string): boolean {
  const digits = normalizeCcp(raw)
  return digits.length >= 10 && digits.length <= 20
}

export function localizedOrgName(
  org: Pick<Association, "name"> | CharityOrgSeed,
  locale: string
): string {
  if ("name" in org && typeof org.name === "string" && !("name_fr" in org)) {
    return org.name
  }
  const seed = org as CharityOrgSeed
  if (locale === "ar") return seed.name_ar
  if (locale === "en") return seed.name_en
  return seed.name_fr
}

export function localizedOrgDescription(
  org: CharityOrgSeed,
  locale: string
): string {
  if (locale === "ar") return org.description_ar
  if (locale === "en") return org.description_en
  return org.description_fr
}
