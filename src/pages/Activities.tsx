import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Calendar, CalendarDays, MapPin, Building2, ArrowRight } from "lucide-react"
import ActivityCard from "../components/shared/ActivityCard"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import CategoryFilter from "@/components/shared/CategoryFilter"
import { ACTIVITY_CATEGORIES, type CategoryId } from "@/lib/categories"

function parseEventDate(dateStr: string, locale: string) {
  const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr)
  if (isNaN(d.getTime())) {
    return { day: "—", month: "" }
  }
  const intlLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-GB"
  const day = d.toLocaleDateString(intlLocale, { day: "numeric" })
  const month = d.toLocaleDateString(intlLocale, { month: "short" })
  return { day, month }
}

type UnifiedActivityItem = {
  id: string
  kind: "activity" | "event"
  title: string
  description: string
  date: string
  day: string
  month: string
  location: string
  institution: string
  categoryId?: CategoryId
  categoryName?: string
  imageDataUrl?: string | null
  href: string
}

export default function Activities() {
  const { data } = useAppData()
  const { t, dir, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const iconPos = dir === "rtl" ? "right-3" : "left-3"
  const inputPad = dir === "rtl" ? "px-9" : "pl-9 pr-3"

  const items = useMemo<UnifiedActivityItem[]>(() => {
    const list: UnifiedActivityItem[] = []

    // 1. Activities added from the Admin Dashboard "Activités" tab
    for (const act of data.activities) {
      if (!act.published) continue
      const { day, month } = act.date
        ? parseEventDate(act.date, locale)
        : { day: act.day || "—", month: act.month || "" }

      const catObj = ACTIVITY_CATEGORIES.find((c) => c.id === act.categoryId)
      const catName = catObj ? (locale === "ar" ? catObj.labelAr : catObj.labelFr) : undefined

      list.push({
        id: `act-${act.id}`,
        kind: "activity",
        title: act.title,
        description: act.description,
        date: act.date || "",
        day: day || act.day || "—",
        month: month || act.month || "",
        location: act.location,
        institution: act.institution,
        categoryId: act.categoryId || "social",
        categoryName: catName,
        imageDataUrl: act.imageDataUrl,
        href: `/activities/${act.id}`,
      })
    }

    // 2. Events added from the Admin Dashboard "Événements" tab
    for (const ev of data.events) {
      if (!ev.published) continue
      const { day, month } = parseEventDate(ev.date, locale)
      const catObj = ACTIVITY_CATEGORIES.find((c) => c.id === ev.categoryId)
      const catName = catObj ? (locale === "ar" ? catObj.labelAr : catObj.labelFr) : undefined

      list.push({
        id: `evt-${ev.id}`,
        kind: "event",
        title: ev.title,
        description: ev.description,
        date: ev.date,
        day,
        month,
        location: ev.location,
        institution: ev.institution,
        categoryId: ev.categoryId || "evenementiel",
        categoryName: catName,
        imageDataUrl: ev.imageDataUrl,
        href: `/events/${ev.id}`,
      })
    }

    // Filter by selected category
    let filtered = list
    if (activeCategory !== "all") {
      filtered = filtered.filter((item) => item.categoryId === activeCategory)
    }

    // Filter by search query
    const needle = query.trim().toLowerCase()
    if (needle) {
      filtered = filtered.filter((item) =>
        [item.title, item.description, item.location, item.institution]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    }

    // Sort by date descending (latest and upcoming first)
    return filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  }, [data.activities, data.events, activeCategory, query, locale])

  return (
    <div className="page-shell section-gap">
      <PageHeader
        title={t("activities.title")}
        description={t("activities.subtitle")}
        hint={t("activities.registerHint")}
      />

      <div className="flex justify-center my-6">
        <CategoryFilter
          selected={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <div className="toolbar-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              viewMode === "calendar"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-white border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t("activities.calendar")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-white border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {t("activities.list")}
          </button>
        </div>

        <div className="relative w-full sm:w-72 lg:w-80">
          <Search className={`absolute ${iconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("activities.search")}
            className={`h-11 w-full rounded-full border border-border bg-white ${inputPad} py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-sm`}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("activities.empty")}
          description={t("common.noResults")}
          actionLabel={t("nav.news")}
          actionTo="/news"
        />
      ) : viewMode === "list" ? (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
            >
              <ActivityCard
                day={item.day}
                month={item.month}
                title={item.title}
                description={item.description}
                location={item.location}
                institution={item.institution}
                categoryName={item.categoryName}
                image={item.imageDataUrl || undefined}
              />
            </Link>
          ))}
        </div>
      ) : (
        /* Calendar / Timeline Agenda View */
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="block rounded-3xl border border-border/70 bg-white p-5 md:p-6 shadow-soft hover:shadow-md transition-all hover:border-primary/40 group interactive-lift"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="bg-primary/10 text-primary border border-primary/20 w-14 h-16 rounded-2xl shrink-0 flex flex-col items-center justify-center font-bold">
                    <span className="text-xl leading-none">{item.day}</span>
                    <span className="text-[11px] uppercase tracking-wide opacity-90 mt-1">{item.month}</span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.categoryName && (
                        <span className="inline-flex rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                          {item.categoryName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.date}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {item.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        {item.institution}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:shrink-0 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:underline">
                    {t("activities.register") || "Participer"}
                    <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

