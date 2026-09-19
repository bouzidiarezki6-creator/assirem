import { useMemo, useState } from "react"
import { ExternalLink, House, MapPinned, Search } from "lucide-react"
import PageHeader from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { mapsUrl } from "@/lib/sos"
import type { SosAidCategoryId } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type SosOption = "collectionSites" | "damagedSites"

const OPTIONS = [
  {
    id: "collectionSites" as const,
    icon: MapPinned,
    accent: "bg-emerald-50 text-emerald-700",
    selectedAccent: "border-emerald-500/50 bg-emerald-50/60 ring-emerald-500/20",
  },
  {
    id: "damagedSites" as const,
    icon: House,
    accent: "bg-rose-50 text-rose-700",
    selectedAccent: "border-rose-500/50 bg-rose-50/60 ring-rose-500/20",
  },
]

export default function Sos() {
  const { t, locale } = useI18n()
  const { data } = useAppData()
  const { wilayas, selectedCode } = useLocationFilter()
  const [selected, setSelected] = useState<SosOption>("collectionSites")
  const [q, setQ] = useState("")

  const wilayaName = (code: number) => {
    const w = wilayas.find((x) => x.code === code)
    if (!w) return padWilayaCode(code)
    return `${padWilayaCode(code)} — ${locale === "ar" ? w.name_ar : w.name}`
  }

  const items = useMemo(() => {
    const source = selected === "collectionSites" ? data.sosCollectionSites : data.sosDamagedSites
    const needle = q.trim().toLowerCase()
    
    return source
      .filter((r) => r.status === "validated")
      .filter((r) => {
        if (selectedCode && r.wilayaCode !== selectedCode) return false
        if (!needle) return true
        return [r.name, String(r.wilayaCode)].join(" ").toLowerCase().includes(needle)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.sosCollectionSites, data.sosDamagedSites, selected, selectedCode, q])

  return (
    <div className="page-shell section-gap">
      <PageHeader title={t("sos.title")} description={t("sos.subtitle")} />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = selected === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-white p-4 text-center shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:text-start sm:p-5",
                  active && cn("ring-2", opt.selectedAccent)
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14",
                    opt.accent
                  )}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-extrabold leading-snug text-foreground">
                    {t(`sos.${opt.id}.title`)}
                  </h2>
                </div>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.sosCrm.search")}
            className="h-12 rounded-2xl ps-11 text-base shadow-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((r) => (
            <article key={r.id} className="flex flex-col justify-between gap-4 rounded-3xl border border-border/60 bg-white p-5 shadow-soft hover:shadow-card transition-shadow duration-[var(--duration-standard)]">
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-foreground">{r.name}</h3>
                <p className="text-sm text-muted-foreground font-medium">{wilayaName(r.wilayaCode)}</p>
                {r.aidCategories && r.aidCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {r.aidCategories.map((c: SosAidCategoryId) => (
                      <span
                        key={c}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground"
                      >
                        {t(`sos.aidCategories.${c}`)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <a
                href={mapsUrl(r.lat, r.lng)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline self-start bg-primary/5 px-3 py-1.5 rounded-full"
              >
                <ExternalLink className="h-4 w-4" />
                {t("admin.sosCrm.openMap")}
              </a>
            </article>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-border bg-white/50">
              <p className="text-muted-foreground">{t("admin.sosCrm.emptyCollection")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
