import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Newspaper, ArrowRight, ArrowLeft } from "lucide-react"
import NewsCard from "../components/shared/NewsCard"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import CategoryFilter from "@/components/shared/CategoryFilter"
import { ACTIVITY_CATEGORIES, type CategoryId } from "@/lib/categories"
import type { NewsArticle } from "@/lib/types"

function matchesCategory(n: NewsArticle, catId: CategoryId | "all"): boolean {
  if (catId === "all") return true
  if (n.categoryId === catId) return true
  if (n.category === catId) return true

  const map: Record<CategoryId, string[]> = {
    social: ["social", "اجتماعي", "Social"],
    educatif: ["educatif", "تربوي", "Éducatif", "Educatif"],
    sante: ["sante", "صحة", "Santé", "Sante"],
    environnemental: ["environnemental", "بيئي", "Environnemental"],
    urgences: ["urgences", "طوارئ", "Urgences"],
    scoutisme: ["scoutisme", "كشافة", "Scoutisme"],
    evenementiel: ["evenementiel", "تظاهرات", "Événementiel"],
  }
  const aliases = map[catId]
  if (aliases && aliases.some((a) => a.toLowerCase() === (n.category || "").toLowerCase())) {
    return true
  }
  return false
}

export default function News() {
  const { data } = useAppData()
  const { t, dir } = useI18n()
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all")

  const ReadArrow = dir === "rtl" ? ArrowLeft : ArrowRight

  const published = useMemo(
    () => data.news.filter((n) => n.published).sort((a, b) => b.date.localeCompare(a.date)),
    [data.news]
  )

  // Compute counts per category for category badges
  const counts = useMemo(() => {
    const acc: Partial<Record<CategoryId | "all", number>> = { all: published.length }
    for (const cat of ACTIVITY_CATEGORIES) {
      acc[cat.id] = published.filter((n) => matchesCategory(n, cat.id)).length
    }
    return acc
  }, [published])

  const featured = published.find((n) => n.featured) ?? published[0]

  const grid = useMemo(() => {
    if (activeCategory === "all") {
      return published.filter((n) => (featured ? n.id !== featured.id : true))
    }
    return published.filter((n) => matchesCategory(n, activeCategory))
  }, [published, activeCategory, featured])

  return (
    <div className="page-shell section-gap">
      <PageHeader title={t("news.title")} description={t("news.subtitle")} />

      <div className="flex justify-center mb-8">
        <CategoryFilter
          selected={activeCategory}
          onSelect={setActiveCategory}
          counts={counts}
        />
      </div>

      {featured && activeCategory === "all" && (
        <Link
          to={`/news/${featured.id}`}
          className="group block rounded-3xl border border-border/60 bg-white shadow-soft overflow-hidden interactive-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <article className="flex flex-col md:flex-row md:min-h-[18rem]">
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center items-center md:items-start text-center md:text-start space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-primary font-semibold text-xs tracking-wide">
                  {featured.category}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {featured.date.replace(/-/g, "/")}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight text-balance group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="type-body line-clamp-3">{featured.description}</p>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-primary pt-2">
                <span>{t("news.readArticle") || "Lire l'article"}</span>
                <ReadArrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>
            </div>
            <div className="w-full md:w-1/2 bg-muted h-56 md:h-auto overflow-hidden relative">
              {featured.imageDataUrl ? (
                <img
                  src={featured.imageDataUrl}
                  alt={featured.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : null}
            </div>
          </article>
        </Link>
      )}

      {grid.length === 0 && !(featured && activeCategory === "all") ? (
        <EmptyState
          icon={Newspaper}
          title={t("news.empty")}
          description={t("common.noResults")}
          actionLabel={activeCategory !== "all" ? "عرض جميع الأخبار" : t("nav.home")}
          actionTo={activeCategory !== "all" ? undefined : "/"}
          onAction={activeCategory !== "all" ? () => setActiveCategory("all") : undefined}
        />
      ) : grid.length > 0 ? (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {grid.map((n) => (
            <Link
              key={n.id}
              to={`/news/${n.id}`}
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
            >
              <NewsCard
                category={n.category}
                date={n.date.replace(/-/g, "/")}
                title={n.title}
                description={n.description}
                image={n.imageDataUrl || undefined}
              />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
