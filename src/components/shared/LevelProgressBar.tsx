import { useI18n } from "@/context/I18nProvider"
import { getLevelProgress } from "@/lib/levels"
import PointsLevelInfo from "./PointsLevelInfo"
import { cn } from "@/lib/utils"

type Props = {
  points: number
  className?: string
  compact?: boolean
}

export default function LevelProgressBar({ points, className, compact = false }: Props) {
  const { t } = useI18n()
  const progress = getLevelProgress(points)

  return (
    <div className={cn("min-w-[160px] space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
            {t("levels.level", { n: progress.level })}
          </span>
          <PointsLevelInfo points={points} />
        </div>
        {!compact && (
          <span className="text-gray-500 tabular-nums">
            {t("levels.progress", {
              current: progress.currentInLevel,
              required: progress.requiredForLevel,
            })}
          </span>
        )}
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("levels.aria", { n: progress.level, percent: progress.percent })}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <p className={cn("text-[11px] text-gray-500", compact && "text-center")}>
        {progress.remaining === 0
          ? t("levels.unlocked")
          : t("levels.remaining", { count: progress.remaining, n: progress.level + 1 })}
      </p>
    </div>
  )
}
