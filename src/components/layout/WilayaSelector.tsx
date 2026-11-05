import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronDown, MapPin, Search } from "lucide-react"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { useI18n } from "@/context/I18nProvider"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  variant?: "navbar" | "panel"
}

export default function WilayaSelector({ className, variant = "navbar" }: Props) {
  const navigate = useNavigate()
  const { t, locale, dir } = useI18n()
  const { wilayas, selectedCode, selected, setSelectedCode, ready } = useLocationFilter()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setFilter("")
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const label = useMemo(() => {
    if (!selected) return t("nav.allAlgeria")
    const name = locale === "ar" ? selected.name_ar : selected.name
    return `${padWilayaCode(selected.code)} — ${name}`
  }, [locale, selected, t])

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return wilayas
    return wilayas.filter((w) => {
      const code = padWilayaCode(w.code)
      return (
        code.includes(needle) ||
        w.name.toLowerCase().includes(needle) ||
        w.name_ar.includes(filter.trim()) ||
        String(w.code).includes(needle)
      )
    })
  }, [filter, wilayas])

  const choose = (code: number | null) => {
    setSelectedCode(code)
    setOpen(false)
    const params = new URLSearchParams()
    if (code !== null) params.set("wilaya", String(code))
    const qs = params.toString()
    navigate(qs ? `/institutions?${qs}` : "/institutions")
  }

  const isPanel = variant === "panel"

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={!ready}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-full text-sm font-medium transition-colors",
          isPanel
            ? "border border-emerald-500/30 bg-[#041d13] px-3 py-2.5 text-white hover:bg-[#062c1d]"
            : "border border-emerald-500/25 bg-[#031c11]/80 px-2.5 py-1.5 text-white hover:bg-[#052718]"
        )}
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className={cn("truncate text-start", isPanel ? "flex-1" : "max-w-[9.5rem] xl:max-w-[14rem]")}>
          {label}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 opacity-80 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#031c12] text-white shadow-card backdrop-blur-xl",
            dir === "rtl" ? "left-0" : "right-0",
            isPanel && "left-0 right-0 w-full"
          )}
          role="listbox"
        >
          <div className="border-b border-emerald-500/20 p-2">
            <div className="relative">
              <Search
                className={cn(
                  "pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50",
                  dir === "rtl" ? "right-2.5" : "left-2.5"
                )}
              />
              <input
                ref={inputRef}
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("nav.wilayaSearch")}
                className={cn(
                  "h-9 w-full rounded-xl border border-emerald-500/30 bg-[#02130c] py-1 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                  dir === "rtl" ? "pr-8 pl-3" : "pl-8 pr-3"
                )}
              />
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={selectedCode === null}
                onClick={() => choose(null)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-primary/20 hover:text-emerald-300",
                  selectedCode === null && "bg-primary/20 font-semibold text-emerald-300"
                )}
              >
                <span className="flex-1 text-start">{t("nav.allAlgeria")}</span>
                {selectedCode === null && <Check className="h-4 w-4 text-primary" />}
              </button>
            </li>
            {filtered.map((w) => {
              const name = locale === "ar" ? w.name_ar : w.name
              const active = selectedCode === w.code
              return (
                <li key={w.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(w.code)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-primary/20 hover:text-emerald-300",
                      active && "bg-primary/20 font-semibold text-emerald-300"
                    )}
                  >
                    <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground">
                      {padWilayaCode(w.code)}
                    </span>
                    <span className="flex-1 text-start">{name}</span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t("nav.wilayaEmpty")}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
