import type { KeyboardEvent } from "react"
import { LayoutGrid } from "lucide-react"
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
    id: CategoryId | "all"
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect(id)
    }
  }

  return (
    <div
      role="listbox"
      aria-label="Categories"
      className={cn(
        "flex flex-wrap justify-center gap-3",
        className
      )}
    >
      <button
        type="button"
        role="option"
        aria-selected={selected === "all"}
        onClick={() => onSelect("all")}
        onKeyDown={(e) => onKeyActivate(e, "all")}
        className={cn(
          "group flex w-[9.5rem] sm:w-[10.5rem] flex-col items-center gap-2 rounded-3xl border border-border/60 bg-white p-4 text-center shadow-soft transition-all",
          "hover:border-primary/50 hover:shadow-card hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          selected === "all" &&
            "border-primary bg-primary text-primary-foreground shadow-card hover:bg-primary/90 hover:border-primary/90"
        )}
      >
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors",
            selected === "all" && "bg-white/20 text-white"
          )}
        >
          <LayoutGrid className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-sm font-bold leading-tight">{locale === "ar" ? "الكل" : "Toutes"}</span>
        {locale !== "ar" && (
          <span
            className={cn(
              "text-[11px] text-gray-500",
              selected === "all" && "text-white/80"
            )}
          >
            الكل
          </span>
        )}
        {typeof counts?.all === "number" && (
          <span
            className={cn(
              "rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600",
              selected === "all" && "bg-white/20 text-white"
            )}
          >
            {counts.all}
          </span>
        )}
      </button>

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
            onClick={() => onSelect(cat.id)}
            onKeyDown={(e) => onKeyActivate(e, cat.id)}
            className={cn(
              "group flex w-[9.5rem] sm:w-[10.5rem] flex-col items-center gap-2 rounded-3xl border border-border/60 bg-white p-4 text-center shadow-soft transition-all",
              "hover:border-primary/50 hover:shadow-card hover:bg-primary/5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive &&
                "border-primary bg-primary text-primary-foreground shadow-card hover:bg-primary/90 hover:border-primary/90"
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15",
                isActive && "bg-white/20 text-white group-hover:bg-white/25"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-bold leading-tight">{primary}</span>
            <span
              className={cn(
                "text-[11px] text-gray-500",
                isActive && "text-white/80"
              )}
            >
              {secondary}
            </span>
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600",
                  isActive && "bg-white/20 text-white"
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
