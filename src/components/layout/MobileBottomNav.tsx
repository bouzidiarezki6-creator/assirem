import { Link, useLocation } from "react-router-dom"
import { CalendarDays, HeartHandshake, Home, Siren } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import { cn } from "@/lib/utils"

export default function MobileBottomNav() {
  const location = useLocation()
  const { t } = useI18n()

  const items = [
    { name: t("nav.home"), path: "/", icon: Home },
    { name: t("nav.activities"), path: "/activities", icon: CalendarDays },
    { name: t("nav.cagnottes"), path: "/cagnottes", icon: HeartHandshake },
    { name: t("nav.sos"), path: "/sos", icon: Siren },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-white/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgb(27_125_103_/0.12)] backdrop-blur-xl lg:hidden"
      aria-label="Mobile"
    >
      <ul className="mx-auto flex h-[4.25rem] max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const active =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)
          const Icon = item.icon
          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors duration-[var(--duration-micro)] sm:text-[11px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-2xl transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)]",
                    active && "bg-primary/10 scale-105"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                </span>
                <span className="truncate max-w-full">{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
