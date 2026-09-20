import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { HandHeart, Menu, X } from "lucide-react"
import LanguageSwitcher from "./LanguageSwitcher"
import SiteSearch from "./SiteSearch"
import WilayaSelector from "./WilayaSelector"
import { useI18n } from "@/context/I18nProvider"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const location = useLocation()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.institutions"), path: "/institutions" },
    { name: t("nav.activities"), path: "/activities" },
    { name: t("nav.volunteer"), path: "/benevolat" },
    { name: t("nav.cagnottes"), path: "/cagnottes" },
    { name: t("nav.associations") || "Associations", path: "/associations" },
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/75 text-foreground shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
      <div className="content-width flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <span className="text-[10px] font-extrabold tracking-wide">ODEJ</span>
          </div>
          <span className="truncate text-base font-extrabold text-foreground sm:text-lg">
            {t("brand")}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
          {navLinks.map((link) => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-[var(--duration-micro)] ease-[var(--ease-out)] whitespace-nowrap",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
            iconClassName="text-muted-foreground"
            inputClassName="h-10 w-40 xl:w-52 rounded-full border border-border bg-muted/60 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />

          <WilayaSelector className="hidden md:block" />

          <LanguageSwitcher />

          <Link
            to="/benevolat"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.98] whitespace-nowrap"
          >
            <HandHeart className="h-4 w-4" aria-hidden />
            {t("nav.volunteer")}
          </Link>

          <Link
            to="/admin"
            className="hidden lg:inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap"
          >
            {t("nav.admin")}
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-white lg:hidden">
          <div className="content-width space-y-4 py-4 pb-6">
            <SiteSearch
              className="md:hidden"
              variant="mobile"
              iconClassName="text-muted-foreground"
              inputClassName="h-11 w-full rounded-2xl border border-border bg-muted/50 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/benevolat"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                <HandHeart className="h-4 w-4" aria-hidden />
                {t("nav.volunteer")}
              </Link>
              <Link
                to="/admin"
                className="flex items-center justify-center rounded-full border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
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
