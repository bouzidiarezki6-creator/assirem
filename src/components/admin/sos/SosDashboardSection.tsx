import { useState } from "react"
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Package,
  ShieldAlert,
  Users,
} from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

export default function SosDashboardSection() {
  const { t } = useI18n()
  const { data } = useAppData()
  const [showAllStats, setShowAllStats] = useState(false)

  const materialNeeds = data.sosMaterialNeeds || []
  const calls = data.sosCalls || []
  const applications = data.sosApplications || []
  const interventions = data.sosInterventions || []

  // 1. Urgences actives
  const activeEmergencies =
    materialNeeds.filter((m) => m.status === "validated" && m.priority === "critical").length +
    calls.filter((c) => c.status !== "closed" && c.urgencyLevel === "critical").length

  // 2. Candidatures en attente
  const pendingApps = applications.filter((a) => a.status === "pending").length

  // 3. Appels ouverts
  const openCalls = calls.filter((c) => c.status === "open").length

  // 4. Interventions en cours
  const activeInterventions = interventions.filter((i) => i.status === "in_progress").length

  // Secondary metrics
  const totalNeeds = materialNeeds.length
  const missingResourcesCount = materialNeeds
    .filter((m) => m.status === "validated")
    .reduce((acc, m) => acc + Math.max(0, m.requiredQuantity - (m.receivedQuantity || 0)), 0)
  const acceptedPersons = applications.filter((a) => a.status === "accepted").length
  const completedInterventions = interventions.filter((i) => i.status === "completed").length

  // Primary 4 metrics requested by UX specifications
  const primaryKpis = [
    {
      label: "Urgences actives",
      value: activeEmergencies,
      subtext: "Besoins critiques & alertes",
      icon: ShieldAlert,
      iconBg: "bg-rose-50 text-rose-600 border-rose-200",
      accentBorder: "hover:border-rose-300",
    },
    {
      label: "Candidatures en attente",
      value: pendingApps,
      subtext: "À examiner par les coordinateurs",
      icon: Clock,
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
      accentBorder: "hover:border-indigo-300",
    },
    {
      label: "Appels ouverts",
      value: openCalls,
      subtext: "Missions en recrutement",
      icon: Briefcase,
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
      accentBorder: "hover:border-blue-300",
    },
    {
      label: "Interventions en cours",
      value: activeInterventions,
      subtext: "Équipes déployées sur le terrain",
      icon: Layers,
      iconBg: "bg-purple-50 text-purple-600 border-purple-200",
      accentBorder: "hover:border-purple-300",
    },
  ]

  // Secondary metrics accessible via toggle
  const secondaryKpis = [
    {
      label: t("admin.sosCrm.kpis.totalNeeds"),
      value: totalNeeds,
      icon: Package,
      iconBg: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: t("admin.sosCrm.kpis.missingResources"),
      value: missingResourcesCount.toLocaleString(),
      icon: AlertTriangle,
      iconBg: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: t("admin.sosCrm.kpis.acceptedPersons"),
      value: acceptedPersons,
      icon: Users,
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: t("admin.sosCrm.kpis.completedInterventions"),
      value: completedInterventions,
      icon: CheckCircle2,
      iconBg: "bg-teal-50 text-teal-700 border-teal-200",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Editorial Overview Header */}
      <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-surface p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Pilotage central SOS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
              Vue d'ensemble de la coordination
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1 max-w-xl leading-relaxed">
              Suivi en temps réel des alertes, candidatures de professionnels et de bénévoles, et gestion des interventions terrain.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAllStats(!showAllStats)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors shadow-xs"
          >
            {showAllStats ? (
              <>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                Masquer les détails
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                Voir toutes les statistiques
              </>
            )}
          </button>
        </div>
      </div>

      {/* THE 4 PRIMARY MAJOR KEY METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryKpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              className={`flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-[var(--duration-standard)] ease-[var(--ease-out)] ${kpi.accentBorder} hover:shadow-card`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {kpi.label}
                </span>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${kpi.iconBg}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>

              <div>
                <p className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* SECONDARY METRICS: SHOWN ONLY WHEN TOGGLED */}
      {showAllStats && (
        <div className="space-y-3 pt-2 animate-fade-in">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider ps-1">
            Indicateurs secondaires de mobilisation & logistique
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryKpis.map((kpi, idx) => {
              const Icon = kpi.icon
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-white"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${kpi.iconBg}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-600 truncate">
                      {kpi.label}
                    </p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{kpi.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
