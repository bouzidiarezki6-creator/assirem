import { useMemo, useState } from "react"
import { HandHeart, Search } from "lucide-react"
import VolunteerCategoryFilter from "@/components/shared/VolunteerCategoryFilter"
import VolunteerOpportunityCard from "@/components/shared/VolunteerOpportunityCard"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import {
  VOLUNTEER_CATEGORIES,
  filterOpportunities,
  type VolunteerCategoryId,
} from "@/lib/volunteer"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

export default function Volunteer() {
  const { data } = useAppData()
  const { t, dir } = useI18n()
  const [selected, setSelected] = useState<VolunteerCategoryId | "all">("all")
  const [query, setQuery] = useState("")
  const iconPos = dir === "rtl" ? "right-3" : "left-3"
  const inputPad = dir === "rtl" ? "px-9" : "pl-9 pr-3"

  const published = useMemo(
    () => data.volunteerOpportunities.filter((o) => o.published),
    [data.volunteerOpportunities]
  )

  const counts = useMemo(() => {
    const base: Partial<Record<VolunteerCategoryId | "all", number>> = {
      all: published.length,
    }
    for (const cat of VOLUNTEER_CATEGORIES) {
      base[cat.id] = published.filter((o) => o.categoryId === cat.id).length
    }
    return base
  }, [published])

  const filtered = useMemo(
    () => filterOpportunities(published, selected, query),
    [published, selected, query]
  )

  const activeLabel =
    selected === "all"
      ? t("volunteer.allCategories")
      : t(`volunteer.category.${selected}`)

  return (
    <div className="page-shell section-gap">
      <PageHeader
        title={t("volunteer.title")}
        description={t("volunteer.subtitle")}
      />

      <section className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="type-h2">{t("volunteer.categories")}</h2>
          <p className="type-caption">
            {t("volunteer.activeSelection")} :{" "}
            <span className="font-semibold text-primary">{activeLabel}</span>
          </p>
          {selected !== "all" && (
            <button
              type="button"
              onClick={() => setSelected("all")}
              className="mt-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full px-2"
            >
              {t("volunteer.resetFilter")}
            </button>
          )}
        </div>
        <div className="w-full">
          <VolunteerCategoryFilter selected={selected} onSelect={setSelected} counts={counts} />
        </div>
      </section>

      <section className="space-y-6">
        <div className="toolbar-center">
          <h2 className="type-h2">
            {t("volunteer.opportunities")}
            <span className="ms-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <div className="relative w-full sm:w-72 lg:w-80">
            <Search className={`absolute ${iconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("volunteer.search")}
              className={`h-11 w-full rounded-full border border-border bg-white ${inputPad} py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25`}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title={t("volunteer.emptyTitle")}
            description={t("volunteer.emptyHint")}
            actionLabel={selected !== "all" ? t("volunteer.resetFilter") : t("nav.activities")}
            actionTo={selected !== "all" ? undefined : "/activities"}
            onAction={selected !== "all" ? () => setSelected("all") : undefined}
          />
        ) : (
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {filtered.map((op) => (
              <VolunteerOpportunityCard key={op.id} opportunity={op} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
