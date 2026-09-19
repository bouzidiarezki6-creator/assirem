import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { CheckCircle2, MapPinned, House } from "lucide-react"
import PageHeader from "@/components/shared/PageHeader"
import SosGpsFields from "@/components/sos/SosGpsFields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { SOS_AID_CATEGORY_IDS, parseGpsCoord } from "@/lib/sos"
import type { SosAidCategoryId } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type SosOption = "collectionSites" | "damagedSites"

const OPTIONS: {
  id: SosOption
  icon: typeof MapPinned
  accent: string
  selectedAccent: string
}[] = [
  {
    id: "collectionSites",
    icon: MapPinned,
    accent: "bg-emerald-50 text-emerald-700",
    selectedAccent: "border-emerald-500/50 bg-emerald-50/60 ring-emerald-500/20",
  },
  {
    id: "damagedSites",
    icon: House,
    accent: "bg-rose-50 text-rose-700",
    selectedAccent: "border-rose-500/50 bg-rose-50/60 ring-rose-500/20",
  },
]

export default function Sos() {
  const { t, locale, dir } = useI18n()
  const { addSosCollectionSite, addSosDamagedSite } = useAppData()
  const { wilayas, selectedCode } = useLocationFilter()
  const [selected, setSelected] = useState<SosOption | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [successRef, setSuccessRef] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [gpsBusy, setGpsBusy] = useState(false)

  const [name, setName] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [aidCategories, setAidCategories] = useState<SosAidCategoryId[]>([])

  const wilayaOptions = useMemo(() => wilayas, [wilayas])

  const resetForm = () => {
    setName("")
    setLat("")
    setLng("")
    setAidCategories([])
    setError("")
  }

  const startForm = (opt: SosOption) => {
    setSelected(opt)
    setShowForm(true)
    setSuccessRef(null)
    resetForm()
    setWilayaCode(selectedCode ?? 6)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("sos.errors.geoUnsupported"))
      return
    }
    setGpsBusy(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setGpsBusy(false)
      },
      () => {
        setError(t("sos.errors.geoDenied"))
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
    setError("")
    if (!selected) return

    const latN = parseGpsCoord(lat)
    const lngN = parseGpsCoord(lng)
    if (latN == null || lngN == null) {
      setError(t("sos.errors.gps"))
      return
    }

    if (selected === "collectionSites") {
      const res = addSosCollectionSite({
        name,
        lat: latN,
        lng: lngN,
        wilayaCode,
        aidCategories,
      })
      if ("error" in res) {
        setError(t(res.error))
        return
      }
      setSuccessRef(res.reference)
      setShowForm(false)
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
      setError(t(res.error))
      return
    }
    setSuccessRef(res.reference)
    setShowForm(false)
  }

  return (
    <div className="page-shell section-gap">
      <PageHeader title={t("sos.title")} description={t("sos.subtitle")} />

      {!showForm && !successRef && (
        <>
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("sos.chooseHint")}
          </p>

          <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
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
                    "flex flex-col items-start gap-4 rounded-3xl border border-border/60 bg-white p-6 text-start shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    active && cn("ring-2", opt.selectedAccent)
                  )}
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl",
                      opt.accent
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold leading-snug text-foreground">
                      {t(`sos.${opt.id}.title`)}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`sos.${opt.id}.description`)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 rounded-3xl border border-border/60 bg-white px-5 py-5 text-center shadow-soft sm:flex-row sm:justify-between sm:text-start">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("sos.selected")}
                </p>
                <p className="text-base font-bold text-foreground">
                  {t(`sos.${selected}.title`)}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setSelected(null)}
                >
                  {t("sos.change")}
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => startForm(selected)}
                >
                  {t("sos.continue")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {successRef && (
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center shadow-soft">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-foreground">{t("sos.successTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("sos.successHint")}</p>
            <p className="font-mono text-sm font-bold text-primary" dir="ltr">
              {successRef}
            </p>
          </div>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => {
              setSuccessRef(null)
              setSelected(null)
              setShowForm(false)
            }}
          >
            {t("sos.newRequest")}
          </Button>
        </div>
      )}

      {showForm && selected && (
        <form
          onSubmit={onSubmit}
          className="mx-auto w-full max-w-xl space-y-5 rounded-3xl border border-border/60 bg-white p-5 shadow-soft sm:p-6"
          dir={dir}
        >
          <div className="space-y-1 text-center sm:text-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t(`sos.${selected}.title`)}
            </p>
            <h2 className="text-lg font-extrabold">{t("sos.formTitle")}</h2>
          </div>

          <Field label={t("sos.fields.placeName")}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 rounded-2xl"
            />
          </Field>

          <Field label={t("sos.fields.wilaya")}>
            <select
              value={wilayaCode}
              onChange={(e) => setWilayaCode(Number(e.target.value))}
              className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm"
              required
            >
              {wilayaOptions.map((w) => (
                <option key={w.code} value={w.code}>
                  {padWilayaCode(w.code)} — {locale === "ar" ? w.name_ar : w.name}
                </option>
              ))}
            </select>
          </Field>

          <SosGpsFields
            lat={lat}
            lng={lng}
            onLatChange={setLat}
            onLngChange={setLng}
            gpsBusy={gpsBusy}
            onUseGps={useMyLocation}
          />

          {(selected === "collectionSites" || selected === "damagedSites") && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {selected === "collectionSites"
                  ? t("sos.fields.aidCategoriesCollect")
                  : t("sos.fields.aidCategories")}
              </p>
              <p className="text-xs text-muted-foreground">
                {selected === "collectionSites"
                  ? t("sos.fields.aidCategoriesCollectHint")
                  : t("sos.fields.aidCategoriesHint")}
              </p>
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
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="rounded-full flex-1">
              {t("sos.submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setShowForm(false)
                setError("")
              }}
            >
              {t("sos.change")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 text-start">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
