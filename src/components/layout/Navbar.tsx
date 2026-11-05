import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { LogOut, Menu, User, X } from "lucide-react"
import LanguageSwitcher from "./LanguageSwitcher"
import SiteSearch from "./SiteSearch"
import WilayaSelector from "./WilayaSelector"
import { useI18n } from "@/context/I18nProvider"
import { useVolunteerAuth } from "@/context/VolunteerAuthContext"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const location = useLocation()
  const { t } = useI18n()
  const { currentVolunteer, isAuthenticated, logout } = useVolunteerAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.about") || "Présentation", path: "/a-propos" },
    { name: t("nav.institutions"), path: "/institutions" },
    { name: t("nav.activities"), path: "/activities" },
    { name: t("nav.sos"), path: "/sos" },
    { name: t("nav.news"), path: "/news" },
  ]

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-[#02130c]/85 text-white shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-[#02130c]/75">
      <div className="content-width flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3 shrink-0 group">
          <img
            src="/LOGO.png"
            alt="Logo"
            className="h-9 sm:h-11 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]"
          />
          <img
            src="/logo-text.png"
            alt="Yed Fi Yed"
            className="h-7 sm:h-9 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(0,255,136,0.2)]"
          />
        </Link>

        <nav className="hidden xl:flex items-center gap-1" aria-label="Main">
          {navLinks.map((link) => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold transition-all duration-[var(--duration-micro)] ease-[var(--ease-out)] whitespace-nowrap",
                  active
                    ? "bg-primary/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(0,255,136,0.15)]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <SiteSearch
            className="hidden lg:block"
            iconClassName="text-white/60"
            inputClassName="h-10 w-36 lg:w-44 xl:w-52 rounded-full border border-emerald-500/30 bg-[#041d13]/80 py-1 text-sm text-white placeholder:text-white/50 focus:bg-[#06291a] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />

          <WilayaSelector className="hidden md:block" />

          <LanguageSwitcher />

          {/* Volunteer Status / CTA */}
          {isAuthenticated && currentVolunteer ? (
            <div className="hidden sm:flex items-center gap-1.5 pl-1">
              <Link
                to="/mon-espace"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all shadow-xs",
                  location.pathname === "/mon-espace"
                    ? "border-emerald-400 bg-emerald-600/30 text-emerald-200"
                    : "border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 hover:text-white"
                )}
                title={t("nav.mySpace") || "Mon Espace"}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                  {currentVolunteer.firstName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate">{currentVolunteer.firstName}</span>
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  {currentVolunteer.points} pts
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title={t("nav.logout") || "Déconnexion"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-rose-400 transition-colors"
                aria-label={t("nav.logout") || "Déconnexion"}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/rejoindre"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-600/30 to-green-600/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 hover:text-white transition-all whitespace-nowrap shadow-xs"
            >
              <User className="h-3.5 w-3.5" />
              <span>{t("nav.join") || "Rejoindre"}</span>
            </Link>
          )}

          <Link
            to="/admin"
            className="hidden lg:inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-900/60 hover:text-white hover:border-emerald-400/50 whitespace-nowrap"
          >
            {t("nav.admin")}
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 xl:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-emerald-500/20 bg-[#02140d]/95 backdrop-blur-2xl xl:hidden">
          <div className="content-width space-y-4 py-4 pb-6">
            <SiteSearch
              className="md:hidden"
              variant="mobile"
              iconClassName="text-white/60"
              inputClassName="h-11 w-full rounded-2xl border border-emerald-500/30 bg-[#041d13] py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            <WilayaSelector className="md:hidden" variant="panel" />

            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "rounded-2xl px-3 py-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/20 text-emerald-300 border border-emerald-500/30"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-emerald-500/20">
              {isAuthenticated && currentVolunteer ? (
                <div className="flex items-center justify-between px-2 py-1">
                  <Link
                    to="/mon-espace"
                    className="flex items-center gap-2 text-sm font-bold text-emerald-300"
                  >
                    <span>{t("nav.mySpace") || "Mon Espace"}</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 border border-emerald-500/30">
                      {currentVolunteer.points} pts
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    {t("nav.logout") || "Déconnexion"}
                  </button>
                </div>
              ) : (
                <Link
                  to="/rejoindre"
                  className="flex items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-600/30 px-3 py-2.5 text-sm font-semibold text-emerald-300 hover:text-white"
                >
                  {t("nav.join") || "Rejoindre / Connexion Bénévole"}
                </Link>
              )}

              <Link
                to="/admin"
                className="flex items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-white"
              >
                {t("nav.admin")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
