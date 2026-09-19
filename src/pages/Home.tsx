import { Link } from "react-router-dom"
import { MapPin, Building2, Users, Activity, ArrowLeft, HandHeart } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import AlgeriaMapExplorer from "@/components/map/AlgeriaMapExplorer"

export default function Home() {
  const { t, dir } = useI18n()

  const stats = [
    { icon: Building2, label: t("home.youthHouses"), count: t("home.countInstitutions", { count: 12 }) },
    { icon: Activity, label: t("home.sportsFields"), count: t("home.countInstitutions", { count: 45 }) },
    { icon: Users, label: t("home.culturalCenters"), count: t("home.countInstitutions", { count: 8 }) },
    { icon: MapPin, label: t("home.summerCamps"), count: t("home.countInstitutions", { count: 3 }) },
    { icon: Building2, label: t("home.youthHomes"), count: t("home.countInstitutions", { count: 24 }) },
  ]

  return (
    <div className="flex flex-col bg-surface">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, hsl(145 50% 90% / 0.95), transparent 70%), linear-gradient(180deg, hsl(150 30% 97%) 0%, hsl(166 28% 95%) 100%)",
          }}
        />

        <div
          className="content-width relative z-10 py-16 md:py-20 lg:py-24"
          style={{ animation: "fade-up var(--duration-complex) var(--ease-out) both" }}
        >
          <div className="mx-auto flex max-w-4xl w-full flex-col items-center text-center gap-7">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-primary text-primary-foreground shadow-soft md:h-24 md:w-24">
              <HandHeart className="h-10 w-10 md:h-12 md:w-12" strokeWidth={1.5} aria-hidden />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
              {t("home.badge")}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.15] text-foreground text-balance">
              {t("home.titleLine1")}
              <br />
              <span className="text-primary">{t("home.titleLine2")}</span>
            </h1>

            <p className="text-base md:text-lg max-w-xl text-muted-foreground leading-relaxed">
              {t("home.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full sm:w-auto">
              <Link
                to="/benevolat"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                <HandHeart className="h-4 w-4" aria-hidden />
                {t("nav.volunteer")}
                <ArrowLeft className={`h-4 w-4 ${dir === "ltr" ? "rotate-180" : ""}`} aria-hidden />
              </Link>
              <Link
                to="/activities"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-primary/25 bg-white/80 px-7 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-white hover:border-primary/40"
              >
                {t("home.ctaActivities")}
              </Link>
              <Link
                to="/institutions"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                {t("home.ctaInstitutions")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="content-width relative z-20 -mt-2 md:-mt-4 pb-4">
        <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 rounded-3xl border border-border/70 bg-white p-4 md:p-5 shadow-soft">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2.5 rounded-2xl p-3 text-center transition-colors hover:bg-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <h2 className="type-h1 text-2xl md:text-3xl">{t("home.mapTitle")}</h2>
          <p className="type-body">{t("home.mapHint")}</p>
        </div>

        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-border/70 shadow-soft">
          <AlgeriaMapExplorer />
        </div>
      </section>

      <section className="content-width pb-6 md:pb-10">
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 flex flex-col items-center text-center gap-6 relative overflow-hidden shadow-soft">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute start-0 bottom-0 w-64 h-64 bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
            <div className="absolute end-0 top-0 w-40 h-40 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
          </div>
          <div className="relative z-10 space-y-4 max-w-3xl">
            <h3 className="text-2xl md:text-3xl font-extrabold">{t("home.directorTitle")}</h3>
            <p className="text-base md:text-lg opacity-90 leading-relaxed">{t("home.directorQuote")}</p>
            <div className="pt-2">
              <p className="font-bold text-base md:text-lg">{t("home.directorRole")}</p>
              <p className="opacity-75 text-sm mt-1">{t("home.directorScope")}</p>
            </div>
          </div>
          <div className="relative z-10 w-full max-w-xl aspect-video bg-white/10 rounded-2xl overflow-hidden flex items-center justify-center text-white/55 border border-white/10 text-sm shadow-inner">
            <img 
              src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&q=80" 
              alt="Youth engagement" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <h2 className="type-h1 text-2xl md:text-3xl">{t("home.servicesTitle")}</h2>
          <p className="type-body">{t("home.servicesSubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 md:p-6 shadow-soft border border-border/60 flex flex-col items-center justify-center gap-3 text-center interactive-lift"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="w-6 h-6" aria-hidden />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">{stat.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
