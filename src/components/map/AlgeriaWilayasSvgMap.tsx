import { useEffect, useMemo, useRef, useState } from "react"
import { useI18n } from "@/context/I18nProvider"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

export type SelectedWilaya = {
  code: number
  nameLatin: string
  nameAr: string
}

type Props = {
  selectedCode: number | null
  hoveredCode: number | null
  onHover: (w: SelectedWilaya | null) => void
  onSelect: (w: SelectedWilaya) => void
  className?: string
}

export default function AlgeriaWilayasSvgMap({
  selectedCode,
  hoveredCode,
  onHover,
  onSelect,
  className,
}: Props) {
  const { locale, t } = useI18n()
  const hostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  const activeCode = hoveredCode ?? selectedCode

  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  onHoverRef.current = onHover
  onSelectRef.current = onSelect

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/geo/algeria-69-wilayas.svg")
        if (!res.ok) throw new Error("svg")
        const text = await res.text()
        if (cancelled || !hostRef.current) return
        hostRef.current.innerHTML = text
        const svg = hostRef.current.querySelector("svg")
        if (!svg) throw new Error("nosvg")
        svg.setAttribute("width", "100%")
        svg.setAttribute("height", "100%")
        svg.style.maxHeight = "100%"
        svg.style.display = "block"

        const paths = svg.querySelectorAll("path[id]")
        paths.forEach((path) => {
          const el = path as SVGPathElement
          el.style.cursor = "pointer"
          el.style.transition = "fill 160ms ease, stroke-width 160ms ease, filter 160ms ease"
          el.setAttribute("tabindex", "0")
          el.setAttribute("role", "button")

          const code = Number(el.id)
          const nameLatin = el.getAttribute("data-name-latin") ?? el.id
          const nameAr = el.getAttribute("data-name-ar") ?? nameLatin
          const label = locale === "ar" ? nameAr : nameLatin
          el.setAttribute("aria-label", label)

          const payload: SelectedWilaya = { code, nameLatin, nameAr }

          el.addEventListener("mouseenter", () => onHoverRef.current(payload))
          el.addEventListener("mouseleave", () => onHoverRef.current(null))
          el.addEventListener("focus", () => onHoverRef.current(payload))
          el.addEventListener("blur", () => onHoverRef.current(null))
          el.addEventListener("click", () => onSelectRef.current(payload))
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onSelectRef.current(payload)
            }
          })
        })
        setReady(true)
      } catch {
        if (!cancelled) setError(true)
      }
    }
    void load()
    return () => {
      cancelled = true
      if (hostRef.current) hostRef.current.innerHTML = ""
      setReady(false)
    }
  }, [locale])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !ready) return
    const paths = host.querySelectorAll("path[id]")
    paths.forEach((path) => {
      const el = path as SVGPathElement
      const code = Number(el.id)
      const isSelected = selectedCode === code
      const isHovered = hoveredCode === code
      if (isSelected) {
        el.style.fill = "#00ff88"
        el.style.stroke = "#ffffff"
        el.style.strokeWidth = "12"
        el.style.filter = "drop-shadow(0 0 20px rgba(0,255,136,1)) drop-shadow(0 0 6px #00ff88)"
      } else if (isHovered) {
        el.style.fill = "#059669"
        el.style.stroke = "#ffffff"
        el.style.strokeWidth = "8"
        el.style.filter = "drop-shadow(0 0 14px rgba(0,255,136,0.85))"
      } else {
        el.style.fill = "rgba(4, 45, 26, 0.75)"
        el.style.stroke = "#00ff88"
        el.style.strokeWidth = "2"
        el.style.filter = "drop-shadow(0 0 1px rgba(0,255,136,0.2))"
      }
    })
  }, [selectedCode, hoveredCode, ready, activeCode])

  const tip = useMemo(() => {
    if (!hostRef.current || activeCode == null) return null
    const el = hostRef.current.querySelector(`path[id="${padWilayaCode(activeCode)}"]`) as SVGPathElement | null
    if (!el) return null
    return locale === "ar"
      ? el.getAttribute("data-name-ar")
      : el.getAttribute("data-name-latin")
  }, [activeCode, locale, ready])

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={hostRef}
        className="aspect-[1/0.97] w-full overflow-hidden rounded-2xl bg-black/15 backdrop-blur-xl border border-emerald-400/20 p-2 sm:p-4 shadow-inner [&_svg]:h-full [&_svg]:w-full"
        aria-label={t("home.mapPlaceholder")}
      />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-emerald-400">
          {t("common.loading")}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400">
          {t("map.loadError")}
        </div>
      )}
      {tip && (
        <div className="pointer-events-none absolute start-4 top-4 rounded-xl bg-[#02140c]/90 px-3.5 py-1.5 text-sm font-bold text-emerald-300 shadow-xl border border-emerald-500/40 backdrop-blur-md">
          {tip}
          <span className="ms-2 text-xs font-normal text-white/60">
            {padWilayaCode(activeCode!)}
          </span>
        </div>
      )}
    </div>
  )
}
