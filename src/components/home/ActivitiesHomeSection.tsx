import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Calendar, CalendarDays, MapPin, Building2, ArrowRight } from "lucide-react"
import ActivityCard from "@/components/shared/ActivityCard"
import EmptyState from "@/components/shared/EmptyState"
import CategoryFilter from "@/components/shared/CategoryFilter"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
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

function resolveCategoryId(catId?: string): CategoryId {
  if (!catId) return "social"
  const c = catId.toLowerCase()
  if (c === "educatif" || c.includes("تربو") || c.includes("éduc") || c.includes("educ")) return "educatif"
  if (c === "sante" || c.includes("صح") || c.includes("sant")) return "sante"
  if (c === "environnemental" || c.includes("بيئ") || c.includes("envir")) return "environnemental"
  if (c === "urgences" || c.includes("طوار") || c.includes("urg")) return "urgences"
  if (c === "scoutisme" || c.includes("كشاف") || c.includes("scout")) return "scoutisme"
  if (c === "social" || c.includes("اجتماع") || c.includes("soci")) return "social"
  return "social"
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

export default function ActivitiesHomeSection() {
  const { data } = useAppData()
  const { t, dir, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const iconPos = dir === "rtl" ? "right-3.5" : "left-3.5"
  const inputPad = dir === "rtl" ? "pe-4 ps-10" : "ps-10 pe-4"

  const items = useMemo<UnifiedActivityItem[]>(() => {
    const list: UnifiedActivityItem[] = []

    // 1. Activities from DataProvider
    for (const act of data.activities) {
      if (!act.published) continue
      const { day, month } = act.date
        ? parseEventDate(act.date, locale)
        : { day: act.day || "—", month: act.month || "" }

      const resolvedCat = resolveCategoryId(act.categoryId)
      const catObj = ACTIVITY_CATEGORIES.find((c) => c.id === resolvedCat)
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
        categoryId: resolvedCat,
        categoryName: catName,
        imageDataUrl: act.imageDataUrl,
        href: `/activities/${act.id}`,
      })
    }

    // 2. Events from DataProvider
    for (const ev of data.events) {
      if (!ev.published) continue
      const { day, month } = parseEventDate(ev.date, locale)
      const resolvedCat = resolveCategoryId(ev.categoryId)
      const catObj = ACTIVITY_CATEGORIES.find((c) => c.id === resolvedCat)
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
        categoryId: resolvedCat,
        categoryName: catName,
        imageDataUrl: ev.imageDataUrl,
        href: `/events/${ev.id}`,
      })
    }

    // Filter by category
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

    // Sort descending by date
    return filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  }, [data.activities, data.events, activeCategory, query, locale])

  // Count initiatives per category
  const counts = useMemo(() => {
    const map: Partial<Record<CategoryId | "all", number>> = {}
    for (const a of data.activities) {
      if (a.published) {
        const cat = resolveCategoryId(a.categoryId)
        map[cat] = (map[cat] || 0) + 1
      }
    }
    for (const e of data.events) {
      if (e.published) {
        const cat = resolveCategoryId(e.categoryId)
        map[cat] = (map[cat] || 0) + 1
      }
    }
    return map
  }, [data.activities, data.events])

  return (
    <section id="activities" className="content-width py-12 md:py-16 scroll-mt-20">
      {/* Section Header */}
      <div className="mx-auto max-w-3xl text-center space-y-3 mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
          {t("activities.title")}
        </h2>
        <p className="text-sm sm:text-base text-emerald-300/80 max-w-xl mx-auto leading-relaxed">
          {t("activities.subtitle")}
        </p>
      </div>

      {/* Category Grid Filter — 6 symmetrical volunteer fields */}
      <div className="w-full max-w-5xl mx-auto mb-8">
        <CategoryFilter
          selected={activeCategory}
          onSelect={setActiveCategory}
          counts={counts}
        />
      </div>

      {/* Toolbar: View Toggle & Search */}
      <div className="toolbar-center mb-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              viewMode === "calendar"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-[#041d13] border border-emerald-500/25 text-white/80 hover:bg-[#062c1d] hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t("activities.calendar")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-[#041d13] border border-emerald-500/25 text-white/80 hover:bg-[#062c1d] hover:text-white"
            }`}
          >
            {t("activities.list")}
          </button>
        </div>

        <div className="relative w-full sm:w-72 lg:w-80">
          <Search className={`absolute ${iconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/70 pointer-events-none`} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("activities.search")}
            className={`h-11 w-full rounded-full border border-emerald-500/25 bg-[#041d13] ${inputPad} py-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-inner`}
          />
        </div>
      </div>

      {/* Items List or Calendar */}
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("activities.empty")}
          description={t("common.noResults")}
          actionLabel={activeCategory !== "all" ? "عرض جميع المجالات" : t("nav.news")}
          actionTo={activeCategory !== "all" ? undefined : "/news"}
          onAction={activeCategory !== "all" ? () => setActiveCategory("all") : undefined}
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
              className="block rounded-3xl border border-emerald-500/20 bg-[#041d13]/85 backdrop-blur-md p-5 md:p-6 shadow-soft hover:shadow-lg transition-all hover:border-emerald-400/50 group interactive-lift"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="bg-primary/20 text-primary border border-primary/30 w-14 h-16 rounded-2xl shrink-0 flex flex-col items-center justify-center font-bold">
                    <span className="text-xl leading-none">{item.day}</span>
                    <span className="text-[11px] uppercase tracking-wide opacity-90 mt-1">{item.month}</span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.categoryName && (
                        <span className="inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          {item.categoryName}
                        </span>
                      )}
                      <span className="text-xs text-white/50 font-mono">
                        {item.date}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-300/80 pt-1">
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
    </section>
  )
}

