import { MapPin, Building2, Users, Activity } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import AlgeriaMapExplorer from "@/components/map/AlgeriaMapExplorer"
import ActivitiesHomeSection from "@/components/home/ActivitiesHomeSection"

export default function Home() {
  const { t } = useI18n()

  const stats = [
    { icon: Building2, label: t("home.youthHouses"), count: t("home.countInstitutions", { count: 12 }) },
    { icon: Activity, label: t("home.sportsFields"), count: t("home.countInstitutions", { count: 45 }) },
    { icon: Users, label: t("home.culturalCenters"), count: t("home.countInstitutions", { count: 8 }) },
    { icon: MapPin, label: t("home.summerCamps"), count: t("home.countInstitutions", { count: 3 }) },
    { icon: Building2, label: t("home.youthHomes"), count: t("home.countInstitutions", { count: 24 }) },
  ]

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ══════════════════════════════════════════════════════════
          HERO & VISUAL SHOWCASE
          Centered background image with optimal scale (NO 300% ZOOM)
         ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background">
        {/* ══════════════════════════════════════════════════════════
            HERO BACKGROUND (Isolated to background layer z-0)
            Soft horizontal edge dissolution via CSS mask.
            Zero rectangular borders or vertical hard edges.
           ══════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Base canvas background */}
          <div className="absolute inset-0 bg-background" />

          {/* Centered Hero Image Layer with horizontal fade mask */}
          <div className="absolute inset-0 flex justify-center">
            <div
              className="hero-edge-mask relative w-full max-w-[880px] h-full"
              style={{
                backgroundImage: "url('/hero-bg.jpg')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center top",
                backgroundSize: "100% auto",
              }}
            />
          </div>

          {/* Ambient lighting & vertical fade into site background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 40% at 50% 25%, rgba(0,255,100,0.10), transparent 70%), linear-gradient(180deg, rgba(2,17,10,0.85) 0%, rgba(2,17,10,0.20) 18%, transparent 40%, rgba(2,17,10,0.45) 65%, hsl(var(--background)) 98%)",
            }}
          />
        </div>

        {/* ── 1. Top Content (Sky & Skyscrapers Area) ── */}
        <div
          className="content-width relative z-10 pt-6 sm:pt-8 md:pt-10 pb-2"
          style={{ animation: "fade-up var(--duration-complex) var(--ease-out) both" }}
        >
          <div className="mx-auto flex max-w-3xl w-full flex-col items-center text-center gap-2 sm:gap-3">
            {/* Main Brand Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
              {t("home.platformTitle")}
            </h1>

            {/* Tagline under Title */}
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-300 bg-clip-text text-transparent leading-relaxed max-w-xl text-balance drop-shadow-[0_0_25px_rgba(0,255,136,0.4)]">
              {t("home.tagline")}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base max-w-lg text-white/75 leading-relaxed drop-shadow">
              {t("home.subtitle")}
            </p>

            {/* Single CTA button positioned right above the high-fiving hands */}
            <div className="pt-2 sm:pt-3">
              <a
                href="#activities"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById("activities")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 px-8 sm:px-10 py-3 sm:py-3.5 text-sm sm:text-base font-extrabold text-white shadow-[0_0_28px_rgba(0,255,136,0.45),_0_6px_20px_rgba(0,0,0,0.6)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,136,0.7)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                {t("home.ctaActivities")}
              </a>
            </div>
          </div>
        </div>

        {/* ── 2. Visual Stage for the 4 People & Neon Arc ── */}
        {/* Shows the 4 youth high-fiving directly beneath the button and the glowing curved neon arc */}
        <div className="relative z-0 h-48 sm:h-60 md:h-72 lg:h-[320px] w-full pointer-events-none" />

        {/* ── 3. MAP SECTION — CENTERED UNDER THE PEOPLE WITH FROSTED GLASS (BLUR / FLOU) ── */}
        <div className="relative z-10 pb-16 sm:pb-20 px-3 sm:px-4 md:px-0">
          <div className="mx-auto w-full max-w-[860px]">
            <div className="text-center space-y-2 mb-6 sm:mb-8 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                {t("home.mapTitle")}
              </h2>
              <div className="space-y-1 sm:space-y-1.5">
                <p className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow">
                  {t("home.mapFromHere")}
                </p>
                <p className="text-xs sm:text-sm md:text-base text-emerald-100/75 max-w-lg mx-auto leading-relaxed drop-shadow">
                  {t("home.mapSubtitle")}
                </p>
              </div>
            </div>

            {/* Frosted Glass Container (BLUR / FLOU) — Exactly matching 860px hero background image width */}
            <div className="rounded-3xl border border-emerald-400/25 bg-[#02180f]/20 backdrop-blur-2xl p-4 sm:p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.08)]">
              <AlgeriaMapExplorer />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ACTIVITIES SECTION (BELONGS TO HOME PAGE)
         ═══════════════════════════════════════════ */}
      <ActivitiesHomeSection />

      {/* ═══════════════════════════════════════════
          SERVICES
         ═══════════════════════════════════════════ */}
      <section className="section-block pb-16">
        <div className="section-title">
          <h2 className="type-h1 text-2xl md:text-3xl text-white">{t("home.servicesTitle")}</h2>
          <p className="type-body text-emerald-300/80">{t("home.servicesSubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-[#041d13]/85 backdrop-blur-md rounded-3xl p-5 md:p-6 shadow-soft border border-emerald-500/25 flex flex-col items-center justify-center gap-3 text-center interactive-lift hover:border-emerald-400/50 hover:bg-[#062c1d]"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <stat.icon className="w-6 h-6" aria-hidden />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{stat.label}</h4>
                <p className="text-xs text-emerald-300/70 mt-1">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
