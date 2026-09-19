import { useMemo, useState } from "react"
import { Newspaper } from "lucide-react"
import NewsCard from "../components/shared/NewsCard"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { cn } from "@/lib/utils"

export default function News() {
  const { data } = useAppData()
  const { t } = useI18n()
  const [filter, setFilter] = useState("all")

  const filters = [
    { id: "all", label: t("news.all") },
    { id: "أخبار", label: "أخبار" },
    { id: "رياضة", label: "رياضة" },
    { id: "ثقافة", label: "ثقافة" },
    { id: "صحة", label: "صحة" },
  ]

  const published = useMemo(
    () => data.news.filter((n) => n.published).sort((a, b) => b.date.localeCompare(a.date)),
    [data.news]
  )

  const featured = published.find((n) => n.featured) ?? published[0]
  const grid = published.filter((n) => {
    if (featured && n.id === featured.id) return false
    if (filter === "all") return true
    return n.category === filter
  })

  return (
    <div className="page-shell section-gap">
      <PageHeader title={t("news.title")} description={t("news.subtitle")} />

      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-1 bg-white/90 p-1.5 rounded-full border border-border/70 shadow-soft max-w-full backdrop-blur-sm">
          {filters.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-[var(--duration-micro)] ease-[var(--ease-out)]",
                filter === cat.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {featured && filter === "all" && (
        <article className="bg-white rounded-3xl border border-border/60 shadow-soft overflow-hidden flex flex-col md:flex-row md:min-h-[18rem]">
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center items-center md:items-start text-center md:text-start space-y-4">
            <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-primary font-semibold text-xs tracking-wide">
              {featured.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight text-balance">
              {featured.title}
            </h2>
            <p className="type-body">{featured.description}</p>
          </div>
          <div className="w-full md:w-1/2 bg-muted h-52 md:h-auto overflow-hidden">
            {featured.imageDataUrl ? (
              <img src={featured.imageDataUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </article>
      )}

      {grid.length === 0 && !(featured && filter === "all") ? (
        <EmptyState
          icon={Newspaper}
          title={t("news.empty")}
          description={t("common.noResults")}
          actionLabel={t("nav.home")}
          actionTo="/"
        />
      ) : grid.length > 0 ? (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {grid.map((n) => (
            <NewsCard
              key={n.id}
              category={n.category}
              date={n.date.replace(/-/g, "/")}
              title={n.title}
              description={n.description}
              image={n.imageDataUrl || undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
