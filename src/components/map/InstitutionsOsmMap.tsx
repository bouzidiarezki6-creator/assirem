import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Building2 } from "lucide-react"
import type { Institution } from "@/lib/types"
import { useI18n } from "@/context/I18nProvider"
import { STRUCTURE_KIND_I18N, type WilayaMeta } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

const KIND_COLORS: Record<string, string> = {
  maison_jeunes: "#1B7D67",
  auberge: "#ef6c00",
  foyer: "#00897b",
  centre_culturel: "#5e35b1",
  terrain: "#0288d1",
  camp: "#c0ca33",
  autre: "#546e7a",
}

function kindIcon(kind: string) {
  const color = KIND_COLORS[kind] ?? KIND_COLORS.autre
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M14 1C7.4 1 2 6.4 2 13c0 9.5 12 25 12 25s12-15.5 12-25C26 6.4 20.6 1 14 1z"/>
      <circle cx="14" cy="13" r="5" fill="#fff"/>
    </svg>`
  )
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.85 })
  }, [center, zoom, map])
  return null
}

type Props = {
  institutions: Institution[]
  wilaya: WilayaMeta | null
  className?: string
}

export default function InstitutionsOsmMap({ institutions, wilaya, className }: Props) {
  const { t } = useI18n()

  const withCoords = useMemo(
    () => institutions.filter((i) => typeof i.lat === "number" && typeof i.lng === "number"),
    [institutions]
  )

  const center: [number, number] = wilaya
    ? [wilaya.latitude, wilaya.longitude]
    : withCoords[0]
      ? [withCoords[0].lat!, withCoords[0].lng!]
      : [28.0, 2.5]

  const zoom = wilaya ? 10 : withCoords.length ? 6 : 5

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative h-[320px] md:h-[380px] overflow-hidden rounded-xl border border-green-100">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full z-0"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo center={center} zoom={zoom} />
          {withCoords.map((inst) => (
            <Marker
              key={inst.id}
              position={[inst.lat!, inst.lng!]}
              icon={kindIcon(inst.structureKind ?? "autre")}
            >
              <Popup>
                <div className="space-y-1 text-sm min-w-[160px]">
                  <p className="font-bold text-primary">{inst.name}</p>
                  <p className="text-gray-600">
                    {t(STRUCTURE_KIND_I18N[inst.structureKind ?? "autre"])}
                    {inst.authority ? ` · ${inst.authority}` : ""}
                  </p>
                  <p className="text-gray-500">{inst.location}</p>
                  {inst.phone && <p className="text-gray-500">{inst.phone}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {withCoords.length === 0 && (
          <div className="absolute inset-x-0 bottom-3 mx-3 rounded-md bg-white/95 px-3 py-2 text-xs text-gray-600 border shadow-sm z-[400]">
            {t("map.noMarkers")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 inline-flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {t("map.markerCount", { count: withCoords.length })}
        </span>
      </div>
    </div>
  )
}
