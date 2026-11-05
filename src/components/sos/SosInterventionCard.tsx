import { Calendar, CheckCircle2, Clock, ExternalLink, MapPin, ShieldAlert, Users } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { mapsUrl } from "@/lib/sos"
import type { SosIntervention } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type Props = {
  intervention: SosIntervention
}

export default function SosInterventionCard({ intervention }: Props) {
  const { t, locale } = useI18n()
  const { wilayas } = useLocationFilter()

  const w = wilayas.find((x) => x.code === intervention.wilayaCode)
  const wilayaLabel = w
    ? `${padWilayaCode(intervention.wilayaCode)} — ${locale === "ar" ? w.name_ar : w.name}`
    : padWilayaCode(intervention.wilayaCode)

  const teams = intervention.teams || []
  const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)

  const statusColors: Record<string, { bg: string; icon: typeof CheckCircle2 }> = {
    preparation: { bg: "bg-amber-500/20 text-amber-300 border-amber-500/40", icon: Clock },
    in_progress: { bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: CheckCircle2 },
    suspended: { bg: "bg-rose-500/20 text-rose-300 border-rose-500/40", icon: ShieldAlert },
    completed: { bg: "bg-blue-500/20 text-blue-300 border-blue-500/40", icon: CheckCircle2 },
    cancelled: { bg: "bg-muted text-muted-foreground border-border", icon: ShieldAlert },
  }

  const st = statusColors[intervention.status] || statusColors.preparation
  const StatusIcon = st.icon

  return (
    <article className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] hover:border-primary/40 hover:shadow-card">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold",
              st.bg
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {t(`sos.interventions.status.${intervention.status}`)}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Users className="h-3 w-3" />
            {t("sos.interventions.teamsCount", { count: teams.length })} ({totalMembers} membres)
          </span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-foreground sm:text-lg leading-snug">
            {intervention.title}
          </h3>
          {intervention.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {intervention.description}
            </p>
          )}
        </div>

        {/* Instructions */}
        {intervention.instructions && (
          <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground border border-border/40">
            <p className="font-semibold text-foreground mb-0.5">
              {t("sos.interventions.instructions")}
            </p>
            <p className="line-clamp-2">{intervention.instructions}</p>
          </div>
        )}

        {/* Teams list preview */}
        {teams.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <p className="text-xs font-semibold text-foreground">Équipes déployées :</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {teams.slice(0, 4).map((tm) => (
                <div key={tm.id} className="rounded-xl bg-muted/20 p-2.5 text-xs">
                  <p className="font-bold text-foreground line-clamp-1">{tm.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Chef : {tm.leaderName} ({tm.members?.length || 0} membres)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location & Coordinator */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {intervention.commune}, {wilayaLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {intervention.startDate} {intervention.endDate ? `→ ${intervention.endDate}` : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
        <span className="text-[11px] text-muted-foreground">
          Coordination : <strong className="text-foreground">{intervention.coordinatorName}</strong>
        </span>

        {intervention.lat != null && intervention.lng != null && (
          <a
            href={mapsUrl(intervention.lat, intervention.lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("admin.sosCrm.openMap")}
          </a>
        )}
      </div>
    </article>
  )
}

