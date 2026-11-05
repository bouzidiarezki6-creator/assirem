import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  MapPin,
  Users,
} from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { getProfessionMeta, isCallFull } from "@/lib/sos"
import type { SosCall } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"
import SosCallDetailModal from "./SosCallDetailModal"

type Props = {
  call: SosCall
}

export default function SosCallCard({ call }: Props) {
  const { t, locale } = useI18n()
  const { wilayas } = useLocationFilter()
  const [showDetailModal, setShowDetailModal] = useState(false)

  const w = wilayas.find((x) => x.code === call.wilayaCode)
  const wilayaLabel = w
    ? `${padWilayaCode(call.wilayaCode)} — ${locale === "ar" ? w.name_ar : w.name}`
    : padWilayaCode(call.wilayaCode)

  const isPro = call.type === "professional"
  const profMeta = getProfessionMeta(call.professionId)
  const full = isCallFull(call) || call.status === "full"

  const remaining = Math.max(0, call.requiredSlots - (call.acceptedCount || 0))
  const percent = Math.min(
    100,
    Math.round(((call.acceptedCount || 0) / call.requiredSlots) * 100)
  )

  const urgencyColors: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    urgent: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    moderate: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  }

  return (
    <>
      <article
        onClick={() => setShowDetailModal(true)}
        className="group relative flex flex-col justify-between cursor-pointer rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] hover:border-primary/50 hover:shadow-card hover:-translate-y-0.5"
      >
        <div className="space-y-3.5">
          {/* Header badges: Category + Urgency (if critical or urgent) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isPro ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              )}
            >
              {isPro ? <Briefcase className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              {isPro
                ? call.customProfessionTitle || (profMeta ? t(profMeta.labelKey) : "Professionnel")
                : t("sos.calls.volTitle")}
            </span>

            {call.urgencyLevel === "critical" ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse",
                  urgencyColors.critical
                )}
              >
                <AlertCircle className="h-3 w-3" />
                Urgence critique
              </span>
            ) : call.urgencyLevel === "urgent" ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  urgencyColors.urgent
                )}
              >
                Urgent
              </span>
            ) : null}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors sm:text-lg leading-snug line-clamp-2">
              {call.title}
            </h3>
          </div>

          {/* Location & Date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-0.5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{call.commune}, {wilayaLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{call.startDate}</span>
            </span>
          </div>

          {/* Capacity & Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              {full ? (
                <span className="font-bold text-amber-400">Complet</span>
              ) : (
                <span className="font-bold text-emerald-400">
                  {remaining} place{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
                </span>
              )}
              <span className="text-[11px] font-medium text-muted-foreground">
                {call.acceptedCount || 0}/{call.requiredSlots}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  full ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer CTA: "Voir les détails" */}
        <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {call.receivedCount || 0} candidature{(call.receivedCount || 0) > 1 ? "s" : ""}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowDetailModal(true)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform"
          >
            Voir les détails
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>
      </article>

      <SosCallDetailModal
        call={call}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  )
}
