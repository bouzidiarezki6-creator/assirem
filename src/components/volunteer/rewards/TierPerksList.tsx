import { useState } from "react"
import {
  Award,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react"
import { VOLUNTEER_TIERS, type VolunteerTierId } from "@/lib/levels"
import type { PerkStatus } from "@/lib/rewardsGamification"
import { cn } from "@/lib/utils"

type Props = {
  currentTierId: VolunteerTierId
  currentPoints: number
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

export default function TierPerksList({ currentTierId, currentPoints }: Props) {
  const [selectedTierId, setSelectedTierId] = useState<VolunteerTierId>(currentTierId)
  const selectedTier = VOLUNTEER_TIERS.find((t) => t.id === selectedTierId) || VOLUNTEER_TIERS[0]

  return (
    <div className="space-y-6">
      {/* 1. Header with Status Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-700" />
            Grille Officielle des 6 Paliers & Avantages Associés
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chaque palier franchi donne accès à des droits civiques, opportunités et distinctions officielles.
          </p>
        </div>

        {/* Legend of Statuses */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <PerkStatusBadge status="available" />
          <PerkStatusBadge status="partnership_pending" />
          <PerkStatusBadge status="in_development" />
        </div>
      </div>

      {/* 2. Tier Selection Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {VOLUNTEER_TIERS.map((tier) => {
          const isSelected = selectedTierId === tier.id
          const isUnlocked = currentPoints >= tier.minPoints
          const isCurrent = currentTierId === tier.id

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTierId(tier.id)}
              className={cn(
                "relative flex flex-col items-center p-3 rounded-2xl border text-center transition-all",
                isSelected
                  ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                  : "border-border/70 bg-white hover:bg-muted/30",
                !isUnlocked && "opacity-75"
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2 start-1/2 -translate-x-1/2 rounded-full bg-emerald-700 text-white px-2 py-0.2 text-[9px] font-black uppercase tracking-wider shadow-xs">
                  Actuel
                </span>
              )}

              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl font-black text-xs mb-1.5 transition-colors",
                  tier.id === "ambassadeur"
                    ? "bg-amber-100 text-amber-900 border border-amber-300 font-extrabold"
                    : isUnlocked
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tier.icon}
              </div>

              <span className="text-xs font-black text-foreground">{tier.labelFr}</span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {tier.maxPoints ? `${tier.minPoints}–${tier.maxPoints} pts` : `${tier.minPoints}+ pts`}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. Detailed Perks Card for Selected Tier */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-base shadow-xs",
                selectedTier.id === "ambassadeur"
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                  : selectedTier.id === "exemplaire"
                  ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              {selectedTier.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground">
                  Palier {selectedTier.icon} : {selectedTier.labelFr}
                </h3>
                <span className="text-xs font-bold text-muted-foreground font-arabic">
                  ({selectedTier.labelAr})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedTier.description}
              </p>
            </div>
          </div>

          <div className="text-start sm:text-end shrink-0">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Seuil d'accès
            </span>
            <span className="text-base font-extrabold text-foreground font-mono">
              {selectedTier.maxPoints
                ? `${selectedTier.minPoints} à ${selectedTier.maxPoints} points`
                : `Dès ${selectedTier.minPoints} points`}
            </span>
          </div>
        </div>

        {/* Institutional Caution Warning for N3 (Confirmé) */}
        {selectedTier.id === "confirme" && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5 text-amber-950">
                Règle Institutionnelle d'Encadrement :
              </p>
              <p>
                Atteindre le Palier N3 (Confirmé) confère une <strong>éligibilité</strong> aux missions à responsabilité, mais ne donne pas automatiquement le droit de diriger une équipe ou une intervention d'urgence SOS. Une formation dédiée, une évaluation des compétences et une validation administrative formelle sont obligatoirement requises.
              </p>
            </div>
          </div>
        )}

        {/* Perks Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {selectedTier.perks.map((perk) => (
            <div
              key={perk.id}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-surface/30 p-4 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{perk.title}</span>
                  </h4>
                  <PerkStatusBadge status={perk.status} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {perk.description}
                </p>
              </div>

              {perk.accessCondition && (
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                  <span>Condition : {perk.accessCondition}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
