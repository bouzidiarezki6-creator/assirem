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

export type CategoryId =
  | "social"
  | "educatif"
  | "sante"
  | "environnemental"
  | "urgences"
  | "evenementiel"
  | "scoutisme"

export type Category = {
  id: CategoryId
  labelFr: string
  labelAr: string
  description: string
  icon: LucideIcon
}

export const ACTIVITY_CATEGORIES: Category[] = [
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

export function getCategoryById(id: CategoryId) {
  return ACTIVITY_CATEGORIES.find((c) => c.id === id)
}
