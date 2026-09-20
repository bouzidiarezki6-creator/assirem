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
}

function placeToInstitution(p: ExternalPlace): Institution {
  return {
    id: p.id,
    name: p.name,
    type: p.structureKind ?? "autre",
    location: p.address ?? "",
    phone: "",
    imageDataUrl: null,
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
  const [bejaiaPlaces, setBejaiaPlaces] = useState<Institution[]>([])

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
    fetch("/geo/places-bejaia.json")
      .then((r) => r.json())
      .then((payload: { places?: ExternalPlace[] }) => {
        if (cancelled) return
        const list = (payload.places ?? []).map(placeToInstitution)
        setBejaiaPlaces(list)
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
    let list = [...published]
    if (selected?.code === 6 && bejaiaPlaces.length) {
      const byId = new Map<string, Institution>()
      for (const i of list.filter((x) => x.wilayaCode === 6)) byId.set(i.id, i)
      for (const p of bejaiaPlaces) {
        if (!byId.has(p.id)) byId.set(p.id, p)
      }
      list = [...list.filter((x) => x.wilayaCode !== 6), ...byId.values()]
    }
    if (selected) list = list.filter((i) => i.wilayaCode === selected.code)
    if (kindFilter !== "all") list = list.filter((i) => (i.structureKind ?? "autre") === kindFilter)
    return list
  }, [published, selected, kindFilter, bejaiaPlaces])

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
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">{t("home.mapHelp")}</p>
            {selected && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setSelected(null)
                  setKindFilter("all")
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("map.reset")}
              </Button>
            )}
          </div>
          <AlgeriaWilayasSvgMap
            selectedCode={selected?.code ?? null}
            hoveredCode={hovered?.code ?? null}
            onHover={setHovered}
            onSelect={setSelected}
          />
          {displayName && (
            <div className="rounded-lg border border-green-100 bg-primary/10/70 px-4 py-3 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary">{displayName}</p>
                <p className="text-sm text-gray-600">
                  {t("map.selectedHint", { count: filtered.length })}
                </p>
                {selected?.code === 6 && (
                  <p className="text-xs text-primary mt-1">{t("map.bejaiaFocus")}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t("map.facilitiesTitle")}</h3>
            <p className="text-sm text-gray-500">{t("map.facilitiesSubtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold border transition-colors ${
                  kindFilter === k
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary/40"
                }`}
              >
                {k === "all" ? t("map.allKinds") : t(STRUCTURE_KIND_I18N[k])}
              </button>
            ))}
          </div>

          <InstitutionsOsmMap institutions={filtered} wilaya={selectedMeta} />
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900">{t("map.listTitle")}</h3>
            <Button asChild variant="outline" size="sm">
              <Link
                to={
                  selected
                    ? `/institutions?wilaya=${selected.code}`
                    : "/institutions"
                }
              >
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
  )
}
