import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowDown,
  Briefcase,
  ExternalLink,
  FileSearch,
  HandHeart,
  HeartHandshake,
  House,
  Layers,
  Map,
  MapPinned,
  Package,
  PlusCircle,
  Search,
  Truck,
  Users,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { mapsUrl, SOS_MATERIAL_CATEGORIES } from "@/lib/sos"
import type { SosAidCategoryId } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

import SosBanner from "@/components/sos/SosBanner"
import SosMaterialCard from "@/components/sos/SosMaterialCard"
import SosCallCard from "@/components/sos/SosCallCard"
import SosInterventionCard from "@/components/sos/SosInterventionCard"
import SosInteractiveMap from "@/components/sos/SosInteractiveMap"
import SosStatusCheckerModal from "@/components/sos/SosStatusCheckerModal"
import SosReportNeedModal from "@/components/sos/SosReportNeedModal"

// The 3 primary pillars requested by UX specifications
type PillarTab = "calls" | "material" | "interventions"

// Secondary filters under "Appels à mobilisation"
type MobilizationFilter = "all" | "professionals" | "volunteers" | "transport" | "other"

type LegacyOption = "collectionSites" | "damagedSites"

const LEGACY_OPTIONS = [
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

  // Primary 3 pillars navigation: initially null so details are hidden until user clicks a choice
  const [pillar, setPillar] = useState<PillarTab | null>(null)

  // Mobilization sub-filters
  const [mobFilter, setMobFilter] = useState<MobilizationFilter>("all")

  // Material category sub-filters
  const [materialFilter, setMaterialFilter] = useState<string>("all")

  // Secondary views
  const [showMap, setShowMap] = useState(false)
  const [showLegacy, setShowLegacy] = useState(false)
  const [legacySub, setLegacySub] = useState<LegacyOption>("collectionSites")

  // Search & modales
  const [q, setQ] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [showStatusChecker, setShowStatusChecker] = useState(false)
  const [showReportNeed, setShowReportNeed] = useState(false)

  const wilayaName = (code: number) => {
    const w = wilayas.find((x) => x.code === code)
    if (!w) return padWilayaCode(code)
    return `${padWilayaCode(code)} — ${locale === "ar" ? w.name_ar : w.name}`
  }

  // Count active critical emergencies for the alert banner
  const urgentCount = useMemo(() => {
    const critNeeds = (data.sosMaterialNeeds || []).filter(
      (m) => m.status === "validated" && m.priority === "critical"
    ).length
    const critCalls = (data.sosCalls || []).filter(
      (c) => c.status !== "closed" && c.urgencyLevel === "critical"
    ).length
    return critNeeds + critCalls
  }, [data.sosMaterialNeeds, data.sosCalls])

  // Real-time counts for the 3 main choices
  const callsCount = (data.sosCalls || []).filter((c) => c.status !== "closed").length
  const materialCount = (data.sosMaterialNeeds || []).length
  const interventionsCount = (data.sosInterventions || []).length

  // Filtered Calls (Appels à mobilisation)
  const mobilizationCalls = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data.sosCalls || [])
      .filter((c) => c.status !== "closed")
      .filter((c) => {
        // Sub-filter logic
        if (mobFilter === "professionals") {
          if (c.type !== "professional") return false
        } else if (mobFilter === "volunteers") {
          if (c.type !== "volunteer") return false
        } else if (mobFilter === "transport") {
          if (c.professionCategory !== "transport") return false
        } else if (mobFilter === "other") {
          if (c.professionCategory !== "other" && c.professionCategory !== "social") return false
        }

        // Location & Priority
        if (selectedCode && c.wilayaCode !== selectedCode) return false
        if (priorityFilter !== "all" && c.urgencyLevel !== priorityFilter) return false

        // Search needle
        if (!needle) return true
        return [
          c.title,
          c.commune,
          c.professionCategory || "",
          c.customProfessionTitle || "",
          c.description,
          String(c.wilayaCode),
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => {
        if (a.urgencyLevel === "critical" && b.urgencyLevel !== "critical") return -1
        if (b.urgencyLevel === "critical" && a.urgencyLevel !== "critical") return 1
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [data.sosCalls, mobFilter, selectedCode, priorityFilter, q])

  // Filtered Material Needs (Besoins matériels)
  const materialNeeds = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data.sosMaterialNeeds || [])
      .filter((m) => m.status === "validated" || m.status === "fulfilled")
      .filter((m) => {
        if (materialFilter !== "all" && m.category !== materialFilter) return false
        if (selectedCode && m.wilayaCode !== selectedCode) return false
        if (priorityFilter !== "all" && m.priority !== priorityFilter) return false
        if (!needle) return true
        return [m.title, m.commune, m.description, m.category, String(m.wilayaCode)]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => {
        if (a.priority === "critical" && b.priority !== "critical") return -1
        if (b.priority === "critical" && a.priority !== "critical") return 1
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [data.sosMaterialNeeds, materialFilter, selectedCode, priorityFilter, q])

  // Filtered Interventions
  const interventions = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data.sosInterventions || [])
      .filter((i) => i.status !== "cancelled")
      .filter((i) => {
        if (selectedCode && i.wilayaCode !== selectedCode) return false
        if (!needle) return true
        return [i.title, i.commune, i.coordinatorName, String(i.wilayaCode)]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.sosInterventions, selectedCode, q])

  // Legacy Sites (collection & damaged)
  const legacyItems = useMemo(() => {
    const source = legacySub === "collectionSites" ? data.sosCollectionSites : data.sosDamagedSites
    const needle = q.trim().toLowerCase()
    return source
      .filter((r) => r.status === "validated")
      .filter((r) => {
        if (selectedCode && r.wilayaCode !== selectedCode) return false
        if (!needle) return true
        return [r.name, String(r.wilayaCode)].join(" ").toLowerCase().includes(needle)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.sosCollectionSites, data.sosDamagedSites, legacySub, selectedCode, q])

  const scrollToCalls = () => {
    setPillar("calls")
    setShowMap(false)
    setShowLegacy(false)
    const el = document.getElementById("sos-main-content")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="page-shell section-gap">
      {/* 1. HERO SECTION: SIMPLE, HUMANE, WITH EXACTLY 2 ACTIONS */}
      <section className="relative mx-auto w-full max-w-5xl rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/90 to-surface p-8 sm:p-12 shadow-soft text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-extrabold text-primary border border-primary/20">
            <HeartHandshake className="h-4 w-4" />
            يد في يد — Module Solidarité SOS
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            La solidarité commence ici.
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Découvrez les besoins urgents, proposez votre aide et participez aux actions solidaires près de chez vous.
          </p>

          {/* EXACTLY TWO PRIMARY ACTIONS */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToCalls}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Users className="h-4 w-4" />
              Consulter les appels à mobilisation
              <ArrowDown className="h-3.5 w-3.5 opacity-80" />
            </button>

            <button
              type="button"
              onClick={() => setShowReportNeed(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-6 py-3.5 text-sm font-extrabold text-foreground hover:bg-muted/40 hover:border-primary/40 active:scale-[0.99] transition-all"
            >
              <PlusCircle className="h-4 w-4 text-primary" />
              Signaler un besoin
            </button>
          </div>

          {/* Subtle status tracking link */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowStatusChecker(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              <FileSearch className="h-3.5 w-3.5" />
              Suivre l'état d'une candidature ou d'un signalement
            </button>
          </div>
        </div>
      </section>

      <div id="sos-main-content" className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-2">
        {/* Banner for Active Critical Emergencies */}
        <SosBanner
          urgentCount={urgentCount}
          onViewUrgent={() => {
            setPriorityFilter("critical")
            setPillar("calls")
            setShowMap(false)
            setShowLegacy(false)
          }}
        />

        {/* 2. THE 3 CENTERED CHOICES */}
        <div className="flex flex-col items-center justify-center gap-4 py-2">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
            {/* 1. Appels à mobilisation */}
            <button
              type="button"
              onClick={() => {
                setPillar(pillar === "calls" ? null : "calls")
                setShowMap(false)
                setShowLegacy(false)
              }}
              className={cn(
                "group relative flex items-center gap-3 sm:gap-3.5 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] border shadow-soft cursor-pointer",
                !showMap && !showLegacy && pillar === "calls"
                  ? "bg-primary text-primary-foreground border-primary shadow-card ring-4 ring-primary/10 -translate-y-0.5"
                  : "bg-card text-foreground border-border/70 hover:border-primary/50 hover:shadow-card hover:-translate-y-0.5"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  !showMap && !showLegacy && pillar === "calls"
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}
              >
                <Users className="h-5 w-5" />
              </div>
              <div className="text-start">
                <span className="block text-sm sm:text-base font-extrabold leading-tight">
                  Appels à mobilisation
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    !showMap && !showLegacy && pillar === "calls"
                      ? "text-white/80"
                      : "text-muted-foreground"
                  )}
                >
                  {callsCount} mission{callsCount > 1 ? "s" : ""} ouverte{callsCount > 1 ? "s" : ""}
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-black",
                  !showMap && !showLegacy && pillar === "calls"
                    ? "bg-white text-primary"
                    : "bg-primary/10 text-primary"
                )}
              >
                {callsCount}
              </span>
            </button>

            {/* 2. Besoins matériels */}
            <button
              type="button"
              onClick={() => {
                setPillar(pillar === "material" ? null : "material")
                setShowMap(false)
                setShowLegacy(false)
              }}
              className={cn(
                "group relative flex items-center gap-3 sm:gap-3.5 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] border shadow-soft cursor-pointer",
                !showMap && !showLegacy && pillar === "material"
                  ? "bg-primary text-primary-foreground border-primary shadow-card ring-4 ring-primary/10 -translate-y-0.5"
                  : "bg-card text-foreground border-border/70 hover:border-primary/50 hover:shadow-card hover:-translate-y-0.5"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  !showMap && !showLegacy && pillar === "material"
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}
              >
                <Package className="h-5 w-5" />
              </div>
              <div className="text-start">
                <span className="block text-sm sm:text-base font-extrabold leading-tight">
                  Besoins matériels
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    !showMap && !showLegacy && pillar === "material"
                      ? "text-white/80"
                      : "text-muted-foreground"
                  )}
                >
                  {materialCount} besoin{materialCount > 1 ? "s" : ""} déclaré{materialCount > 1 ? "s" : ""}
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-black",
                  !showMap && !showLegacy && pillar === "material"
                    ? "bg-white text-primary"
                    : "bg-primary/10 text-primary"
                )}
              >
                {materialCount}
              </span>
            </button>

            {/* 3. Interventions */}
            <button
              type="button"
              onClick={() => {
                setPillar(pillar === "interventions" ? null : "interventions")
                setShowMap(false)
                setShowLegacy(false)
              }}
              className={cn(
                "group relative flex items-center gap-3 sm:gap-3.5 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] border shadow-soft cursor-pointer",
                !showMap && !showLegacy && pillar === "interventions"
                  ? "bg-primary text-primary-foreground border-primary shadow-card ring-4 ring-primary/10 -translate-y-0.5"
                  : "bg-card text-foreground border-border/70 hover:border-primary/50 hover:shadow-card hover:-translate-y-0.5"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  !showMap && !showLegacy && pillar === "interventions"
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="text-start">
                <span className="block text-sm sm:text-base font-extrabold leading-tight">
                  Interventions
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    !showMap && !showLegacy && pillar === "interventions"
                      ? "text-white/80"
                      : "text-muted-foreground"
                  )}
                >
                  {interventionsCount} action{interventionsCount > 1 ? "s" : ""} terrain
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-black",
                  !showMap && !showLegacy && pillar === "interventions"
                    ? "bg-white text-primary"
                    : "bg-primary/10 text-primary"
                )}
              >
                {interventionsCount}
              </span>
            </button>
          </div>

          {/* Secondary discreet shortcuts for Map & Collection Sites */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-border/40 w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setShowMap(!showMap)
                setShowLegacy(false)
                setPillar(null)
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all border",
                showMap
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:border-border"
              )}
            >
              <Map className="h-3.5 w-3.5" />
              Carte interactive
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLegacy(!showLegacy)
                setShowMap(false)
                setPillar(null)
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all border",
                showLegacy
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:border-border"
              )}
            >
              <MapPinned className="h-3.5 w-3.5" />
              Points de collecte
            </button>
          </div>
        </div>

        {/* 3. DETAILS HEADER, SUB-FILTERS & SEARCH (VISIBLE ONLY WHEN A PILLAR IS OPEN) */}
        {!showMap && !showLegacy && pillar !== null && (
          <div className="space-y-4 animate-fade-in border-t border-border/50 pt-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>Détails affichés :</span>
                <strong className="text-foreground">
                  {pillar === "calls"
                    ? "Appels à mobilisation"
                    : pillar === "material"
                    ? "Besoins matériels"
                    : "Interventions"}
                </strong>
              </span>

              <button
                type="button"
                onClick={() => setPillar(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1 rounded-xl transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Masquer les détails
              </button>
            </div>

            {/* Horizontal Sub-Filters for Appels à mobilisation */}
            {pillar === "calls" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-muted-foreground shrink-0 pe-2">
                  Filtrer par rôle :
                </span>
                {(
                  [
                    { id: "all", label: "Tous les appels", icon: Layers },
                    { id: "professionals", label: "Professionnels", icon: Briefcase },
                    { id: "volunteers", label: "Bénévoles", icon: Users },
                    { id: "transport", label: "Transport et logistique", icon: Truck },
                    { id: "other", label: "Autres compétences", icon: HandHeart },
                  ] as const
                ).map((f) => {
                  const Icon = f.icon
                  const active = mobFilter === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMobFilter(f.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                        active
                          ? "bg-foreground text-background"
                          : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {f.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Horizontal Sub-Filters for Besoins matériels */}
            {pillar === "material" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-muted-foreground shrink-0 pe-2">
                  Catégories :
                </span>
                <button
                  type="button"
                  onClick={() => setMaterialFilter("all")}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    materialFilter === "all"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Toutes
                </button>
                {SOS_MATERIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMaterialFilter(cat.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                      materialFilter === cat.id
                        ? "bg-foreground text-background"
                        : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(cat.labelKey)}
                  </button>
                ))}
              </div>
            )}

            {/* Search bar & Priority tag */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher par titre, commune, compétence..."
                  className="h-11 rounded-2xl ps-10 text-xs shadow-sm bg-card border-border/70 text-foreground"
                />
              </div>

              {priorityFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setPriorityFilter("all")}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/40 bg-rose-950/60 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-colors"
                >
                  Filtre : Urgences critiques (Effacer)
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. CONTENT SECTIONS */}

        {/* A. CARTE SOS */}
        {showMap && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Cartographie des besoins & interventions
              </h3>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Fermer la carte
              </button>
            </div>
            <SosInteractiveMap />
          </div>
        )}

        {/* B. LIEUX DE COLLECTE (LEGACY 100% PRESERVED) */}
        {showLegacy && !showMap && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-primary" />
                Lieux de collecte et sites sinistrés
              </h3>
              <button
                type="button"
                onClick={() => setShowLegacy(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {LEGACY_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = legacySub === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLegacySub(opt.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 text-center shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] hover:border-primary/30 hover:shadow-card focus-visible:outline-none sm:flex-row sm:text-start sm:p-5",
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
                      <h2 className="text-sm sm:text-base font-extrabold leading-snug text-foreground">
                        {t(`sos.${opt.id}.title`)}
                      </h2>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {legacyItems.map((r) => (
                <article
                  key={r.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-card transition-shadow duration-[var(--duration-standard)]"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-foreground">{r.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {wilayaName(r.wilayaCode)}
                    </p>
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
              {legacyItems.length === 0 && (
                <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
                  <p className="text-muted-foreground">{t("admin.sosCrm.emptyCollection")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* C. PILLAR 1: APPELS À MOBILISATION */}
        {!showMap && !showLegacy && pillar === "calls" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mobilizationCalls.map((call) => (
                <SosCallCard key={call.id} call={call} />
              ))}
            </div>

            {mobilizationCalls.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Aucun appel à mobilisation ne correspond à ces critères pour le moment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* D. PILLAR 2: BESOINS MATÉRIELS */}
        {!showMap && !showLegacy && pillar === "material" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materialNeeds.map((need) => (
                <SosMaterialCard key={need.id} need={need} />
              ))}
            </div>

            {materialNeeds.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Aucun besoin matériel ne correspond à ces critères pour le moment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* E. PILLAR 3: INTERVENTIONS */}
        {!showMap && !showLegacy && pillar === "interventions" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2">
              {interventions.map((interv) => (
                <SosInterventionCard key={interv.id} intervention={interv} />
              ))}
            </div>

            {interventions.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Aucune intervention enregistrée pour le moment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Status Checker Modal */}
      <SosStatusCheckerModal
        isOpen={showStatusChecker}
        onClose={() => setShowStatusChecker(false)}
      />

      {/* Citizen Report Need Modal */}
      <SosReportNeedModal
        isOpen={showReportNeed}
        onClose={() => setShowReportNeed(false)}
      />
    </div>
  )
}
