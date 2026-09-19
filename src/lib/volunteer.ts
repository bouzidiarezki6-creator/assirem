import {
  BookOpen,
  HeartHandshake,
  HeartPulse,
  Leaf,
  PartyPopper,
  Siren,
  Tent,
  type LucideIcon,
} from "lucide-react"

export type VolunteerCategoryId =
  | "social"
  | "educatif"
  | "sante"
  | "environnemental"
  | "urgences"
  | "evenementiel"
  | "scoutisme"

export type VolunteerCategory = {
  id: VolunteerCategoryId
  labelFr: string
  labelAr: string
  description: string
  icon: LucideIcon
}

export type VolunteerOpportunity = {
  id: string
  title: string
  description: string
  categoryId: VolunteerCategoryId
  location: string
  institution: string
  date: string
  slots: number
  published: boolean
}

export const VOLUNTEER_CATEGORIES: VolunteerCategory[] = [
  {
    id: "social",
    labelFr: "Social",
    labelAr: "اجتماعي",
    description: "Accompagnement social et solidarité",
    icon: HeartHandshake,
  },
  {
    id: "educatif",
    labelFr: "Éducatif",
    labelAr: "تربوي",
    description: "Soutien scolaire et ateliers éducatifs",
    icon: BookOpen,
  },
  {
    id: "sante",
    labelFr: "Santé",
    labelAr: "صحة",
    description: "Sensibilisation et actions santé",
    icon: HeartPulse,
  },
  {
    id: "environnemental",
    labelFr: "Environnemental",
    labelAr: "بيئي",
    description: "Protection de l'environnement",
    icon: Leaf,
  },
  {
    id: "urgences",
    labelFr: "Urgences",
    labelAr: "طوارئ",
    description: "Intervention et aide d'urgence",
    icon: Siren,
  },
  {
    id: "evenementiel",
    labelFr: "Événementiel",
    labelAr: "تظاهرات",
    description: "Organisation d'événements jeunes",
    icon: PartyPopper,
  },
  {
    id: "scoutisme",
    labelFr: "Scoutisme",
    labelAr: "كشافة",
    description: "Activités scoutes et plein air",
    icon: Tent,
  },
]

export const VOLUNTEER_OPPORTUNITIES: VolunteerOpportunity[] = [
  {
    id: "vol-1",
    title: "Accompagnement des personnes âgées",
    description: "Visites et aide quotidienne aux aînés dans le quartier.",
    categoryId: "social",
    location: "بجاية",
    institution: "بيت الشباب بجاية",
    date: "2026-06-12",
    slots: 15,
    published: true,
  },
  {
    id: "vol-2",
    title: "Distribution de paniers solidaires",
    description: "Préparation et distribution de paniers alimentaires aux familles.",
    categoryId: "social",
    location: "أميزور",
    institution: "دار الشباب أميزور",
    date: "2026-06-18",
    slots: 20,
    published: true,
  },
  {
    id: "vol-3",
    title: "Soutien scolaire — mathématiques",
    description: "Aide aux devoirs pour collégiens en difficulté.",
    categoryId: "educatif",
    location: "بجاية",
    institution: "مركز الشباب الثقافي",
    date: "2026-06-20",
    slots: 10,
    published: true,
  },
  {
    id: "vol-4",
    title: "Atelier lecture pour enfants",
    description: "Animation d'ateliers de lecture et d'écriture.",
    categoryId: "educatif",
    location: "تيزي وزو",
    institution: "بيت الشباب تيزي وزو",
    date: "2026-06-22",
    slots: 8,
    published: true,
  },
  {
    id: "vol-5",
    title: "Campagne de sensibilisation santé",
    description: "Stands d'information sur l'hygiène et la prévention.",
    categoryId: "sante",
    location: "بجاية",
    institution: "ديوان مؤسسات الشباب",
    date: "2026-06-25",
    slots: 25,
    published: true,
  },
  {
    id: "vol-6",
    title: "Don de sang — journée jeunes",
    description: "Accueil et orientation des donneurs volontaires.",
    categoryId: "sante",
    location: "بجاية",
    institution: "مركب الشباب",
    date: "2026-07-02",
    slots: 12,
    published: true,
  },
  {
    id: "vol-7",
    title: "Nettoyage du littoral",
    description: "Collecte de déchets sur la plage de Toudja.",
    categoryId: "environnemental",
    location: "توجة",
    institution: "مخيم الشباب توجة",
    date: "2026-06-28",
    slots: 40,
    published: true,
  },
  {
    id: "vol-8",
    title: "Plantation d'arbres",
    description: "Reboisement autour des institutions de jeunesse.",
    categoryId: "environnemental",
    location: "أميزور",
    institution: "بيت الشباب أميزور",
    date: "2026-07-05",
    slots: 30,
    published: true,
  },
  {
    id: "vol-9",
    title: "Formation premiers secours",
    description: "Appui logistique lors des sessions de formation PSC1.",
    categoryId: "urgences",
    location: "بجاية",
    institution: "ديوان مؤسسات الشباب",
    date: "2026-06-30",
    slots: 18,
    published: true,
  },
  {
    id: "vol-10",
    title: "Cellule d'accueil d'urgence",
    description: "Orientation des familles lors d'opérations d'aide rapide.",
    categoryId: "urgences",
    location: "بجاية",
    institution: "دار الشباب",
    date: "2026-07-08",
    slots: 14,
    published: true,
  },
  {
    id: "vol-11",
    title: "Festival jeunes — équipe accueil",
    description: "Accueil du public et orientation pendant le festival.",
    categoryId: "evenementiel",
    location: "بجاية",
    institution: "ديوان مؤسسات الشباب",
    date: "2026-07-12",
    slots: 35,
    published: true,
  },
  {
    id: "vol-12",
    title: "Journée portes ouvertes",
    description: "Animation de stands et présentation des activités.",
    categoryId: "evenementiel",
    location: "تيزي وزو",
    institution: "المركب الرياضي",
    date: "2026-07-15",
    slots: 22,
    published: true,
  },
  {
    id: "vol-13",
    title: "Camp scout — animateurs",
    description: "Encadrement des activités scoutes en plein air.",
    categoryId: "scoutisme",
    location: "توجة",
    institution: "مخيم الشباب توجة",
    date: "2026-07-20",
    slots: 16,
    published: true,
  },
  {
    id: "vol-14",
    title: "Randonnée scoute éducative",
    description: "Accompagnement d'une randonnée découverte de la nature.",
    categoryId: "scoutisme",
    location: "أميزور",
    institution: "بيت الشباب أميزور",
    date: "2026-07-25",
    slots: 12,
    published: true,
  },
]

export function getCategoryById(id: VolunteerCategoryId) {
  return VOLUNTEER_CATEGORIES.find((c) => c.id === id)
}

export function filterOpportunities<
  T extends {
    published: boolean
    categoryId: VolunteerCategoryId
    title: string
    description: string
    location: string
    institution: string
  },
>(opportunities: T[], categoryId: VolunteerCategoryId | "all", query = "") {
  const needle = query.trim().toLowerCase()
  return opportunities.filter((op) => {
    if (!op.published) return false
    if (categoryId !== "all" && op.categoryId !== categoryId) return false
    if (!needle) return true
    return [op.title, op.description, op.location, op.institution]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  })
}
