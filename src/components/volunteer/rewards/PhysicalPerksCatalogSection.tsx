import { useMemo, useState } from "react"
import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  GraduationCap,
  IdCard,
  Medal,
  Percent,
  Shirt,
  Sparkles,
  Ticket,
  Trophy,
  Info,
} from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import type { PerkStatus } from "@/lib/rewardsGamification"
import type { VolunteerTierId } from "@/lib/levels"

type Props = {
  currentTierId: VolunteerTierId
}

function getPerkIcon(iconName: string) {
  switch (iconName) {
    case "IdCard":
      return IdCard
    case "Shirt":
      return Shirt
    case "Briefcase":
      return Briefcase
    case "Medal":
      return Medal
    case "Trophy":
      return Trophy
    case "Ticket":
      return Ticket
    case "Percent":
      return Percent
    case "GraduationCap":
      return GraduationCap
    default:
      return Award
  }
}

function PerkStatusBadge({ status }: { status: PerkStatus }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        Disponible
      </span>
    )
  }
  if (status === "partnership_pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
        <Clock className="h-3 w-3 text-blue-600" />
        Sous partenariat
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
      <Sparkles className="h-3 w-3 text-amber-600" />
      En développement
    </span>
  )
}

export default function PhysicalPerksCatalogSection({ currentTierId: _currentTierId }: Props) {
  const { getPhysicalPerksCatalog } = useAppData()
  const perks = useMemo(() => getPhysicalPerksCatalog(), [getPhysicalPerksCatalog])

  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredPerks = useMemo(() => {
    if (categoryFilter === "all") return perks
    return perks.filter((p) => p.category === categoryFilter)
  }, [perks, categoryFilter])

  return (
    <div className="space-y-6">
      {/* 1. Header & Non-Monetary Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-700" />
            Catalogue des Récompenses Physiques & Partenariats
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dotations matérielles, équipements officiels, formations certifiées et invitations institutionnelles.
          </p>
        </div>

        {/* Filter by Category */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Toutes les dotations</option>
            <option value="equipment">Équipements & Tenues</option>
            <option value="trophy">Trophées & Médailles</option>
            <option value="training">Formations certifiantes</option>
            <option value="event">Invitations & Événements</option>
            <option value="partner">Avantages Partenaires</option>
          </select>
        </div>
      </div>

      {/* Non-Monetary Institutional Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface/40 p-4 text-xs text-muted-foreground leading-relaxed">
        <Info className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
        <p>
          <strong>Règle d'Éthique Citoyenne :</strong> Les points de solidarité ne constituent en aucun cas une monnaie d'échange et ne peuvent faire l'objet d'aucune conversion financière. Les avantages physiques et partenariats sont attribués à titre de reconnaissance morale et de soutien logistique à l'action bénévole.
        </p>
      </div>

      {/* Perks Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPerks.map((perk) => {
          const IconComponent = getPerkIcon(perk.icon)

          return (
            <div
              key={perk.id}
              className="flex flex-col justify-between rounded-3xl border border-border/70 bg-white p-5 shadow-xs hover:border-emerald-200 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <PerkStatusBadge status={perk.status} />
                </div>

                <div>
                  <h3 className="text-xs font-black text-foreground">{perk.nameFr}</h3>
                  <p className="text-[10px] text-muted-foreground font-arabic mt-0.5">
                    {perk.nameAr}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {perk.descriptionFr}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/50 text-[10px] font-mono">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Palier Requis :</span>
                  <span className="font-bold text-foreground uppercase">
                    Palier {perk.minTier}
                  </span>
                </div>

                {perk.partnerName && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Partenaire :</span>
                    <span className="font-semibold text-emerald-700">{perk.partnerName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Disponibilité :</span>
                  <span className="text-foreground">
                    {perk.spotsAvailable !== null ? `${perk.spotsAvailable} places` : "Généralisée"}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
