import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { ExternalLink } from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { mapsUrl } from "@/lib/sos"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type MarkerKind = "critical" | "material" | "professional" | "volunteer" | "intervention"

const MARKER_COLORS: Record<MarkerKind, { color: string; label: string }> = {
  critical: { color: "#e11d48", label: "Urgence critique" },
  material: { color: "#ea580c", label: "Besoins matériels" },
  professional: { color: "#2563eb", label: "Appels professionnels" },
  volunteer: { color: "#16a34a", label: "Missions bénévoles" },
  intervention: { color: "#9333ea", label: "Interventions terrain" },
}

function createColoredIcon(color: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M14 1C7.4 1 2 6.4 2 13c0 9.5 12 25 12 25s12-15.5 12-25C26 6.4 20.6 1 14 1z"/>
      <circle cx="14" cy="13" r="5" fill="#ffffff"/>
    </svg>`
  )
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

function MapFlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.85 })
  }, [center, zoom, map])
  return null
}

type MapPoint = {
  id: string
  kind: MarkerKind
  title: string
  subtitle: string
  commune: string
  wilayaCode: number
  lat: number
  lng: number
  actionLabel?: string
  status?: string
}

export default function SosInteractiveMap() {
  const { data } = useAppData()
  const { wilayas, selectedCode } = useLocationFilter()
  const [filterKind, setFilterKind] = useState<MarkerKind | "all">("all")

  const selectedWilaya = useMemo(
    () => wilayas.find((w) => w.code === selectedCode) || null,
    [wilayas, selectedCode]
  )

  const points: MapPoint[] = useMemo(() => {
    const list: MapPoint[] = []

    // 1. Besoins matériels
    ;(data.sosMaterialNeeds || [])
      .filter((m) => m.status === "validated" && m.lat != null && m.lng != null)
      .forEach((m) => {
        const isCrit = m.priority === "critical"
        list.push({
          id: `mat-${m.id}`,
          kind: isCrit ? "critical" : "material",
          title: m.title,
          subtitle: `${m.receivedQuantity} / ${m.requiredQuantity} ${m.unit} (${m.category})`,
          commune: m.commune,
          wilayaCode: m.wilayaCode,
          lat: m.lat!,
          lng: m.lng!,
          actionLabel: "Détails besoin",
          status: m.status,
        })
      })

    // 2. Appels à mobilisation (Pro & Bénévoles)
    ;(data.sosCalls || [])
      .filter((c) => c.status !== "closed" && c.lat != null && c.lng != null)
      .forEach((c) => {
        const isCrit = c.urgencyLevel === "critical"
        const kind: MarkerKind = isCrit
          ? "critical"
          : c.type === "professional"
            ? "professional"
            : "volunteer"
        list.push({
          id: `call-${c.id}`,
          kind,
          title: c.title,
          subtitle: `${c.acceptedCount} / ${c.requiredSlots} places (${c.commune})`,
          commune: c.commune,
          wilayaCode: c.wilayaCode,
          lat: c.lat!,
          lng: c.lng!,
          actionLabel: "Voir l'appel",
          status: c.status,
        })
      })

    // 3. Interventions terrain
    ;(data.sosInterventions || [])
      .filter((i) => i.status === "in_progress" && i.lat != null && i.lng != null)
      .forEach((i) => {
        list.push({
          id: `int-${i.id}`,
          kind: "intervention",
          title: i.title,
          subtitle: `Coord: ${i.coordinatorName} (${i.teams?.length || 0} équipes)`,
          commune: i.commune,
          wilayaCode: i.wilayaCode,
          lat: i.lat!,
          lng: i.lng!,
          actionLabel: "Voir intervention",
          status: i.status,
        })
      })

    // 4. Lieux de collecte legacy
    ;(data.sosCollectionSites || [])
      .filter((s) => s.status === "validated" && s.lat != null && s.lng != null)
      .forEach((s) => {
        list.push({
          id: `col-${s.id}`,
          kind: "material",
          title: `Collecte : ${s.name}`,
          subtitle: `Lieu de collecte de dons`,
          commune: "",
          wilayaCode: s.wilayaCode,
          lat: s.lat,
          lng: s.lng,
          actionLabel: "Lieu de collecte",
          status: s.status,
        })
      })

    return list
  }, [data.sosMaterialNeeds, data.sosCalls, data.sosInterventions, data.sosCollectionSites])

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedCode && p.wilayaCode !== selectedCode) return false
      if (filterKind !== "all" && p.kind !== filterKind) return false
      return true
    })
  }, [points, selectedCode, filterKind])

  const center: [number, number] = selectedWilaya
    ? [selectedWilaya.latitude, selectedWilaya.longitude]
    : filteredPoints[0]
      ? [filteredPoints[0].lat, filteredPoints[0].lng]
      : [36.4578, 4.5421] // Default Akbou / Béjaïa

  const zoom = selectedWilaya ? 10 : 8

  return (
    <div className="space-y-3">
      {/* Legend & Filter pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilterKind("all")}
          className={cn(
            "rounded-full px-3 py-1 font-semibold transition-colors",
            filterKind === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Tous ({points.length})
        </button>
        {(Object.keys(MARKER_COLORS) as MarkerKind[]).map((k) => {
          const cfg = MARKER_COLORS[k]
          const count = points.filter((p) => p.kind === k).length
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilterKind(k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-colors",
                filterKind === k
                  ? "ring-2 ring-foreground/20 font-bold"
                  : "hover:bg-muted/60"
              )}
              style={{
                backgroundColor: `${cfg.color}18`,
                color: cfg.color,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Map canvas */}
      <div className="relative h-[360px] sm:h-[440px] overflow-hidden rounded-3xl border border-border/80 shadow-soft">
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
          <MapFlyTo center={center} zoom={zoom} />
          {filteredPoints.map((pt) => {
            const cfg = MARKER_COLORS[pt.kind]
            return (
              <Marker
                key={pt.id}
                position={[pt.lat, pt.lng]}
                icon={createColoredIcon(cfg.color)}
              >
                <Popup>
                  <div className="p-1 space-y-1.5 min-w-[200px] text-xs">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px]"
                      style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <h4 className="font-extrabold text-foreground text-sm leading-snug">
                      {pt.title}
                    </h4>
                    <p className="text-muted-foreground">{pt.subtitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Wilaya {padWilayaCode(pt.wilayaCode)} {pt.commune ? `· ${pt.commune}` : ""}
                    </p>
                    <div className="pt-1.5 border-t border-border/40">
                      <a
                        href={mapsUrl(pt.lat, pt.lng)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir sur Google Maps
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
