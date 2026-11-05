import { useState, useMemo } from "react"
import {
  Award,
  Clock,
  MoreVertical,
  Phone,
  QrCode,
  Search,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { getProfessionMeta } from "@/lib/sos"
import type { SosApplication, SosApplicationStatus } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

export default function SosApplicationsAdminSection() {
  const { t, formatDateTime } = useI18n()
  const {
    data,
    acceptSosApplication,
    rejectSosApplication,
    waitlistSosApplication,
    cancelSosApplicationAcceptance,
    recordSosAttendance,
  } = useAppData()

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCall, setFilterCall] = useState<string>("all")
  const [actionMessage, setActionMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const applications = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data.sosApplications || []).filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false
      if (filterCall !== "all" && a.callId !== filterCall) return false
      if (!needle) return true
      return [
        a.fullName,
        a.phone,
        a.reference,
        a.nationalId || "",
        a.commune,
        a.customProfession || "",
        String(a.wilayaCode),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [data.sosApplications, filterStatus, filterCall, search])

  const callsMap = useMemo(() => {
    const map = new Map<string, string>()
    ;(data.sosCalls || []).forEach((c) => map.set(c.id, c.title))
    return map
  }, [data.sosCalls])

  const handleAccept = (app: SosApplication) => {
    setActionMessage(null)
    setActiveMenuId(null)
    const res = acceptSosApplication(app.id)
    if (!res.ok) {
      setActionMessage({ text: t(res.error), error: true })
      return
    }
    setActionMessage({ text: `Candidature de ${app.fullName} acceptée avec succès.` })
  }

  const handleReject = (app: SosApplication) => {
    setActionMessage(null)
    setActiveMenuId(null)
    const res = rejectSosApplication(app.id)
    if (!res.ok) {
      setActionMessage({ text: t(res.error), error: true })
      return
    }
    setActionMessage({ text: `Candidature de ${app.fullName} refusée.` })
  }

  const handleWaitlist = (app: SosApplication) => {
    setActionMessage(null)
    setActiveMenuId(null)
    const res = waitlistSosApplication(app.id)
    if (!res.ok) {
      setActionMessage({ text: t(res.error), error: true })
      return
    }
    setActionMessage({ text: `Candidature de ${app.fullName} placée en liste d'attente.` })
  }

  const handleCancelAcceptance = (app: SosApplication) => {
    setActionMessage(null)
    setActiveMenuId(null)
    const reason = prompt("Indiquez le motif d'annulation de l'acceptation :")
    if (reason == null) return
    const res = cancelSosApplicationAcceptance(app.id, reason)
    if (!res.ok) {
      setActionMessage({ text: t(res.error), error: true })
      return
    }
    setActionMessage({ text: `Acceptation annulée. Une place a été automatiquement libérée.` })
  }

  const handleCheckIn = (app: SosApplication) => {
    setActionMessage(null)
    setActiveMenuId(null)
    const res = recordSosAttendance({
      applicationId: app.id,
      type: "check_in",
    })
    if (!res.ok) {
      setActionMessage({ text: t(res.error), error: true })
      return
    }
    setActionMessage({ text: `Pointage arrivée enregistré pour ${app.fullName}.` })
  }

  const handleCheckOut = (app: SosApplication) => {
    setActionMessage(null)
    setActiveMenuId(null)
    const res = recordSosAttendance({
      applicationId: app.id,
      type: "check_out",
    })
    if (!res.ok) {
      setActionMessage({ text: t(res.error), error: true })
      return
    }
    setActionMessage({
      text: `Pointage départ validé pour ${app.fullName}. Points d'engagement attribués.`,
    })
  }

  const statusBadges: Record<SosApplicationStatus, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    accepted: { label: "Acceptée", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    rejected: { label: "Refusée", color: "bg-rose-50 text-rose-700 border border-rose-200" },
    waitlist: { label: "Liste d'attente", color: "bg-amber-50 text-amber-700 border border-amber-200" },
    cancelled: { label: "Annulée", color: "bg-muted text-muted-foreground border border-border/60" },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">
            {t("admin.sosCrm.tabs.applications")} ({applications.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Traitement des candidatures, sélection rigoureuse, liste d'attente et pointage d'arrivée/départ.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={cn(
            "rounded-2xl p-3.5 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in",
            actionMessage.error
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          )}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline ps-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, NIN, commune, référence..."
            className="h-11 rounded-2xl ps-10 text-xs shadow-sm bg-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 rounded-2xl border border-input bg-white px-3 text-xs font-semibold shadow-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente uniquement</option>
          <option value="accepted">Acceptées uniquement</option>
          <option value="waitlist">Liste d'attente uniquement</option>
          <option value="rejected">Refusées</option>
        </select>

        <select
          value={filterCall}
          onChange={(e) => setFilterCall(e.target.value)}
          className="h-11 rounded-2xl border border-input bg-white px-3 text-xs font-semibold shadow-sm max-w-xs"
        >
          <option value="all">Toutes les missions</option>
          {(data.sosCalls || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Applications Table with Contextual Menu */}
      <div className="overflow-x-auto rounded-3xl border border-border/70 bg-white shadow-soft">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4 text-start">Réf & Candidat</th>
              <th className="p-4 text-start">Mission</th>
              <th className="p-4 text-start">Profil & Expérience</th>
              <th className="p-4 text-start">Statut</th>
              <th className="p-4 text-start">Pointage Terrain</th>
              <th className="p-4 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {applications.map((app) => {
              const prof = getProfessionMeta(app.professionId)
              const badge = statusBadges[app.status] || statusBadges.pending
              const callTitle = callsMap.get(app.callId) || "Mission"
              const isMenuOpen = activeMenuId === app.id

              return (
                <tr key={app.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {app.reference}
                    </span>
                    <strong className="text-foreground text-xs sm:text-sm font-bold block">{app.fullName}</strong>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <a
                        href={`tel:${app.phone}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <Phone className="h-3 w-3" />
                        {app.phone}
                      </a>
                      {app.nationalId && (
                        <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded">
                          NIN: {app.nationalId.slice(0, 4)}...{app.nationalId.slice(-4)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 max-w-[200px]">
                    <span className="font-semibold text-foreground block line-clamp-1">
                      {callTitle}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {app.commune} (Wilaya {padWilayaCode(app.wilayaCode)})
                    </span>
                  </td>

                  <td className="p-4 max-w-[220px]">
                    <span className="font-semibold text-foreground block">
                      {app.customProfession || (prof ? t(prof.labelKey) : app.applicationType)}
                    </span>
                    {app.experienceYears != null && app.experienceYears > 0 && (
                      <span className="text-[10px] text-muted-foreground block">
                        Expérience : {app.experienceYears} an(s)
                      </span>
                    )}
                    {app.hasTransport && (
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        Véhiculé
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", badge.color)}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      {formatDateTime(app.createdAt)}
                    </span>
                  </td>

                  <td className="p-4 min-w-[140px]">
                    {app.status === "accepted" ? (
                      <div>
                        {!app.checkInAt ? (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(app)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-xl"
                          >
                            <QrCode className="h-3 w-3" />
                            Pointer Arrivée
                          </button>
                        ) : !app.checkOutAt ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              Arrivé : {app.checkInAt.slice(11, 16)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCheckOut(app)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-0.5 rounded-xl shadow-sm"
                            >
                              <Award className="h-3 w-3" />
                              Pointer Départ
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">
                            <span className="text-emerald-700 font-bold block">
                              Validé ({app.pointsAwarded || 28} pts)
                            </span>
                            <span>Départ {app.checkOutAt.slice(11, 16)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        —
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-end relative">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* One quick direct action for pending */}
                      {app.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleAccept(app)}
                          className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-sm"
                        >
                          Accepter
                        </button>
                      )}

                      {/* Contextual Action Menu Button */}
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(isMenuOpen ? null : app.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Contextual Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-4 top-12 z-20 w-48 rounded-2xl border border-border/80 bg-white p-1.5 shadow-xl animate-fade-in text-start">
                        {app.status !== "accepted" && (
                          <button
                            type="button"
                            onClick={() => handleAccept(app)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Accepter la candidature
                          </button>
                        )}

                        {app.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleWaitlist(app)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Mettre en liste d'attente
                          </button>
                        )}

                        {app.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => handleCancelAcceptance(app)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Annuler l'acceptation
                          </button>
                        )}

                        {app.status === "accepted" && !app.checkInAt && (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(app)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                          >
                            <QrCode className="h-3.5 w-3.5 text-primary" />
                            Pointer Arrivée
                          </button>
                        )}

                        {app.status === "accepted" && app.checkInAt && !app.checkOutAt && (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(app)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <Award className="h-3.5 w-3.5" />
                            Pointer Départ & Attribuer points
                          </button>
                        )}

                        <div className="my-1 border-t border-border/40" />

                        {app.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleReject(app)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Refuser la candidature
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Aucune candidature trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
