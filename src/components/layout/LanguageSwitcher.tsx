import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { LOCALES, type Locale } from "@/i18n"
import { useI18n } from "@/context/I18nProvider"
import { cn } from "@/lib/utils"

type Props = {
  variant?: "navbar" | "plain"
}

export default function LanguageSwitcher({ variant = "navbar" }: Props) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("common.language")}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors",
          variant === "navbar"
            ? "text-white/90 hover:bg-white/10 hover:text-white"
            : "border border-emerald-500/30 bg-[#041a10] text-white hover:bg-white/10"
        )}
      >
        <span className="text-base leading-none" aria-hidden>
          {current.flag}
        </span>
        <span className="hidden sm:inline">{current.nativeLabel}</span>
        <span className="sm:hidden uppercase tracking-wide">{current.code}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-80 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("common.language")}
          className="absolute end-0 z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#031c12] py-1 text-white shadow-card backdrop-blur-xl"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={locale === l.code}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-primary/20 hover:text-emerald-300 focus-visible:outline-none focus-visible:bg-primary/20",
                  locale === l.code && "bg-primary/20 font-semibold text-emerald-300"
                )}
                onClick={() => {
                  setLocale(l.code as Locale)
                  setOpen(false)
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base leading-none" aria-hidden>
                    {l.flag}
                  </span>
                  <span>
                    <span className="font-medium text-white">{l.nativeLabel}</span>
                    <span className="ms-2 text-xs text-white/50">{l.label}</span>
                  </span>
                </span>
                {locale === l.code ? (
                  <Check className="h-4 w-4 text-primary" aria-hidden />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-transparent" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
