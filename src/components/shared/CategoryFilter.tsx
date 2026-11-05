import type { KeyboardEvent } from "react"
import {
  ACTIVITY_CATEGORIES,
  type CategoryId,
} from "@/lib/categories"
import { cn } from "@/lib/utils"
import { useI18n } from "@/context/I18nProvider"

type Props = {
  selected: CategoryId | "all"
  onSelect: (id: CategoryId | "all") => void
  counts?: Partial<Record<CategoryId | "all", number>>
  className?: string
}

export default function CategoryFilter({
  selected,
  onSelect,
  counts,
  className,
}: Props) {
  const { locale } = useI18n()

  function onKeyActivate(
    e: KeyboardEvent<HTMLButtonElement>,
    id: CategoryId
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect(selected === id ? "all" : id)
    }
  }

  return (
    <div
      role="listbox"
      aria-label="Volunteer Fields"
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto w-full px-2",
        className
      )}
    >
      {ACTIVITY_CATEGORIES.map((cat) => {
        const Icon = cat.icon
        const isActive = selected === cat.id
        const count = counts?.[cat.id]
        const primary = locale === "ar" ? cat.labelAr : cat.labelFr
        const secondary = locale === "ar" ? cat.labelFr : cat.labelAr

        return (
          <button
            key={cat.id}
            type="button"
            role="option"
            aria-selected={isActive}
            title={cat.description}
            onClick={() => onSelect(isActive ? "all" : cat.id)}
            onKeyDown={(e) => onKeyActivate(e, cat.id)}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-2 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-center transition-all duration-300 cursor-pointer select-none",
              "border border-emerald-500/25 bg-[#041d13]/85 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.35),_inset_0_1px_0_rgba(255,255,255,0.06)]",
              "hover:border-emerald-400/60 hover:bg-[#062c1d] hover:scale-[1.03] active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive &&
                "border-emerald-400 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white shadow-[0_0_24px_rgba(0,255,136,0.45),_0_6px_20px_rgba(0,0,0,0.4)] scale-[1.03] hover:bg-gradient-to-br hover:from-emerald-400 hover:to-green-500 hover:border-emerald-300"
            )}
          >
            {/* Category Icon Badge */}
            <span
              className={cn(
                "flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/25",
                isActive && "bg-white/25 text-white border-white/40 shadow-inner group-hover:scale-105"
              )}
            >
              <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" aria-hidden />
            </span>

            {/* Labels */}
            <div className="flex flex-col items-center min-w-0">
              <span
                className={cn(
                  "text-xs sm:text-sm font-extrabold leading-tight text-white transition-colors group-hover:text-emerald-300",
                  isActive && "text-white group-hover:text-white"
                )}
              >
                {primary}
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] text-emerald-300/70 font-medium transition-colors mt-0.5",
                  isActive && "text-white/80"
                )}
              >
                {secondary}
              </span>
            </div>

            {/* Category Initiative Count Badge */}
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 mt-1",
                  isActive && "bg-white/25 text-white border-white/40"
                )}
              >
                {count} {locale === "ar" ? "مبادرات" : "actions"}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
