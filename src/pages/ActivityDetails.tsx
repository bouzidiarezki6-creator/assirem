import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Building2, Check, ImageIcon, MapPin, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { ACTIVITY_CATEGORIES } from "@/lib/categories"

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

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAppData()
  const { t, dir, locale } = useI18n()
  const [copied, setCopied] = useState(false)

  const activity = data.activities.find((a) => a.id === id && a.published)

  if (!activity) {
    return (
      <div className="page-shell text-center space-y-4">
        <h1 className="type-h2">{t("activities.notFound")}</h1>
        <p className="type-body mx-auto max-w-md">{t("activities.notFoundHint")}</p>
        <Button asChild>
          <Link to="/activities">{t("activities.backList")}</Link>
        </Button>
      </div>
    )
  }

  const category = ACTIVITY_CATEGORIES.find((c) => c.id === activity.categoryId)
  const CategoryIcon = category?.icon
  const categoryLabel = category ? (locale === "ar" ? category.labelAr : category.labelFr) : null

  const parsedDate = activity.date ? parseEventDate(activity.date, locale) : null
  const displayDay = parsedDate?.day || activity.day || "—"
  const displayMonth = parsedDate?.month || activity.month || ""

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="relative w-full aspect-[16/9] max-h-[420px] md:max-h-[480px] bg-muted overflow-hidden">
        {activity.imageDataUrl ? (
          <img
            src={activity.imageDataUrl}
            alt={activity.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground bg-gradient-to-br from-primary/10 to-muted">
            <ImageIcon className="h-12 w-12 opacity-40" aria-hidden />
            <span className="text-sm">{t("events.noImage")}</span>
          </div>
        )}
      </div>

      <div className="content-width -mt-10 md:-mt-14 relative z-10 pb-16">
        <article className="rounded-3xl border border-border/70 bg-white shadow-soft p-6 md:p-10 space-y-6 max-w-4xl mx-auto w-full text-center md:text-start">
          <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Link to="/activities">
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                {t("activities.backList")}
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2 text-xs font-semibold rounded-full"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {t("news.copied") || "Lien copié !"}
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("news.share") || "Partager"}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3 flex flex-col items-center md:items-start">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              {categoryLabel && CategoryIcon && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {categoryLabel}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1 text-xs font-semibold text-secondary-foreground font-mono">
                {displayDay} {displayMonth}
                {activity.date ? ` · ${activity.date}` : ""}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight text-balance">
              {activity.title}
            </h1>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                {activity.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" aria-hidden />
                {activity.institution}
              </span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground">{t("events.description")}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
              {activity.description}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center md:justify-start">
            <Button asChild size="lg" className="rounded-full shadow-soft bg-primary hover:bg-primary/90 font-bold px-8">
              <Link to={`/inscription?activity=${activity.id}`}>
                {t("activities.register")}
                <ArrowRight
                  className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/activities">{t("activities.backList")}</Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  )
}

