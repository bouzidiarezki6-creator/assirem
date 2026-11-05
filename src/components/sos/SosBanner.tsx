import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"

type Props = {
  urgentCount: number
  onViewUrgent: () => void
}

export default function SosBanner({ urgentCount, onViewUrgent }: Props) {
  const { t, dir } = useI18n()

  if (urgentCount === 0) return null

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-3xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-card to-card p-5 shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-soft">
            <ShieldAlert className="h-6 w-6 animate-pulse" aria-hidden />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
                <AlertTriangle className="h-3 w-3" />
                {t("sos.banner.urgentAlert")} ({urgentCount})
              </span>
            </div>
            <h2 className="text-base font-extrabold text-foreground sm:text-lg">
              {t("sos.banner.urgentDesc")}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewUrgent}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:bg-rose-700 active:scale-[0.98] sm:self-center"
        >
          {t("sos.banner.exploreBtn")}
          <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>
    </div>
  )
}

