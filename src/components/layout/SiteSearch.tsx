import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CalendarDays, HandHeart, Building2, Newspaper, Search } from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { cn } from "@/lib/utils"

type SearchHit = {
  id: string
  kind: "institution" | "activity" | "event" | "news" | "volunteer"
  title: string
  subtitle?: string
  to: string
}

type Props = {
  className?: string
  inputClassName?: string
  iconClassName?: string
  variant?: "desktop" | "mobile"
}

export default function SiteSearch({
  className,
  inputClassName,
  iconClassName,
  variant = "desktop",
}: Props) {
  const { data } = useAppData()
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const iconSide = dir === "rtl" ? "right-3" : "left-3"
  const inputPad = dir === "rtl" ? "px-9" : "pl-9 pr-3"

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

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return [] as SearchHit[]

    const out: SearchHit[] = []

    for (const i of data.institutions) {
      if (!i.published) continue
      const hay = [i.name, i.type, i.location].join(" ").toLowerCase()
      if (!hay.includes(needle)) continue
      out.push({
        id: `inst-${i.id}`,
        kind: "institution",
        title: i.name,
        subtitle: i.location || i.type,
        to: `/institutions?q=${encodeURIComponent(query.trim())}${
          i.wilayaCode ? `&wilaya=${i.wilayaCode}` : ""
        }`,
      })
      if (out.length >= 8) break
    }

    for (const a of data.activities) {
      if (!a.published) continue
      const hay = [a.title, a.description, a.location, a.institution].join(" ").toLowerCase()
      if (!hay.includes(needle)) continue
      out.push({
        id: `act-${a.id}`,
        kind: "activity",
        title: a.title,
        subtitle: a.location,
        to: `/activities/${a.id}`,
      })
      if (out.length >= 12) break
    }

    for (const e of data.events) {
      if (!e.published) continue
      const hay = [e.title, e.description, e.location, e.institution].join(" ").toLowerCase()
      if (!hay.includes(needle)) continue
      out.push({
        id: `evt-${e.id}`,
        kind: "event",
        title: e.title,
        subtitle: e.date,
        to: `/events/${e.id}`,
      })
      if (out.length >= 16) break
    }

    for (const n of data.news) {
      if (!n.published) continue
      const hay = [n.title, n.description, n.category].join(" ").toLowerCase()
      if (!hay.includes(needle)) continue
      out.push({
        id: `news-${n.id}`,
        kind: "news",
        title: n.title,
        subtitle: n.category,
        to: "/news",
      })
      if (out.length >= 20) break
    }

    for (const v of data.volunteerOpportunities) {
      if (!v.published) continue
      const hay = [v.title, v.description, v.location, v.institution].join(" ").toLowerCase()
      if (!hay.includes(needle)) continue
      out.push({
        id: `vol-${v.id}`,
        kind: "volunteer",
        title: v.title,
        subtitle: v.location,
        to: `/inscription?volunteer=${v.id}`,
      })
      if (out.length >= 24) break
    }

    return out.slice(0, 10)
  }, [data, query])

  const kindLabel = (kind: SearchHit["kind"]) => {
    switch (kind) {
      case "institution":
        return t("nav.searchKind.institution")
      case "activity":
        return t("nav.searchKind.activity")
      case "event":
        return t("nav.searchKind.event")
      case "news":
        return t("nav.searchKind.news")
      case "volunteer":
        return t("nav.searchKind.volunteer")
    }
  }

  const KindIcon = ({ kind }: { kind: SearchHit["kind"] }) => {
    const cls = "h-4 w-4 shrink-0 text-primary"
    switch (kind) {
      case "institution":
        return <Building2 className={cls} />
      case "activity":
      case "event":
        return <CalendarDays className={cls} />
      case "news":
        return <Newspaper className={cls} />
      case "volunteer":
        return <HandHeart className={cls} />
    }
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    if (hits[0]) {
      navigate(hits[0].to)
      setOpen(false)
      return
    }
    navigate(`/institutions?q=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2",
            iconSide,
            iconClassName
          )}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("nav.search")}
          aria-label={t("nav.search")}
          autoComplete="off"
          className={cn(inputPad, inputClassName)}
        />
      </form>

      {open && query.trim().length >= 2 && (
        <div
          className={cn(
            "absolute z-[60] mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg",
            variant === "desktop"
              ? cn("w-[min(22rem,calc(100vw-2rem))]", dir === "rtl" ? "left-0" : "right-0")
              : "left-0 right-0 w-full"
          )}
        >
          {hits.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-400">{t("nav.searchEmpty")}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <Link
                    to={hit.to}
                    onClick={() => {
                      setOpen(false)
                      setQuery("")
                    }}
                    className="flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/5"
                  >
                    <KindIcon kind={hit.kind} />
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block truncate font-medium text-gray-900">{hit.title}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {kindLabel(hit.kind)}
                        {hit.subtitle ? ` · ${hit.subtitle}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => submit()}
            className="w-full border-t border-gray-100 px-3 py-2.5 text-start text-sm font-medium text-primary hover:bg-primary/5"
          >
            {t("nav.searchAll", { query: query.trim() })}
          </button>
        </div>
      )}
    </div>
  )
}
