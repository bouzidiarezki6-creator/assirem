import { useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Package,
} from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { mapsUrl } from "@/lib/sos"
import type { SosMaterialNeed } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import SosDonationModal from "./SosDonationModal"
import { cn } from "@/lib/utils"

type Props = {
  need: SosMaterialNeed
}

export default function SosMaterialCard({ need }: Props) {
  const { t, locale } = useI18n()
  const { wilayas } = useLocationFilter()
  const [showModal, setShowModal] = useState(false)

  const w = wilayas.find((x) => x.code === need.wilayaCode)
  const wilayaLabel = w
    ? `${padWilayaCode(need.wilayaCode)} — ${locale === "ar" ? w.name_ar : w.name}`
    : padWilayaCode(need.wilayaCode)

  const remaining = Math.max(0, need.requiredQuantity - (need.receivedQuantity || 0))
  const percent = Math.min(
    100,
    Math.round(((need.receivedQuantity || 0) / need.requiredQuantity) * 100)
  )
  const isFulfilled = need.status === "fulfilled" || remaining === 0

  const priorityColors: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  }

  return (
    <>
      <article className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] hover:border-primary/40 hover:shadow-card">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                priorityColors[need.priority] || priorityColors.medium
              )}
            >
              {need.priority === "critical" && <AlertCircle className="h-3 w-3" />}
              {t(`sos.priorities.${need.priority}`)}
            </span>

            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {t(`sos.material.${need.category}`)}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-foreground sm:text-lg leading-snug">
              {need.title}
            </h3>
            {need.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {need.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">
                {need.receivedQuantity} / {need.requiredQuantity} {need.unit}
              </span>
              <span className="font-bold text-primary">{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  isFulfilled ? "bg-emerald-600" : "bg-primary"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-end">
              {isFulfilled ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("sos.material.fulfilled")}
                </span>
              ) : (
                t("sos.material.remaining", { count: remaining, unit: need.unit })
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {need.commune}, {wilayaLabel}
            </span>
            {need.deadline && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {need.deadline}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          {need.lat != null && need.lng != null ? (
            <a
              href={mapsUrl(need.lat, need.lng)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("admin.sosCrm.openMap")}
            </a>
          ) : (
            <span />
          )}

          <button
            type="button"
            disabled={isFulfilled}
            onClick={() => setShowModal(true)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold shadow-soft transition-all active:scale-[0.98]",
              isFulfilled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Package className="h-3.5 w-3.5" />
            {t("sos.material.contribute")}
          </button>
        </div>
      </article>

      {showModal && <SosDonationModal need={need} onClose={() => setShowModal(false)} />}
    </>
  )
}

