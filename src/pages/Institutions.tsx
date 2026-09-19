import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, MapPin, Building2 } from "lucide-react"
import InstitutionCard from "../components/shared/InstitutionCard"
import EmptyState from "@/components/shared/EmptyState"
import PageHeader from "@/components/shared/PageHeader"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { padWilayaCode } from "@/lib/wilayas"

export default function Institutions() {
  const { data } = useAppData()
  const { t, dir, locale } = useI18n()
  const { wilayas, selectedCode, setSelectedCode } = useLocationFilter()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [type, setType] = useState("")

  const iconPos = dir === "rtl" ? "right-3" : "left-3"
  const inputPad = dir === "rtl" ? "px-9" : "pl-9 pr-3"

  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    setQuery(q)

    if (!searchParams.has("wilaya")) return
    const raw = searchParams.get("wilaya")
    if (raw === null || raw === "") {
      setSelectedCode(null)
      return
    }
    const code = Number(raw)
    if (Number.isFinite(code) && code >= 1 && code <= 69) {
      setSelectedCode(code)
    }
  }, [searchParams, setSelectedCode])

  const institutions = useMemo(() => {
    return data.institutions.filter((inst) => {
      if (!inst.published) return false
      const needle = query.trim().toLowerCase()
      if (needle && ![inst.name, inst.type, inst.location].join(" ").toLowerCase().includes(needle)) {
        return false
      }
      if (type && inst.type !== type) return false
      if (selectedCode !== null) {
        if (inst.wilayaCode === selectedCode) return true
        const wilaya = wilayas.find((w) => w.code === selectedCode)
        if (!wilaya) return false
        const loc = inst.location.toLowerCase()
        return (
          loc.includes(wilaya.name.toLowerCase()) ||
          loc.includes(wilaya.name_ar) ||
          loc.includes(padWilayaCode(wilaya.code))
        )
      }
      return true
    })
  }, [data.institutions, query, type, selectedCode, wilayas])

  const types = useMemo(
    () => [...new Set(data.institutions.filter((i) => i.published).map((i) => i.type))],
    [data.institutions]
  )

  const syncUrl = (nextQuery: string, nextWilaya: number | null) => {
    const next = new URLSearchParams()
    if (nextQuery.trim()) next.set("q", nextQuery.trim())
    if (nextWilaya !== null) next.set("wilaya", String(nextWilaya))
    setSearchParams(next, { replace: true })
  }

  const onQueryChange = (value: string) => {
    setQuery(value)
    syncUrl(value, selectedCode)
  }

  const onWilayaChange = (value: string) => {
    const code = value === "" ? null : Number(value)
    setSelectedCode(code)
    syncUrl(query, code)
  }

  return (
    <div className="page-shell section-gap">
      <PageHeader
        title={t("institutions.title")}
        description={t("institutions.subtitle")}
      />

      <div className="w-full flex flex-col sm:flex-row items-stretch gap-3 bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-3xl border border-border/60 shadow-soft">
        <div className="relative flex-1">
          <Search className={`absolute ${iconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("institutions.search")}
            className={`h-11 w-full rounded-2xl border border-border bg-muted/30 ${inputPad} py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:bg-white transition-all`}
          />
        </div>

        <div className="relative flex-1">
          <MapPin className={`absolute ${iconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <select
            value={selectedCode ?? ""}
            onChange={(e) => onWilayaChange(e.target.value)}
            className={`h-11 w-full rounded-2xl border border-border bg-muted/30 ${inputPad} py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:bg-white transition-all appearance-none cursor-pointer`}
          >
            <option value="">{t("nav.allAlgeria")}</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>
                {padWilayaCode(w.code)} — {locale === "ar" ? w.name_ar : w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1">
          <Building2 className={`absolute ${iconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`h-11 w-full rounded-2xl border border-border bg-muted/30 ${inputPad} py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:bg-white transition-all appearance-none cursor-pointer`}
          >
            <option value="">{t("institutions.allTypes")}</option>
            {types.map((tType) => (
              <option key={tType} value={tType}>
                {tType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {institutions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("institutions.empty")}
          description={t("common.noResults")}
          actionLabel={t("nav.home")}
          actionTo="/"
        />
      ) : (
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {institutions.map((inst) => (
            <InstitutionCard
              key={inst.id}
              name={inst.name}
              type={inst.type}
              location={inst.location}
              phone={inst.phone || undefined}
              image={inst.imageDataUrl || undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
