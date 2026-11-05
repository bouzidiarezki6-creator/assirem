import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Users,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import EventMetadata from "@/components/events/EventMetadata"
import PointsLevelTable from "@/components/shared/PointsLevelTable"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

const statusBadges: Record<string, { labelFr: string; labelAr: string; color: string }> = {
  open: { labelFr: "Inscriptions ouvertes", labelAr: "التسجيل مفتوح", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  upcoming: { labelFr: "À venir", labelAr: "قريباً", color: "bg-sky-50 text-sky-700 border-sky-200" },
  full: { labelFr: "Complet — Inscriptions closes", labelAr: "مكتمل — التسجيل مغلق", color: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { labelFr: "En cours", labelAr: "جارٍ حالياً", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { labelFr: "Terminé", labelAr: "منتهي", color: "bg-muted text-muted-foreground border-border" },
  cancelled: { labelFr: "Annulé", labelAr: "ملغى", color: "bg-rose-50 text-rose-700 border-rose-200" },
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAppData()
  const { t, dir, locale } = useI18n()
  const isAr = locale === "ar"
  const event = data.events.find((e) => e.id === id && e.published)

  if (!event) {
    return (
      <div className="page-shell text-center space-y-4" dir={dir}>
        <h1 className="type-h2">{t("events.notFound")}</h1>
        <p className="type-body mx-auto max-w-md">{t("events.notFoundHint")}</p>
        <Button asChild>
          <Link to="/activities">{t("events.backActivities")}</Link>
        </Button>
      </div>
    )
  }

  const statusKey = event.status || "open"
  const statusInfo = statusBadges[statusKey] || statusBadges.open
  const isFull =
    statusKey === "full" ||
    (event.capacity !== undefined && (event.registeredCount || 0) >= event.capacity)
  const isClosed = statusKey === "completed" || statusKey === "cancelled"

  return (
    <div className="min-h-screen bg-surface" dir={dir}>
      <div className="relative w-full aspect-[16/9] max-h-[420px] md:max-h-[480px] bg-muted overflow-hidden">
        {event.imageDataUrl ? (
          <img
            src={event.imageDataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground bg-gradient-to-br from-primary/10 to-muted">
            <ImageIcon className="h-12 w-12 opacity-40" aria-hidden />
            <span className="text-sm">{t("events.noImage")}</span>
          </div>
        )}
      </div>

      <div className="content-width -mt-8 md:-mt-12 relative z-10 pb-16">
        <article className="rounded-3xl border border-border/60 bg-white shadow-soft p-6 md:p-10 space-y-6 max-w-4xl mx-auto w-full text-center md:text-start">
          <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Link to="/activities">
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                {t("events.backActivities")}
              </Link>
            </Button>
            <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold ${statusInfo.color}`}>
              {isAr ? statusInfo.labelAr : statusInfo.labelFr}
            </span>
          </div>

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

          {/* Capacity Progress Bar if capacity is set */}
          {event.capacity && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{isAr ? "طاقة الاستيعاب والمشاركين" : "Capacité d'accueil"}</span>
                </span>
                <span className="font-mono text-foreground font-bold">
                  {event.registeredCount || 0} / {event.capacity} {isAr ? "مسجل" : "inscrits"}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFull ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((event.registeredCount || 0) / event.capacity) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="border-t border-border/60 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground">{t("events.description")}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
              {event.description}
            </div>
          </div>

          {/* Conditions of Participation */}
          {event.conditions && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1.5 text-start">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {isAr ? "شروط المشاركة" : "Conditions de participation"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.conditions}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            {isFull ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-6 py-3 text-sm font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? "عذراً، اكتمل عدد المقاعد المخصصة"
                    : "Inscriptions closes — Capacité maximale atteinte"}
                </span>
              </div>
            ) : isClosed ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-muted border border-border px-6 py-3 text-sm font-bold text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr ? "هذا الإعلان منتهي أو ملغى" : "Cette annonce est clôturée ou archivée"}
                </span>
              </div>
            ) : (
              <Button asChild size="lg" className="rounded-full shadow-soft bg-primary hover:bg-primary/90 font-bold px-8">
                <Link to={`/inscription?event=${event.id}`}>
                  {t("events.register")}
                  <ArrowRight
                    className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
                  />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/activities">{t("events.backAnnouncements")}</Link>
            </Button>
          </div>

          <section className="border-t border-border/60 pt-6">
            <PointsLevelTable showHeader />
          </section>
        </article>
      </div>
    </div>
  )
}
