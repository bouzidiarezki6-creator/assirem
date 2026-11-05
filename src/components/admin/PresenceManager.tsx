import { useMemo, useState } from "react"
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  QrCode,
  Scan,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useGovernance } from "@/context/GovernanceContext"
import { cn } from "@/lib/utils"

export default function PresenceManager() {
  const { formatDate } = useI18n()
  const { currentUser } = useGovernance()
  const {
    data,
    recordPresenceCheckIn,
    recordPresenceCheckOut,
    recordManualPresence,
  } = useAppData()

  const [searchCode, setSearchCode] = useState("")
  const [selectedMissionId, setSelectedMissionId] = useState("")
  const [filterWilaya, setFilterWilaya] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Manual fallback modal
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualVolunteerId, setManualVolunteerId] = useState("")
  const [manualReason, setManualReason] = useState("")

  const isAuditor = currentUser?.role === "national_auditor"

  // Combined available missions list from events and activities
  const availableMissions = useMemo(() => {
    const list: {
      id: string
      type: "event" | "activity"
      title: string
      wilayaCode: number
      commune: string
    }[] = []

    ;(data.events || []).forEach((e) => {
      list.push({
        id: e.id,
        type: "event",
        title: e.title,
        wilayaCode: e.wilayaCode || 6,
        commune: e.commune || "Béjaïa",
      })
    })

    ;(data.activities || []).forEach((a) => {
      list.push({
        id: a.id,
        type: "activity",
        title: a.title,
        wilayaCode: a.wilayaCode || 19,
        commune: a.commune || "Sétif",
      })
    })

    return list
  }, [data.events, data.activities])

  // Select default mission if none selected
  const activeMission = useMemo(() => {
    if (!selectedMissionId && availableMissions.length > 0) {
      return availableMissions[0]
    }
    return availableMissions.find((m) => m.id === selectedMissionId) || availableMissions[0]
  }, [selectedMissionId, availableMissions])

  // Filtered presence records
  const presenceRecords = useMemo(() => {
    return (data.presenceRecords || [])
      .filter((r) => {
        if (filterWilaya !== "all" && String(r.wilayaCode) !== filterWilaya) return false
        if (filterStatus !== "all" && r.status !== filterStatus) return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.presenceRecords, filterWilaya, filterStatus])

  // Handle fast check-in by code / QR
  const handleCheckIn = () => {
    if (isAuditor) {
      setMessage({
        type: "err",
        text: "Accès refusé : l'auditeur national est en lecture seule stricte.",
      })
      return
    }

    if (!searchCode.trim()) {
      setMessage({ type: "err", text: "Veuillez saisir un code bénévole, QR ou NIN." })
      return
    }

    if (!activeMission) {
      setMessage({ type: "err", text: "Veuillez sélectionner une mission active." })
      return
    }

    const res = recordPresenceCheckIn({
      volunteerCodeOrId: searchCode.trim(),
      targetType: activeMission.type,
      targetId: activeMission.id,
      targetTitle: activeMission.title,
      wilayaCode: activeMission.wilayaCode,
      commune: activeMission.commune,
      scanner: currentUser
        ? {
            id: currentUser.id,
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            role: currentUser.role,
            wilayaCode: currentUser.wilayaCode,
          }
        : undefined,
    })

    if (!res.success) {
      setMessage({ type: "err", text: res.error || "Erreur lors du pointage." })
    } else if (res.alreadyCheckedIn) {
      setMessage({
        type: "err",
        text: `Bénévole déjà pointé présent aujourd'hui (${res.record?.volunteerName}).`,
      })
    } else {
      setMessage({
        type: "ok",
        text: `Pointage confirmé pour ${res.record?.volunteerName} (+10 points crédités automatiquement).`,
      })
      setSearchCode("")
    }
  }

  // Handle check-out
  const handleCheckOut = (recordId: string) => {
    if (isAuditor) {
      setMessage({
        type: "err",
        text: "Accès refusé : l'auditeur national est en lecture seule.",
      })
      return
    }

    const res = recordPresenceCheckOut(recordId)
    if (!res.success) {
      setMessage({ type: "err", text: res.error || "Erreur de check-out." })
    } else {
      setMessage({
        type: "ok",
        text: `Départ enregistré avec succès. Durée comptabilisée : ${res.durationHours} heures.`,
      })
    }
  }

  // Handle manual validation
  const handleManualValidationSubmit = () => {
    if (isAuditor) {
      setMessage({
        type: "err",
        text: "Accès refusé : lecture seule pour l'auditeur national.",
      })
      return
    }

    if (!manualVolunteerId) {
      setMessage({ type: "err", text: "Veuillez choisir un bénévole." })
      return
    }

    if (!manualReason.trim() || manualReason.trim().length < 5) {
      setMessage({
        type: "err",
        text: "Un motif obligatoire d'au moins 5 caractères est exigé pour la validation manuelle.",
      })
      return
    }

    if (!activeMission || !currentUser) return

    const res = recordManualPresence({
      volunteerId: manualVolunteerId,
      targetType: activeMission.type,
      targetId: activeMission.id,
      targetTitle: activeMission.title,
      wilayaCode: activeMission.wilayaCode,
      commune: activeMission.commune,
      reason: manualReason.trim(),
      admin: currentUser,
    })

    if (!res.success) {
      setMessage({ type: "err", text: res.error || "Erreur de validation manuelle." })
    } else {
      setMessage({
        type: "ok",
        text: `Validation manuelle enregistrée avec succès pour ${res.record?.volunteerName} (+10 points).`,
      })
      setManualModalOpen(false)
      setManualReason("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Traçabilité & Pointage Terrain des Présences
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Validation des présences par QR Code, horodatage certifié, calcul de durée et attribution immédiate de 10 points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAuditor && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManualModalOpen(true)}
              className="text-xs font-bold gap-1.5 border-border/80"
            >
              <PlusCircle className="h-4 w-4 text-primary" />
              Validation manuelle de secours
            </Button>
          )}
        </div>
      </div>

      {isAuditor && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
          <p className="flex-1">
            Mode Consultation — <strong>Auditeur National</strong> : le pointage de présence est en lecture seule stricte pour préserver l'indépendance du contrôle.
          </p>
        </div>
      )}

      {message && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-semibold shadow-xs",
            message.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          )}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <p className="flex-1">{message.text}</p>
          <button type="button" onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left = Quick Scanner / Check-in Form, Right = Presence Records Log */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (5 cols): Pointage Scanner Box */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Scan className="h-4 w-4 text-primary" />
                <span>Pointage d'arrivée (Check-in)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Mission Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Mission en cours
                </label>
                <select
                  value={selectedMissionId || activeMission?.id}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-card text-foreground px-3 py-2 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {availableMissions.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.wilayaCode === 6 ? "Béjaïa" : "Sétif/El Eulma"}] {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code / QR Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Code Bénévole, QR ou NIN
                </label>
                <div className="relative">
                  <Input
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCheckIn()
                    }}
                    placeholder="Ex: YFY-VOL-20261105-06AM ou YFY-B3E1"
                    className="h-10 rounded-xl text-xs bg-card border-input text-foreground ps-3"
                    disabled={isAuditor}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Saisissez le code ou scannez le QR code généré dans l'espace personnel du bénévole.
                </p>
              </div>

              {/* Fast presets for demo testing */}
              <div className="pt-2 border-t border-border/50 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Comptes de démonstration rapides (1 clic) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(data.volunteerAccounts || []).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSearchCode(v.volunteerCode)}
                      className="inline-flex items-center gap-1 rounded-xl bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors border border-border/50"
                    >
                      <UserCheck className="h-3 w-3 text-primary" />
                      {v.firstName} ({v.commune})
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={isAuditor || !searchCode.trim()}
                  className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-10 gap-2 shadow-soft hover:bg-primary/90"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Valider le pointage (+10 pts)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Table of Presence Records */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <span>Fiches de présence certifiées ({presenceRecords.length})</span>
            </h3>

            <div className="flex items-center gap-2">
              {/* Wilaya Filter */}
              <select
                value={filterWilaya}
                onChange={(e) => setFilterWilaya(e.target.value)}
                className="h-8 rounded-xl border border-input bg-card text-foreground px-2.5 text-xs font-semibold focus-visible:outline-none"
              >
                <option value="all">Toutes les wilayas</option>
                <option value="6">06 - Béjaïa</option>
                <option value="19">19 - Sétif & El Eulma</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 rounded-xl border border-input bg-card text-foreground px-2.5 text-xs font-semibold focus-visible:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="checked_in">Sur le terrain (Check-in)</option>
                <option value="checked_out">Mission terminée (Check-out)</option>
                <option value="manual_validated">Validation manuelle</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-soft">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 text-start">Bénévole</th>
                  <th className="p-3 text-start">Mission & Lieu</th>
                  <th className="p-3 text-center">Horodatage</th>
                  <th className="p-3 text-center">Durée</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {presenceRecords.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <strong className="text-foreground text-xs block">
                          {r.volunteerName}
                        </strong>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {r.volunteerCode}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-xs text-foreground font-medium block">
                          {r.targetTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {r.commune} ({r.wilayaCode === 6 ? "06" : "19"})
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono text-[11px] text-muted-foreground">
                        <div>Arrivée : {formatDate(r.checkInAt)}</div>
                        {r.checkOutAt && (
                          <div className="text-[10px] text-muted-foreground">
                            Départ : {formatDate(r.checkOutAt)}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-foreground">
                        {r.durationHours ? `${r.durationHours}h` : "En cours"}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border",
                            r.status === "checked_out"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : r.status === "manual_validated"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          )}
                        >
                          {r.status === "checked_out"
                            ? "Terminé"
                            : r.status === "manual_validated"
                            ? "Manuel"
                            : "Présent"}
                        </span>
                      </td>

                      <td className="p-3 text-end">
                        {!isAuditor && !r.checkOutAt && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(r.id)}
                            className="h-7 rounded-lg text-[10px] font-bold border-border/80 text-foreground"
                          >
                            <Clock className="h-3 w-3 mr-1 text-primary" />
                            Départ
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {presenceRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Aucune fiche de présence ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Validation Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                Validation manuelle de présence
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Bénévole</label>
                <select
                  value={manualVolunteerId}
                  onChange={(e) => setManualVolunteerId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-card text-foreground px-3 text-xs font-semibold focus-visible:outline-none"
                >
                  <option value="">Sélectionner un bénévole...</option>
                  {(data.volunteerAccounts || []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.firstName} {v.lastName} ({v.commune} - {v.volunteerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Mission concernée</label>
                <p className="text-xs text-primary font-bold">{activeMission?.title}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Motif obligatoire de la dérogation manuelle
                </label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  rows={3}
                  placeholder="Ex : Smartphone du bénévole déchargé, présence constatée à l'accueil matériel..."
                  className="w-full rounded-xl border border-input bg-card text-foreground p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManualModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleManualValidationSubmit}
                className="rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Confirmer la validation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
