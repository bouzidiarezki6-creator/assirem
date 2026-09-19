import { Link, useParams } from "react-router-dom"
import { ArrowRight, Building2, ImageIcon, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAppData()
  const { t, dir } = useI18n()
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

  return (
    <div className="min-h-screen">
      <div className="relative w-full aspect-[16/9] max-h-[420px] md:max-h-[480px] bg-muted overflow-hidden">
        {activity.imageDataUrl ? (
          <img
            src={activity.imageDataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-12 w-12 opacity-40" aria-hidden />
            <span className="text-sm">{t("events.noImage")}</span>
          </div>
        )}
      </div>

      <div className="content-width -mt-8 md:-mt-12 relative z-10 pb-16">
        <article className="rounded-3xl border border-border/60 bg-white shadow-soft p-6 md:p-10 space-y-6 max-w-4xl mx-auto w-full text-center md:text-start">
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
              {activity.day} {activity.month}
              {activity.date ? ` · ${activity.date}` : ""}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight text-balance">
              {activity.title}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            <Button asChild size="lg">
              <Link to={`/inscription?activity=${activity.id}`}>
                {t("activities.register")}
                <ArrowRight
                  className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/activities">{t("activities.backList")}</Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  )
}
