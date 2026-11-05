import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Eye,
  History,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAppData } from "@/context/DataProvider"
import { useGovernance } from "@/context/GovernanceContext"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { getVolunteerTier } from "@/lib/levels"
import { padWilayaCode } from "@/lib/wilayas"
import type { VolunteerAccount } from "@/lib/types"
import VolunteerBadgeCard from "@/components/volunteer/VolunteerBadgeCard"

const TIER_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  engage: "Engagé",
  actif: "Actif",
  confirme: "Confirmé",
  exemplaire: "Exemplaire",
  ambassadeur: "Ambassadeur",
}

export default function VolunteerAdminSection() {
  const {
    data,
    adjustVolunteerPoints,
    setVolunteerStatus,
    getVolunteerTransactions,
  } = useAppData()
  const { currentUser } = useGovernance()
  const { formatDateTime, formatDate } = useI18n()
  const { wilayas } = useLocationFilter()

  const isAuditor = currentUser.role === "national_auditor"

  const [search, setSearch] = useState("")
  const [wilayaFilter, setWilayaFilter] = useState<number | "all">("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Selected for Details Modal
  const [activeVolunteerId, setActiveVolunteerId] = useState<string | null>(null)

  // Selected for Points Adjustment Modal
  const [adjustTargetVol, setAdjustTargetVol] = useState<VolunteerAccount | null>(null)
  const [adjustDelta, setAdjustDelta] = useState<string>("")
  const [adjustReason, setAdjustReason] = useState<string>("")
  const [adjustError, setAdjustError] = useState<string>("")
  const [adjustSuccess, setAdjustSuccess] = useState<string>("")

  const volunteers = data.volunteerAccounts || []

  // Filtered list
  const filtered = useMemo(() => {
    return volunteers.filter((vol) => {
      const q = search.trim().toLowerCase()
      if (q) {
        const full = `${vol.firstName} ${vol.lastName} ${vol.email} ${vol.phone} ${vol.volunteerCode} ${vol.commune}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      if (wilayaFilter !== "all" && vol.wilayaCode !== wilayaFilter) return false
      if (statusFilter !== "all" && vol.status !== statusFilter) return false
      return true
    })
  }, [volunteers, search, wilayaFilter, statusFilter])

  const activeVolunteer = useMemo(() => {
    return volunteers.find((v) => v.id === activeVolunteerId) ?? null
  }, [volunteers, activeVolunteerId])

  const activeVolTransactions = useMemo(() => {
    if (!activeVolunteer) return []
    return getVolunteerTransactions(activeVolunteer.id)
  }, [activeVolunteer, getVolunteerTransactions])

  const activeVolMissions = useMemo(() => {
    if (!activeVolunteer) return []
    return (data.sosApplications || []).filter(
      (a) =>
        a.volunteerId === activeVolunteer.id ||
        (a.email && a.email.toLowerCase() === activeVolunteer.email.toLowerCase()) ||
        (a.phone && a.phone === activeVolunteer.phone)
    )
  }, [activeVolunteer, data.sosApplications])

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAdjustError("")
    setAdjustSuccess("")

    const delta = parseInt(adjustDelta, 10)
    if (isNaN(delta) || delta === 0) {
      setAdjustError("Le montant doit être un entier différent de zéro (+ ou -).")
      return
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 5) {
      setAdjustError("Une justification obligatoire d'au moins 5 caractères est requise.")
      return
    }
    if (!adjustTargetVol) return

    const res = adjustVolunteerPoints({
      volunteerId: adjustTargetVol.id,
      amount: delta,
      reason: adjustReason.trim(),
      adminNote: "Session administrateur",
      author: currentUser,
    })

    if (!res.ok) {
      setAdjustError("Erreur lors de l'ajustement : " + res.error)
    } else {
      setAdjustSuccess(`Points ajustés avec succès (${delta > 0 ? "+" : ""}${delta} pts). Nouveau solde : ${res.newPoints} pts.`)
      setTimeout(() => {
        setAdjustTargetVol(null)
        setAdjustDelta("")
        setAdjustReason("")
        setAdjustSuccess("")
      }, 1400)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Award className="h-7 w-7 text-emerald-700" />
            Programme des Bénévoles & Récompenses
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Gestion des comptes bénévoles, validation des points, attribution de badges et suivi des missions solidaires.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-center shadow-xs">
            <p className="text-xs text-slate-600 font-bold">Bénévoles inscrits</p>
            <p className="text-xl font-black text-emerald-800">{volunteers.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-center shadow-xs">
            <p className="text-xs text-slate-600 font-bold">Points distribués</p>
            <p className="text-xl font-black text-slate-950">
              {volunteers.reduce((sum, v) => sum + (v.points || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, code, tél, commune..."
                className="ps-10 rounded-2xl h-10 text-xs sm:text-sm"
              />
            </div>

            {/* Wilaya Filter */}
            <div>
              <select
                value={wilayaFilter}
                onChange={(e) => setWilayaFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-xs sm:text-sm font-medium"
              >
                <option value="all">Toutes les wilayas (Algérie)</option>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.code}>
                    {padWilayaCode(w.code)} — {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-xs sm:text-sm font-medium"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volunteers Table */}
      <div className="rounded-3xl border border-border/80 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4 text-start">Code & Bénévole</th>
                <th className="py-3 px-4 text-start">Wilaya / Commune</th>
                <th className="py-3 px-4 text-start">Niveau / Palier</th>
                <th className="py-3 px-4 text-center">Solde Points</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    Aucun bénévole ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filtered.map((vol) => {
                  const tier = getVolunteerTier(vol.points)
                  return (
                    <tr key={vol.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-800 text-sm">
                            {vol.firstName.charAt(0)}{vol.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {vol.firstName} {vol.lastName}
                            </p>
                            <p className="font-mono text-xs text-emerald-800 font-bold">
                              {vol.volunteerCode}
                            </p>
                            <p className="text-[11px] text-slate-600 font-medium truncate">{vol.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {vol.commune}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          Wilaya {padWilayaCode(vol.wilayaCode)}
                        </p>
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200">
                          <span>{tier.icon}</span>
                          <span>{TIER_LABELS[tier.id] || tier.id}</span>
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {vol.points} pts
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {vol.status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                            <ShieldAlert className="h-3 w-3" /> Suspendu
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Fiche */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveVolunteerId(vol.id)}
                            className="rounded-xl h-8 px-2.5 text-xs font-semibold gap-1 hover:bg-emerald-50 hover:text-emerald-800"
                            title="Consulter la fiche complète"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Fiche</span>
                          </Button>

                          {/* Ajuster points (Gated by ABAC) */}
                          {!isAuditor && (currentUser.role === "national_admin" || currentUser.wilayaCode === vol.wilayaCode) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAdjustTargetVol(vol)
                                setAdjustDelta("")
                                setAdjustReason("")
                                setAdjustError("")
                                setAdjustSuccess("")
                              }}
                              className="rounded-xl h-8 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              title="Ajuster manuellement les points"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>± Points</span>
                            </Button>
                          )}

                          {/* Suspendre / Activer (Gated by ABAC) */}
                          {!isAuditor && (currentUser.role === "national_admin" || currentUser.wilayaCode === vol.wilayaCode) && (
                            vol.status === "active" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`Confirmez-vous la suspension du compte de ${vol.firstName} ${vol.lastName} ?`)) {
                                    setVolunteerStatus(vol.id, "suspended")
                                  }
                                }}
                                className="rounded-xl h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                                title="Suspendre le compte"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`Confirmez-vous la réactivation du compte de ${vol.firstName} ${vol.lastName} ?`)) {
                                    setVolunteerStatus(vol.id, "active")
                                  }
                                }}
                                className="rounded-xl h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                                title="Réactiver le compte"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: FICHE BÉNÉVOLE COMPLÈTE */}
      {activeVolunteer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-3xl rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto space-y-6">
            <button
              type="button"
              onClick={() => setActiveVolunteerId(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-xl shadow-xs">
                  {activeVolunteer.firstName.charAt(0)}{activeVolunteer.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    {activeVolunteer.firstName} {activeVolunteer.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {activeVolunteer.volunteerCode}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Inscrit le {formatDate(activeVolunteer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    activeVolunteer.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {activeVolunteer.status}
                </span>
              </div>
            </div>

            {/* Coordinates & Competencies */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2 text-xs">
                <p className="font-bold text-foreground text-sm mb-1">Informations de contact</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">E-mail :</span> {activeVolunteer.email}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">Téléphone :</span> {activeVolunteer.phone}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">Localisation :</span> {activeVolunteer.commune}, Wilaya {padWilayaCode(activeVolunteer.wilayaCode)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2 text-xs">
                <p className="font-bold text-foreground text-sm mb-1">Compétences déclarées</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activeVolunteer.skills || []).length > 0 ? (
                    activeVolunteer.skills?.map((sk) => (
                      <span key={sk} className="rounded-full bg-white border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">Aucune compétence spécifiée</span>
                  )}
                </div>
              </div>
            </div>

            {/* Official Badge Card Preview */}
            <div>
              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-700" />
                Badge Numérique Sécurisé
              </p>
              <VolunteerBadgeCard volunteer={activeVolunteer} />
            </div>

            {/* SOS Missions History */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Missions & Interventions de terrain ({activeVolMissions.length})
              </p>
              {activeVolMissions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic rounded-2xl border border-dashed p-4 text-center">
                  Aucune mission SOS enregistrée pour ce bénévole.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeVolMissions.map((app) => (
                    <div key={app.id} className="rounded-2xl border border-border/70 p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{app.reference} • {app.applicationType === "professional" ? "Expertise Professionnelle" : "Mobilisation Citoyenne"}</p>
                        <p className="text-muted-foreground">{app.commune} • Statut : <strong className="capitalize">{app.status}</strong></p>
                      </div>
                      <div className="text-end">
                        {app.pointsAwarded ? (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            +{app.pointsAwarded} pts
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Points en attente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points Audit Trail */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Traçabilité & Historique des transactions ({activeVolTransactions.length})
              </p>
              <div className="rounded-2xl border border-border/70 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 text-start">Date</th>
                        <th className="py-2.5 px-3 text-start">Motif / Justification</th>
                        <th className="py-2.5 px-3 text-center">Variation</th>
                        <th className="py-2.5 px-3 text-end">Nouveau Solde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {activeVolTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                            Aucune transaction dans le journal d'audit.
                          </td>
                        </tr>
                      ) : (
                        activeVolTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/10">
                            <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                              {formatDateTime(tx.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {tx.reason}
                              {tx.adminNote && (
                                <span className="block text-[10px] text-muted-foreground italic">
                                  Note: {tx.adminNote}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              <span className={tx.amount >= 0 ? "text-emerald-700" : "text-rose-700"}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-end font-mono font-bold text-foreground">
                              {tx.balanceAfter} pts
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setActiveVolunteerId(null)} className="rounded-2xl px-6">
                Fermer la fiche
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AJUSTEMENT MANUEL DES POINTS */}
      {adjustTargetVol && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7">
            <button
              type="button"
              onClick={() => setAdjustTargetVol(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Ajustement de Points
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {adjustTargetVol.firstName} {adjustTargetVol.lastName} ({adjustTargetVol.volunteerCode})
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-3 text-xs flex justify-between items-center">
                <span className="text-muted-foreground">Solde actuel :</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {adjustTargetVol.points} points
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Variation de points (+ ou -) <span className="text-rose-600">*</span>
                </label>
                <Input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="Ex: +50 ou -20"
                  required
                  className="rounded-2xl mt-1 h-11 font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Utilisez un signe négatif pour retirer des points en cas de régularisation.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Motif / Justification obligatoire <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ex: Prime spéciale coordination convoi Béjaïa-Akbou suite validation commission..."
                  rows={3}
                  required
                  className="w-full mt-1 rounded-2xl border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {adjustError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              {adjustSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{adjustSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustTargetVol(null)}
                  className="flex-1 rounded-2xl h-11"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Valider l'ajustement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
