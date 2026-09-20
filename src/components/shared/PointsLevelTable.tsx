import { Award, Check, ShieldAlert } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import { VOLUNTEER_TIERS, getVolunteerTier } from "@/lib/levels"
import { cn } from "@/lib/utils"

type Props = {
  /** Optional points total to highlight current user level */
  points?: number
  /** Optional level override (0-5) */
  currentLevel?: number
  /** Show title + subtitle header */
  showHeader?: boolean
  className?: string
}

export default function PointsLevelTable({
  points,
  currentLevel,
  showHeader = false,
  className,
}: Props) {
  const { t } = useI18n()

  const activeTier =
    currentLevel !== undefined
      ? VOLUNTEER_TIERS.find((tier) => tier.level === currentLevel) ?? null
      : points !== undefined
        ? getVolunteerTier(points)
        : null

  return (
    <div className={cn("space-y-4 text-start", className)}>
      {showHeader && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {t("pointsInfo.dialogTitle")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("pointsInfo.dialogSubtitle")}
            </p>
          </div>
        </div>
      )}

      {/* Desktop / Tablet Table View */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/70 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface/70 border-b border-border/60 text-muted-foreground font-semibold">
              <th className="py-3 px-3.5 w-24 text-start">{t("pointsInfo.colLevel")}</th>
              <th className="py-3 px-3.5 w-28 text-start">{t("pointsInfo.colPoints")}</th>
              <th className="py-3 px-3.5 w-36 text-start">{t("pointsInfo.colStatus")}</th>
              <th className="py-3 px-4 text-start">{t("pointsInfo.colPerks")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {VOLUNTEER_TIERS.map((tier) => {
              const isCurrent = activeTier?.level === tier.level
              const pointsLabel =
                tier.maxPoints === null
                  ? t("pointsInfo.pointsPlus", { min: tier.minPoints })
                  : t("pointsInfo.pointsRange", {
                      min: tier.minPoints,
                      max: tier.maxPoints,
                    })
              const statusName = t(`pointsInfo.level${tier.level}.status`)
              const perkTitle = t(`pointsInfo.level${tier.level}.perkTitle`)
              const perkDesc = t(`pointsInfo.level${tier.level}.perkDesc`)

              return (
                <tr
                  key={tier.level}
                  className={cn(
                    "transition-colors",
                    isCurrent ? "bg-primary/[0.07] font-medium" : "hover:bg-surface/40"
                  )}
                >
                  <td className="py-3.5 px-3.5 whitespace-nowrap align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{tier.icon}</span>
                      <span className="font-bold text-foreground">
                        {tier.level === 0 ? tier.icon : `L${tier.level}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 whitespace-nowrap align-top font-mono text-primary font-semibold">
                    {pointsLabel}
                  </td>
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-semibold text-foreground leading-snug">
                        {statusName}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Check className="h-3 w-3" />
                          {t("pointsInfo.currentLevelBadge")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground block mb-0.5">
                      {perkTitle}
                    </span>
                    <span className="text-[11px] block">{perkDesc}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-2.5">
        {VOLUNTEER_TIERS.map((tier) => {
          const isCurrent = activeTier?.level === tier.level
          const pointsLabel =
            tier.maxPoints === null
              ? t("pointsInfo.pointsPlus", { min: tier.minPoints })
              : t("pointsInfo.pointsRange", {
                  min: tier.minPoints,
                  max: tier.maxPoints,
                })
          const statusName = t(`pointsInfo.level${tier.level}.status`)
          const perkTitle = t(`pointsInfo.level${tier.level}.perkTitle`)
          const perkDesc = t(`pointsInfo.level${tier.level}.perkDesc`)

          return (
            <div
              key={tier.level}
              className={cn(
                "rounded-2xl border p-3.5 text-xs transition-all",
                isCurrent
                  ? "border-primary/40 bg-primary/[0.07] shadow-sm"
                  : "border-border/60 bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{tier.icon}</span>
                  <span className="font-bold text-foreground">
                    {t("pointsInfo.levelName", { level: tier.level })}
                  </span>
                  <span className="text-muted-foreground font-semibold">— {statusName}</span>
                </div>
                <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                  {pointsLabel}
                </span>
              </div>

              {isCurrent && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    <Check className="h-3 w-3" />
                    {t("pointsInfo.currentLevelBadge")}
                  </span>
                </div>
              )}

              <div className="mt-1 pt-2 border-t border-border/40 text-muted-foreground">
                <p className="font-semibold text-foreground mb-0.5">{perkTitle}</p>
                <p className="text-[11px] leading-relaxed">{perkDesc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
        <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <p>{t("pointsInfo.disclaimer")}</p>
      </div>
    </div>
  )
}
