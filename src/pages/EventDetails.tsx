import { Link, useParams } from "react-router-dom"
import { ArrowRight, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import EventMetadata from "@/components/events/EventMetadata"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAppData()
  const { t, dir } = useI18n()
  const event = data.events.find((e) => e.id === id && e.published)

  if (!event) {
    return (
      <div className="page-shell text-center space-y-4">
        <h1 className="type-h2">{t("events.notFound")}</h1>
        <p className="type-body mx-auto max-w-md">{t("events.notFoundHint")}</p>
        <Button asChild>
          <Link to="/activities">{t("events.backActivities")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="relative w-full aspect-[16/9] max-h-[420px] md:max-h-[480px] bg-muted overflow-hidden">
        {event.imageDataUrl ? (
          <img
            src={event.imageDataUrl}
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
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {t("events.announcement")}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight text-balance">
              {event.title}
            </h1>
          </div>

          <div className="flex justify-center md:justify-start">
            <EventMetadata event={event} />
          </div>

          <div className="border-t border-border/60 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground">{t("events.description")}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
              {event.description}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            <Button asChild size="lg">
              <Link to={`/inscription?event=${event.id}`}>
                {t("events.register")}
                <ArrowRight
                  className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/activities">{t("events.backAnnouncements")}</Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  )
}
