import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { ExternalLink, House, MapPinned, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SosGpsFields from "@/components/sos/SosGpsFields"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import {
  SOS_AID_CATEGORY_IDS,
  formatGps,
  mapsUrl,
  parseGpsCoord,
} from "@/lib/sos"
import type { SosAidCategoryId, SosRequestStatus } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type SubTab = "collectionSites" | "damagedSites"

const STATUSES: SosRequestStatus[] = ["pending", "validated", "rejected", "closed"]

export default function SosAdminPanel() {
  const { t } = useI18n()
  const { data } = useAppData()
  const [sub, setSub] = useState<SubTab>("collectionSites")

  const tabs: { id: SubTab; label: string; count: number; icon: typeof MapPinned }[] = [
    {
      id: "collectionSites",
      label: t("sos.collectionSites.title"),
      count: data.sosCollectionSites.length,
      icon: MapPinned,
    },
    {
      id: "damagedSites",
      label: t("sos.damagedSites.title"),
      count: data.sosDamagedSites.length,
      icon: House,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2">{t("admin.sosCrm.title")}</h1>
        <p className="type-caption mt-1">{t("admin.sosCrm.subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label={t("admin.sosCrm.pendingCollection")}
          value={String(data.sosCollectionSites.filter((r) => r.status === "pending").length)}
        />
        <StatCard
          label={t("admin.sosCrm.pendingDamaged")}
          value={String(data.sosDamagedSites.filter((r) => r.status === "pending").length)}
        />
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-white p-1.5 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSub(tab.id)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none",
              sub === tab.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            {tab.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                sub === tab.id ? "bg-white/20" : "bg-muted"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {sub === "collectionSites" ? <CollectionSitesSection /> : <DamagedSitesSection />}
    </div>
  )
}

function CollectionSitesSection() {
  const {
    data,
    addSosCollectionSite,
    updateSosCollectionSite,
    deleteSosCollectionSite,
  } = useAppData()
  const { t, formatDateTime, locale } = useI18n()
  const { wilayas, selectedCode } = useLocationFilter()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<SosRequestStatus | "all">("all")
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState("")
  const [name, setName] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [aidCategories, setAidCategories] = useState<SosAidCategoryId[]>([])
  const [gpsBusy, setGpsBusy] = useState(false)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...data.sosCollectionSites]
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => {
        if (!needle) return true
        return [
          r.reference,
          r.name,
          String(r.wilayaCode),
          formatGps(r.lat, r.lng),
          ...(r.aidCategories ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.sosCollectionSites, q, status])

  const wilayaName = (code: number) => {
    const w = wilayas.find((x) => x.code === code)
    if (!w) return padWilayaCode(code)
    return `${padWilayaCode(code)} — ${locale === "ar" ? w.name_ar : w.name}`
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError(t("sos.errors.geoUnsupported"))
      return
    }
    setGpsBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setGpsBusy(false)
      },
      () => {
        setFormError(t("sos.errors.geoDenied"))
        setGpsBusy(false)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const toggleCategory = (id: SosAidCategoryId) => {
    setAidCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError("")
    const latN = parseGpsCoord(lat)
    const lngN = parseGpsCoord(lng)
    if (latN == null || lngN == null) {
      setFormError(t("sos.errors.gps"))
      return
    }
    const res = addSosCollectionSite({
      name,
      lat: latN,
      lng: lngN,
      wilayaCode,
      aidCategories,
    })
    if ("error" in res) {
      setFormError(t(res.error))
      return
    }
    setName("")
    setLat("")
    setLng("")
    setAidCategories([])
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" className="gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          {showForm ? t("admin.common.cancel") : t("admin.sosCrm.addCollectionSite")}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border/60 bg-white p-5 shadow-soft"
        >
          <h2 className="text-base font-extrabold">{t("admin.sosCrm.addCollectionSite")}</h2>
          <SiteFormFields
            name={name}
            setName={setName}
            lat={lat}
            setLat={setLat}
            lng={lng}
            setLng={setLng}
            wilayaCode={wilayaCode}
            setWilayaCode={setWilayaCode}
            gpsBusy={gpsBusy}
            onUseGps={useMyLocation}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("sos.fields.aidCategoriesCollect")}</p>
            <p className="text-xs text-muted-foreground">{t("sos.fields.aidCategoriesCollectHint")}</p>
            <div className="flex flex-wrap gap-2">
              {SOS_AID_CATEGORY_IDS.map((id) => {
                const active = aidCategories.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCategory(id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t(`sos.aidCategories.${id}`)}
                  </button>
                )
              })}
            </div>
          </div>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
          <Button type="submit">{t("admin.common.save")}</Button>
        </form>
      )}

      <SosListShell
        search={q}
        onSearch={setQ}
        status={status}
        onStatus={setStatus}
        empty={t("admin.sosCrm.emptyCollection")}
        searchPlaceholder={t("admin.sosCrm.search")}
        count={rows.length}
      >
        {rows.map((r) => (
          <SosSiteCard
            key={r.id}
            reference={r.reference}
            title={r.name}
            meta={[wilayaName(r.wilayaCode), formatGps(r.lat, r.lng)]}
            categories={r.aidCategories ?? []}
            mapHref={mapsUrl(r.lat, r.lng)}
            status={r.status}
            createdAt={formatDateTime(r.createdAt)}
            adminNote={r.adminNote}
            onStatus={(next) => updateSosCollectionSite(r.id, { status: next })}
            onNote={(note) => updateSosCollectionSite(r.id, { adminNote: note })}
            onDelete={() => {
              if (confirm(t("admin.common.deleteConfirm"))) deleteSosCollectionSite(r.id)
            }}
          />
        ))}
      </SosListShell>
    </div>
  )
}

function DamagedSitesSection() {
  const { data, addSosDamagedSite, updateSosDamagedSite, deleteSosDamagedSite } =
    useAppData()
  const { t, formatDateTime, locale } = useI18n()
  const { wilayas, selectedCode } = useLocationFilter()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<SosRequestStatus | "all">("all")
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState("")
  const [name, setName] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [aidCategories, setAidCategories] = useState<SosAidCategoryId[]>([])
  const [gpsBusy, setGpsBusy] = useState(false)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...data.sosDamagedSites]
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => {
        if (!needle) return true
        return [
          r.reference,
          r.name,
          String(r.wilayaCode),
          formatGps(r.lat, r.lng),
          ...r.aidCategories,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.sosDamagedSites, q, status])

  const wilayaName = (code: number) => {
    const w = wilayas.find((x) => x.code === code)
    if (!w) return padWilayaCode(code)
    return `${padWilayaCode(code)} — ${locale === "ar" ? w.name_ar : w.name}`
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError(t("sos.errors.geoUnsupported"))
      return
    }
    setGpsBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setGpsBusy(false)
      },
      () => {
        setFormError(t("sos.errors.geoDenied"))
        setGpsBusy(false)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const toggleCategory = (id: SosAidCategoryId) => {
    setAidCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError("")
    const latN = parseGpsCoord(lat)
    const lngN = parseGpsCoord(lng)
    if (latN == null || lngN == null) {
      setFormError(t("sos.errors.gps"))
      return
    }
    const res = addSosDamagedSite({
      name,
      lat: latN,
      lng: lngN,
      wilayaCode,
      aidCategories,
    })
    if ("error" in res) {
      setFormError(t(res.error))
      return
    }
    setName("")
    setLat("")
    setLng("")
    setAidCategories([])
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" className="gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          {showForm ? t("admin.common.cancel") : t("admin.sosCrm.addDamagedSite")}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border/60 bg-white p-5 shadow-soft"
        >
          <h2 className="text-base font-extrabold">{t("admin.sosCrm.addDamagedSite")}</h2>
          <SiteFormFields
            name={name}
            setName={setName}
            lat={lat}
            setLat={setLat}
            lng={lng}
            setLng={setLng}
            wilayaCode={wilayaCode}
            setWilayaCode={setWilayaCode}
            gpsBusy={gpsBusy}
            onUseGps={useMyLocation}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("sos.fields.aidCategories")}</p>
            <div className="flex flex-wrap gap-2">
              {SOS_AID_CATEGORY_IDS.map((id) => {
                const active = aidCategories.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCategory(id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t(`sos.aidCategories.${id}`)}
                  </button>
                )
              })}
            </div>
          </div>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
          <Button type="submit">{t("admin.common.save")}</Button>
        </form>
      )}

      <SosListShell
        search={q}
        onSearch={setQ}
        status={status}
        onStatus={setStatus}
        empty={t("admin.sosCrm.emptyDamaged")}
        searchPlaceholder={t("admin.sosCrm.search")}
        count={rows.length}
      >
        {rows.map((r) => (
          <SosSiteCard
            key={r.id}
            reference={r.reference}
            title={r.name}
            meta={[wilayaName(r.wilayaCode), formatGps(r.lat, r.lng)]}
            categories={r.aidCategories}
            mapHref={mapsUrl(r.lat, r.lng)}
            status={r.status}
            createdAt={formatDateTime(r.createdAt)}
            adminNote={r.adminNote}
            onStatus={(next) => updateSosDamagedSite(r.id, { status: next })}
            onNote={(note) => updateSosDamagedSite(r.id, { adminNote: note })}
            onDelete={() => {
              if (confirm(t("admin.common.deleteConfirm"))) deleteSosDamagedSite(r.id)
            }}
          />
        ))}
      </SosListShell>
    </div>
  )
}

function SiteFormFields({
  name,
  setName,
  lat,
  setLat,
  lng,
  setLng,
  wilayaCode,
  setWilayaCode,
  gpsBusy,
  onUseGps,
}: {
  name: string
  setName: (v: string) => void
  lat: string
  setLat: (v: string) => void
  lng: string
  setLng: (v: string) => void
  wilayaCode: number
  setWilayaCode: (v: number) => void
  gpsBusy: boolean
  onUseGps: () => void
}) {
  const { t, locale } = useI18n()
  const { wilayas } = useLocationFilter()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-sm font-medium">{t("sos.fields.placeName")}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11 rounded-2xl"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-sm font-medium">{t("sos.fields.wilaya")}</label>
        <select
          value={wilayaCode}
          onChange={(e) => setWilayaCode(Number(e.target.value))}
          className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm"
        >
          {wilayas.map((w) => (
            <option key={w.code} value={w.code}>
              {padWilayaCode(w.code)} — {locale === "ar" ? w.name_ar : w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <SosGpsFields
          lat={lat}
          lng={lng}
          onLatChange={setLat}
          onLngChange={setLng}
          gpsBusy={gpsBusy}
          onUseGps={onUseGps}
        />
      </div>
    </div>
  )
}

function SosListShell({
  search,
  onSearch,
  status,
  onStatus,
  empty,
  searchPlaceholder,
  count,
  children,
}: {
  search: string
  onSearch: (v: string) => void
  status: SosRequestStatus | "all"
  onStatus: (v: SosRequestStatus | "all") => void
  empty: string
  searchPlaceholder: string
  count: number
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-2xl ps-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value as SosRequestStatus | "all")}
          className="h-11 rounded-2xl border border-border bg-muted/30 px-3 text-sm font-medium"
        >
          <option value="all">{t("admin.sosCrm.filterAll")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`admin.sosCrm.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {count === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-white py-12 text-center text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="grid gap-3">{children}</div>
      )}
    </div>
  )
}

function SosSiteCard({
  reference,
  title,
  meta,
  categories,
  mapHref,
  status,
  createdAt,
  adminNote,
  onStatus,
  onNote,
  onDelete,
}: {
  reference: string
  title: string
  meta: string[]
  categories?: SosAidCategoryId[]
  mapHref: string
  status: SosRequestStatus
  createdAt: string
  adminNote: string
  onStatus: (s: SosRequestStatus) => void
  onNote: (note: string) => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const [note, setNote] = useState(adminNote)

  return (
    <article className="rounded-3xl border border-border/60 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary" dir="ltr">
              {reference}
            </span>
            <StatusBadge status={status} />
          </div>
          <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {meta.filter(Boolean).map((m) => (
              <span key={m} dir={m.includes(",") ? "ltr" : undefined}>
                {m}
              </span>
            ))}
          </div>
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground"
                >
                  {t(`sos.aidCategories.${c}`)}
                </span>
              ))}
            </div>
          )}
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("admin.sosCrm.openMap")}
          </a>
          <p className="text-xs text-muted-foreground">{createdAt}</p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-64 shrink-0">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("admin.sosCrm.col.status")}
          </label>
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value as SosRequestStatus)}
            className="h-10 rounded-2xl border border-border bg-muted/30 px-3 text-sm font-medium"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`admin.sosCrm.status.${s}`)}
              </option>
            ))}
          </select>
          <label className="text-xs font-semibold text-muted-foreground mt-1">
            {t("admin.sosCrm.adminNote")}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note.trim() !== adminNote.trim()) onNote(note)
            }}
            rows={2}
            className="w-full rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            placeholder={t("admin.sosCrm.adminNotePlaceholder")}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-rose-600 self-end"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {t("admin.common.delete")}
          </Button>
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: SosRequestStatus }) {
  const { t } = useI18n()
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold",
        status === "pending" && "bg-amber-50 text-amber-700",
        status === "validated" && "bg-emerald-50 text-emerald-700",
        status === "rejected" && "bg-rose-50 text-rose-700",
        status === "closed" && "bg-slate-100 text-slate-600"
      )}
    >
      {t(`admin.sosCrm.status.${status}`)}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-primary">{value}</p>
    </div>
  )
}
