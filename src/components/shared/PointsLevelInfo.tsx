import { useEffect, useId, useState } from "react"
import { Info, X, Award } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import { cn } from "@/lib/utils"
import PointsLevelTable from "./PointsLevelTable"

type Props = {
  /** Optional points total to highlight current user level */
  points?: number
  /** Optional level override (0-5) */
  currentLevel?: number
  /** Custom class for the trigger button */
  triggerClassName?: string
  /** Button size or style */
  size?: "sm" | "md"
}

export default function PointsLevelInfo({
  points,
  currentLevel,
  triggerClassName,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false)
  const { t, dir } = useI18n()
  const titleId = useId()
  const descId = useId()

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!open) return
    const originalStyle = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={t("pointsInfo.buttonAria")}
        title={t("pointsInfo.buttonAria")}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-muted-foreground transition-all duration-200",
          "hover:text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "active:scale-95 shrink-0 select-none",
          size === "sm" ? "h-5 w-5" : "h-6 w-6",
          triggerClassName
        )}
      >
        <Info className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          dir={dir}
        >
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className={cn(
              "relative z-10 w-full sm:max-w-2xl bg-white border border-border/80 shadow-2xl overflow-hidden",
              "rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col",
              "animate-in zoom-in-[0.98] duration-150 text-start"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-surface/80 px-5 sm:px-6 py-4 backdrop-blur">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    {t("pointsInfo.dialogTitle")}
                  </h2>
                  <p id={descId} className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t("pointsInfo.dialogSubtitle")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <PointsLevelTable points={points} currentLevel={currentLevel} />
            </div>

            <div className="border-t border-border/60 bg-surface/50 px-5 sm:px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
