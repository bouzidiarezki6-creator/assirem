import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { MapPin, RotateCcw } from "lucide-react"
import AlgeriaWilayasSvgMap, { type SelectedWilaya } from "@/components/map/AlgeriaWilayasSvgMap"
import InstitutionsOsmMap from "@/components/map/InstitutionsOsmMap"
import InstitutionCard from "@/components/shared/InstitutionCard"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import type { Institution } from "@/lib/types"
import type { StructureKind } from "@/lib/wilayas"
import { STRUCTURE_KIND_I18N } from "@/lib/wilayas"
import { NATIONAL_PLACES } from "@/data/nationalPlaces"

type ExternalPlace = {
  id: string
  name: string
  address?: string
  lat: number
  lng: number
  wilayaCode: number
  structureKind?: StructureKind
  authority?: "Yed fel yed" | "DJS"
  source?: string
  rating?: number
  phone?: string
  imageDataUrl?: string
}

function placeToInstitution(p: ExternalPlace): Institution {
  return {
    id: p.id,
    name: p.name,
    type: p.structureKind ?? "autre",
    location: p.address ?? "",
    phone: p.phone ?? "",
    imageDataUrl: p.imageDataUrl ?? null,
    published: true,
    wilayaCode: p.wilayaCode,
    lat: p.lat,
    lng: p.lng,
    structureKind: p.structureKind ?? "autre",
    authority: p.authority ?? "Yed fel yed",
  }
}

const BEJAIA: SelectedWilaya = {
  code: 6,
  nameLatin: "Bejaia",
  nameAr: "بجاية",
}

export default function AlgeriaMapExplorer() {
  const { data } = useAppData()
  const { t, locale } = useI18n()
  const {
    wilayas,
    selectedCode,
    setSelectedCode,
  } = useLocationFilter()
  const [selected, setSelectedLocal] = useState<SelectedWilaya | null>(null)
  const [hovered, setHovered] = useState<SelectedWilaya | null>(null)
  const [kindFilter, setKindFilter] = useState<string>("all")
  const [nationalPlaces, setNationalPlaces] = useState<Institution[]>(NATIONAL_PLACES)

  // Keep map selection aligned with navbar wilaya filter
  useEffect(() => {
    if (selectedCode === null) {
      setSelectedLocal(null)
      return
    }
    const meta = wilayas.find((w) => w.code === selectedCode)
    if (meta) {
      setSelectedLocal({
        code: meta.code,
        nameLatin: meta.name,
        nameAr: meta.name_ar,
      })
      return
    }
    if (selectedCode === 6) setSelectedLocal(BEJAIA)
  }, [selectedCode, wilayas])

  const setSelected = (w: SelectedWilaya | null) => {
    setSelectedLocal(w)
    setSelectedCode(w?.code ?? null)
  }

  useEffect(() => {
    let cancelled = false
    fetch("/geo/places-algeria.json")
      .then((r) => r.json())
      .then((payload: { places?: ExternalPlace[] }) => {
        if (cancelled) return
        if (payload?.places && payload.places.length > 0) {
          const list = payload.places.map(placeToInstitution)
          setNationalPlaces(list)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const selectedMeta = useMemo(() => {
    if (!selected) return null
    return wilayas.find((w) => w.code === selected.code) ?? {
      code: selected.code,
      name: selected.nameLatin,
      name_ar: selected.nameAr,
      latitude: selected.code === 6 ? 36.7525 : 28,
      longitude: selected.code === 6 ? 5.0833 : 3,
    }
  }, [selected, wilayas])

  const published = useMemo(
    () => data.institutions.filter((i) => i.published),
    [data.institutions]
  )

  const filtered = useMemo(() => {
    const byId = new Map<string, Institution>()
    for (const p of nationalPlaces) {
      byId.set(p.id, p)
    }
    for (const i of published) {
      byId.set(i.id, i)
    }
    let list = Array.from(byId.values())

    if (selected) {
      list = list.filter((i) => i.wilayaCode === selected.code)
    }
    if (kindFilter !== "all") {
      list = list.filter((i) => (i.structureKind ?? "autre") === kindFilter)
    }
    return list
  }, [published, selected, kindFilter, nationalPlaces])

  const displayName = selected
    ? locale === "ar"
      ? selected.nameAr
      : selected.nameLatin
    : null

  const kinds = [
    "all",
    "maison_jeunes",
    "auberge",
    "foyer",
    "centre_culturel",
    "terrain",
    "camp",
  ] as const

  return (
    <div className="space-y-8">
      {/* ── 1. CENTERED ALGERIA SVG MAP ── */}
      <div className="mx-auto max-w-2xl w-full flex flex-col items-center text-center space-y-4">
        {selected && (
          <div className="flex w-full items-center justify-end px-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:text-white"
              onClick={() => {
                setSelected(null)
                setKindFilter("all")
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("map.reset")}
            </Button>
          </div>
        )}

        <div className="w-full">
          <AlgeriaWilayasSvgMap
            selectedCode={selected?.code ?? null}
            hoveredCode={hovered?.code ?? null}
            onHover={setHovered}
            onSelect={(w) => {
              setSelected(w)
              // Smooth scroll to the MAPS below
              setTimeout(() => {
                const el = document.getElementById("wilaya-maps-section")
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "nearest" })
                }
              }, 100)
            }}
          />
        </div>

        {/* Selected or Hovered Wilaya Quick Banner */}
        <div className="w-full">
          {displayName ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-black/25 px-5 py-3.5 flex items-center justify-between gap-3 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="text-start min-w-0">
                  <p className="font-extrabold text-white text-base sm:text-lg truncate">
                    {displayName}
                    <span className="ms-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-emerald-300 border border-primary/30">
                      ولاية {selected?.code}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-300/80">
                    {t("map.selectedHint", { count: filtered.length })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("wilaya-maps-section")
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                }}
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary/20"
              >
                عرض MAPS ↓
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-400/20 bg-black/20 px-4 py-3.5 text-center text-sm font-medium text-emerald-300/80 backdrop-blur-xl">
              🗺️ {t("home.mapHint")}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. MAPS SECTION DIRECTLY BELOW THE SVG MAP (Appears only when a wilaya is selected) ── */}
      {selected && (
        <div id="wilaya-maps-section" className="space-y-6 pt-2 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {t("map.facilitiesTitle")} — {displayName}
                </h3>
              </div>
              <p className="text-sm text-emerald-300/70 mt-1">
                {t("map.facilitiesSubtitle")}
              </p>
            </div>

            {/* Kind filters */}
            <div className="flex flex-wrap gap-1.5">
              {kinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindFilter(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                    kindFilter === k
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(0,255,136,0.3)] font-bold scale-[1.03]"
                      : "bg-[#041c12] text-white/80 border-emerald-500/30 hover:border-emerald-400 hover:text-white"
                  }`}
                >
                  {k === "all" ? t("map.allKinds") : t(STRUCTURE_KIND_I18N[k])}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet OSM Map container */}
          <div className="w-full rounded-3xl overflow-hidden border border-emerald-400/30 shadow-2xl bg-black/25 backdrop-blur-2xl">
            <InstitutionsOsmMap institutions={filtered} wilaya={selectedMeta} />
          </div>

          {/* ── 3. FACILITIES CARDS GRID DIRECTLY BELOW THE MAPS ── */}
          {filtered.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>{t("map.listTitle")}</span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/20 text-emerald-300 border border-primary/30">
                    {filtered.length} منشأة
                  </span>
                </h3>
                <Button asChild variant="outline" size="sm" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60 hover:text-white rounded-full">
                  <Link to={`/institutions?wilaya=${selected.code}`}>
                    {t("map.seeAll")}
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(0, 9).map((inst) => (
                  <InstitutionCard
                    key={inst.id}
                    name={inst.name}
                    type={
                      inst.structureKind
                        ? t(STRUCTURE_KIND_I18N[inst.structureKind])
                        : inst.type
                    }
                    location={inst.location}
                    phone={inst.phone}
                    image={inst.imageDataUrl ?? undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
