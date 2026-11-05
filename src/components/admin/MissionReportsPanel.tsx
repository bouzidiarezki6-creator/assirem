import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useGovernance } from "@/context/GovernanceContext"
import type { MissionReport } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function MissionReportsPanel() {
  const { formatDate } = useI18n()
  const { currentUser } = useGovernance()
  const {
    data,
    submitMissionReport,
    reviewMissionReport,
  } = useAppData()

  const [filterWilaya, setFilterWilaya] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Submit report modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [selectedMissionId, setSelectedMissionId] = useState("")
  const [reportTitle, setReportTitle] = useState("")
  const [attendeesCount, setAttendeesCount] = useState("10")
  const [hoursCompleted, setHoursCompleted] = useState("4")
  const [reportSummary, setReportSummary] = useState("")
  const [achievementsText, setAchievementsText] = useState("")
  const [challengesText, setChallengesText] = useState("")

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<MissionReport | null>(null)
  const [reviewDecision, setReviewDecision] = useState<"validated" | "rejected">("validated")
  const [reviewNote, setReviewNote] = useState("")

  const canSubmit =
    currentUser?.role === "mission_lead" ||
    currentUser?.role === "wilaya_admin" ||
    currentUser?.role === "national_admin"

  const canReview =
    currentUser?.role === "national_auditor" ||
    currentUser?.role === "national_admin" ||
    currentUser?.role === "wilaya_admin"

  // Available missions to report on
  const availableMissions = useMemo(() => {
    return (data.events || []).map((e) => ({
      id: e.id,
      title: e.title,
      type: "event" as const,
      wilayaCode: e.wilayaCode || 6,
      commune: e.commune || "Béjaïa",
      date: e.date || new Date().toISOString().slice(0, 10),
    }))
  }, [data.events])

  // Filtered reports
  const filteredReports = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return (data.missionReports || [])
      .filter((r) => {
        if (filterWilaya !== "all" && String(r.wilayaCode) !== filterWilaya) return false
        if (filterStatus !== "all" && r.status !== filterStatus) return false
        if (needle && !r.title.toLowerCase().includes(needle) && !r.summary.toLowerCase().includes(needle)) {
          return false
        }
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.missionReports, filterWilaya, filterStatus, searchQuery])

  // Handle submit new report
  const handleSubmitReport = () => {
    if (!currentUser) return

    if (!reportTitle.trim()) {
      setMessage({ type: "err", text: "L'intitulé du rapport est obligatoire." })
      return
    }

    if (!reportSummary.trim() || reportSummary.trim().length < 10) {
      setMessage({ type: "err", text: "Le résumé de la mission doit comporter au moins 10 caractères." })
      return
    }

    const mission = availableMissions.find((m) => m.id === selectedMissionId) || availableMissions[0]

    const achievements = achievementsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    const res = submitMissionReport({
      missionId: mission ? mission.id : "demo-evt-01",
      missionType: "event",
      title: reportTitle.trim(),
      wilayaCode: mission ? mission.wilayaCode : 6,
      commune: mission ? mission.commune : "Béjaïa",
      missionDate: mission ? mission.date : new Date().toISOString().slice(0, 10),
      attendeesCount: Number(attendeesCount) || 1,
      hoursCompleted: Number(hoursCompleted) || 1,
      summary: reportSummary.trim(),
      achievements: achievements.length > 0 ? achievements : ["Mission accomplie selon les objectifs fixés"],
      challengesFaced: challengesText.trim() || undefined,
      author: currentUser,
    })

    if (res.error) {
      setMessage({ type: "err", text: res.error })
    } else {
      setMessage({
        type: "ok",
        text: "Rapport de mission soumis avec succès. Il a été transmis pour audit et validation.",
      })
      setSubmitModalOpen(false)
      setReportTitle("")
      setReportSummary("")
      setAchievementsText("")
      setChallengesText("")
    }
  }

  // Handle review report
  const handleReviewReport = () => {
    if (!selectedReport || !currentUser) return

    if (reviewDecision === "rejected" && (!reviewNote.trim() || reviewNote.trim().length < 5)) {
      setMessage({
        type: "err",
        text: "Un motif explicite (minimum 5 caractères) est obligatoire pour rejeter un rapport.",
      })
      return
    }

    const res = reviewMissionReport({
      reportId: selectedReport.id,
      decision: reviewDecision,
      reviewNote: reviewNote.trim() || "Rapport validé conforme aux exigences du programme.",
      reviewer: currentUser,
    })

    if (!res.success) {
      setMessage({ type: "err", text: res.error || "Erreur lors de l'audit du rapport." })
    } else {
      if (reviewDecision === "validated") {
        setMessage({
          type: "ok",
          text: `Rapport validé avec succès ! ${res.pointsAwardedCount} attributions de points ont été créditées aux participants (+15 pts rapporteur, +30 pts bénévoles).`,
        })
      } else {
        setMessage({
          type: "ok",
          text: "Rapport rejeté avec notification transmise au responsable.",
        })
      }
      setReviewModalOpen(false)
      setSelectedReport(null)
      setReviewNote("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Rapports de Mission & Circuit d'Audit
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Validation des rapports par l'audit, déclenchement automatisé des points (+15 pts et +30 pts) et vérification des paliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canSubmit && (
            <Button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground rounded-xl"
            >
              <PlusCircle className="h-4 w-4" />
              Soumettre un rapport
            </Button>
          )}
        </div>
      </div>

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
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <p className="flex-1">{message.text}</p>
          <button type="button" onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre ou contenu..."
            className="ps-9 h-10 rounded-xl text-xs bg-card border-border/70 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterWilaya}
            onChange={(e) => setFilterWilaya(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card text-foreground px-3 text-xs font-semibold focus-visible:outline-none"
          >
            <option value="all">Toutes les wilayas</option>
            <option value="6">06 - Béjaïa</option>
            <option value="19">19 - Sétif & El Eulma</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card text-foreground px-3 text-xs font-semibold focus-visible:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="submitted">En attente d'audit</option>
            <option value="validated">Validés & Récompensés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          return (
            <Card key={report.id} className="border-border/60 bg-card shadow-soft flex flex-col justify-between">
              <CardHeader className="pb-2 border-b border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border",
                      report.status === "validated"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : report.status === "rejected"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    )}
                  >
                    {report.status === "validated"
                      ? "Validé & Récompensé"
                      : report.status === "rejected"
                      ? "Rejeté"
                      : "En attente d'audit"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatDate(report.missionDate)}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-foreground mt-2 leading-snug">
                  {report.title}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  {report.commune} ({report.wilayaCode === 6 ? "Béjaïa" : "Sétif"}) · Par {report.authorName} ({report.authorRole})
                </p>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-muted-foreground leading-relaxed">
                    {report.summary}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] font-semibold text-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {report.attendeesCount} participants
                    </span>
                    <span>·</span>
                    <span>{report.hoursCompleted}h d'intervention</span>
                  </div>

                  {report.achievements && report.achievements.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Résultats vérifiés :
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                        {report.achievements.slice(0, 2).map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.reviewNote && (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] space-y-0.5">
                      <span className="font-bold text-foreground block">
                        Avis d'audit ({report.reviewedByName}) :
                      </span>
                      <span className="text-muted-foreground italic">
                        {report.reviewNote}
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit Action Button */}
                {canReview && report.status === "submitted" && (
                  <div className="pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report)
                        setReviewModalOpen(true)
                      }}
                      className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-9 gap-1.5 shadow-soft"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Auditer & Délibérer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredReports.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center text-xs text-muted-foreground">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            Aucun rapport de mission ne correspond aux critères.
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                Soumettre un rapport de mission officiel
              </h3>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Mission concernée</label>
                <select
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-card text-foreground px-3 text-xs font-semibold focus-visible:outline-none"
                >
                  {availableMissions.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.wilayaCode === 6 ? "Béjaïa" : "Sétif"}] {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Intitulé du rapport</label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Ex : Rapport d'intervention : Dépollution Cap Carbon"
                  className="h-10 rounded-xl text-xs bg-card border-input text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Nombre de bénévoles présents</label>
                  <Input
                    type="number"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(e.target.value)}
                    className="h-10 rounded-xl text-xs bg-card border-input text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Durée effective (heures)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={hoursCompleted}
                    onChange={(e) => setHoursCompleted(e.target.value)}
                    className="h-10 rounded-xl text-xs bg-card border-input text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Résumé exécutif des actions</label>
                <textarea
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  rows={3}
                  placeholder="Décrivez les opérations menées sur le terrain..."
                  className="w-full rounded-xl border border-input bg-card text-foreground p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Objectifs atteints (1 par ligne)</label>
                <textarea
                  value={achievementsText}
                  onChange={(e) => setAchievementsText(e.target.value)}
                  rows={2}
                  placeholder="Ex : 320 sacs collectés&#10;Zone entièrement sécurisée"
                  className="w-full rounded-xl border border-input bg-card text-foreground p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSubmitModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitReport}
                className="rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Transmettre pour audit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Audit & Délibération du rapport
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
                <span className="font-bold text-foreground block">{selectedReport.title}</span>
                <span className="text-muted-foreground block">
                  Soumis par {selectedReport.authorName} · {selectedReport.attendeesCount} bénévoles
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Décision de l'auditeur</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("validated")}
                    className={cn(
                      "py-2 px-3 rounded-xl font-bold border transition-all text-center",
                      reviewDecision === "validated"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                        : "bg-card border-border/70 text-muted-foreground"
                    )}
                  >
                    Valider (+15 / +30 pts)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("rejected")}
                    className={cn(
                      "py-2 px-3 rounded-xl font-bold border transition-all text-center",
                      reviewDecision === "rejected"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500"
                        : "bg-card border-border/70 text-muted-foreground"
                    )}
                  >
                    Rejeter le rapport
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  Motif d'audit ou avis officiel
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder="Précisez les conclusions de l'audit..."
                  className="w-full rounded-xl border border-input bg-card text-foreground p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleReviewReport}
                className={cn(
                  "rounded-xl text-xs font-bold text-white",
                  reviewDecision === "validated" ? "bg-primary" : "bg-rose-600"
                )}
              >
                Confirmer la décision
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
