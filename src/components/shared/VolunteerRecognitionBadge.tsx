import { useI18n } from "@/context/I18nProvider"
import { getRecognitionLevel } from "@/lib/volunteerPoints"
import { cn } from "@/lib/utils"

type Props = {
  points: number
  className?: string
  showProgress?: boolean
}

/** Professional recognition indicator — not a game-style level bar */
export default function VolunteerRecognitionBadge({
  points,
  className,
  showProgress = true,
}: Props) {
  const { t } = useI18n()
  const level = getRecognitionLevel(points)
  const label = t(`recognition.levels.${level.id}`)
  const nextLabel = level.nextId ? t(`recognition.levels.${level.nextId}`) : null

  return (
    <div className={cn("min-w-[180px] space-y-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
            {t("recognition.title")}
          </p>
          <p className="text-sm font-semibold text-primary leading-snug">{label}</p>
        </div>
        <span className="rounded-md border border-[#c8e6c9] bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
          {t("recognition.pts", { count: level.totalPoints })}
        </span>
      </div>

      {showProgress && (
        <>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={level.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${level.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500">
            {nextLabel
              ? t("recognition.toward", { count: level.remainingToNext, label: nextLabel })
              : t("recognition.max")}
          </p>
        </>
      )}
    </div>
  )
}
