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
        el.style.fill = "#1B7D67"
        el.style.stroke = "#ffffff"
        el.style.strokeWidth = "14"
        el.style.filter = "drop-shadow(0 0 10px rgba(27,125,103,0.45))"
      } else if (isHovered) {
        el.style.fill = "#4DB6A0"
        el.style.stroke = "#146B58"
        el.style.strokeWidth = "10"
        el.style.filter = "drop-shadow(0 0 8px rgba(27,125,103,0.35))"
      } else {
        el.style.fill = "#A8D5C8"
        el.style.stroke = "#1B7D67"
        el.style.strokeWidth = "4"
        el.style.filter = "none"
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
        className="aspect-[1/0.97] w-full overflow-hidden rounded-xl bg-primary/10 border border-green-100 [&_svg]:h-full [&_svg]:w-full"
        aria-label={t("home.mapPlaceholder")}
      />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
          {t("common.loading")}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600">
          {t("map.loadError")}
        </div>
      )}
      {tip && (
        <div className="pointer-events-none absolute start-3 top-3 rounded-md bg-white/95 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm border border-green-100">
          {tip}
          <span className="ms-2 text-xs font-normal text-gray-500">
            {padWilayaCode(activeCode!)}
          </span>
        </div>
      )}
    </div>
  )
}
