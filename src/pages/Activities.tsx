import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Calendar, CalendarDays } from "lucide-react"
import ActivityCard from "../components/shared/ActivityCard"
import EventAnnouncement from "@/components/events/EventAnnouncement"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

export default function Activities() {
  const { data } = useAppData()
  const { t, dir } = useI18n()
  const [query, setQuery] = useState("")
  const iconPos = dir === "rtl" ? "right-3" : "left-3"
  const inputPad = dir === "rtl" ? "px-9" : "pl-9 pr-3"

  const activities = useMemo(() => {
    const published = data.activities.filter((a) => a.published)
    const needle = query.trim().toLowerCase()
    if (!needle) return published
    return published.filter((a) =>
      [a.title, a.description, a.location, a.institution].join(" ").toLowerCase().includes(needle)
    )
  }, [data.activities, query])

  const events = useMemo(
    () => data.events.filter((e) => e.published).sort((a, b) => a.date.localeCompare(b.date)),
    [data.events]
  )

  return (
    <div className="page-shell section-gap">
      <PageHeader
        title={t("activities.title")}
        description={t("activities.subtitle")}
        hint={t("activities.registerHint")}
      />

      {events.length > 0 && (
        <section className="space-y-6">
          <h2 className="type-h2 text-center">{t("activities.eventsTitle")}</h2>
          <div className="grid w-full gap-5 md:grid-cols-2">
            {events.map((ev) => (
              <EventAnnouncement key={ev.id} event={ev} />
            ))}
          </div>
        </section>
      )}

      <div className="toolbar-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 bg-white border border-border px-4 py-2.5 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <Calendar className="w-4 h-4" />
            {t("activities.calendar")}
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-full text-sm font-semibold shadow-soft"
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

      {activities.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("activities.empty")}
          description={t("common.noResults")}
          actionLabel={t("nav.volunteer")}
          actionTo="/benevolat"
        />
      ) : (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {activities.map((act) => (
            <Link
              key={act.id}
              to={`/activities/${act.id}`}
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
            >
              <ActivityCard
                day={act.day}
                month={act.month}
                title={act.title}
                description={act.description}
                location={act.location}
                institution={act.institution}
                image={act.imageDataUrl || undefined}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
