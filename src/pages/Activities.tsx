import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Calendar, CalendarDays } from "lucide-react"
import ActivityCard from "../components/shared/ActivityCard"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import CategoryFilter from "@/components/shared/CategoryFilter"
import type { CategoryId } from "@/lib/categories"

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

export default function Activities() {
  const { data } = useAppData()
  const { t, dir, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const iconPos = dir === "rtl" ? "right-3" : "left-3"
  const inputPad = dir === "rtl" ? "px-9" : "pl-9 pr-3"

  const events = useMemo(() => {
    let list = data.events.filter((e) => e.published).sort((a, b) => a.date.localeCompare(b.date))
    if (activeCategory !== "all") {
      list = list.filter((e) => e.categoryId === activeCategory)
    }
    const needle = query.trim().toLowerCase()
    if (!needle) return list
    return list.filter((e) =>
      [e.title, e.description, e.location, e.institution].join(" ").toLowerCase().includes(needle)
    )
  }, [data.events, query, activeCategory])

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

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("activities.empty")}
          description={t("common.noResults")}
          actionLabel={t("nav.news")}
          actionTo="/news"
        />
      ) : (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {events.map((ev) => {
            const { day, month } = parseEventDate(ev.date, locale)
            return (
              <Link
                key={ev.id}
                to={`/events/${ev.id}`}
                className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
              >
                <ActivityCard
                  day={day}
                  month={month}
                  title={ev.title}
                  description={ev.description}
                  location={ev.location}
                  institution={ev.institution}
                  image={ev.imageDataUrl || undefined}
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
