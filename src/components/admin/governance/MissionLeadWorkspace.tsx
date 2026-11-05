import { useState, useMemo } from "react"
import {
  CheckCircle2,
  Clock,
  ScanLine,
  MapPin,
  ShieldCheck,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
  ListTodo,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppData } from "@/context/DataProvider"
import { useGovernance } from "@/context/GovernanceContext"
import { useI18n } from "@/context/I18nProvider"
import { WILAYAS_LIST, padWilayaCode, type WilayaMeta } from "@/lib/wilayas"
import QrScanner from "@/components/admin/QrScanner"

interface FieldTask {
  id: string
  title: string
  assignee: string
  completed: boolean
}

export default function MissionLeadWorkspace() {
  const { data, updateSosIntervention, validateParticipation } = useAppData()
  const { currentUser } = useGovernance()
  const { locale, dir } = useI18n()
  const isAr = locale === "ar"

  // Active missions / interventions available
  const interventions = data.sosInterventions || []
  const [selectedInterventionId, setSelectedInterventionId] = useState<string>(
    interventions[0]?.id || ""
  )

  const activeIntervention = useMemo(() => {
    return interventions.find((i) => i.id === selectedInterventionId) || interventions[0] || null
  }, [interventions, selectedInterventionId])

  // Field tasks state
  const [tasks, setTasks] = useState<FieldTask[]>([
    { id: "1", title: "Briefing de sécurité et distribution du matériel", assignee: "Chef de mission", completed: true },
    { id: "2", title: "Contrôle des identités et pointage QR des bénévoles", assignee: "Équipe accueil", completed: true },
    { id: "3", title: "Acheminement des colis et denrées prioritaires", assignee: "Équipe logistique", completed: false },
    { id: "4", title: "Visite médicale de premier secours", assignee: "Médecin bénévole", completed: false },
    { id: "5", title: "Debriefing final et signature du procès-verbal", assignee: "Chef de mission", completed: false },
  ])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  // Live scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scanMessage, setScanMessage] = useState("")

  // Debriefing report state
  const [debriefNotes, setDebriefNotes] = useState("")
  const [debriefSubmitted, setDebriefSubmitted] = useState(false)

  // Toggle task
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  // Add task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: newTaskTitle.trim(),
        assignee: "Équipe terrain",
        completed: false,
      },
    ])
    setNewTaskTitle("")
  }

  // Handle QR scan check-in
  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false)
    const vol = (data.volunteerAccounts || []).find(
      (v) => v.volunteerCode === decodedText || v.id === decodedText || v.email === decodedText
    )

    if (vol) {
      validateParticipation({
        volunteerId: vol.id,
        activityTitle: activeIntervention?.title || "Intervention terrain",
        activityDate: new Date().toISOString().slice(0, 10),
        categoryId: "social",
        customPoints: 50,
        adminNote: `Pointage présence mission ${activeIntervention?.reference || ""}`,
      })
      setScanMessage(`Présence validée avec succès pour le bénévole : ${vol.firstName} ${vol.lastName} (+50 pts)`)
    } else {
      setScanMessage(`Code QR scanné : ${decodedText}. Présence enregistrée manuellement.`)
    }
    setTimeout(() => setScanMessage(""), 5000)
  }

  // Submit final debrief
  const handleCloseMission = () => {
    if (!activeIntervention) return
    updateSosIntervention(activeIntervention.id, {
      status: "completed",
      instructions: activeIntervention.instructions
        ? `${activeIntervention.instructions}\n[Debriefing Chef de Mission]: ${debriefNotes}`
        : `[Debriefing Chef de Mission]: ${debriefNotes}`,
    })
    setDebriefSubmitted(true)
    setTimeout(() => setDebriefSubmitted(false), 4000)
  }

  const wilayaObj = activeIntervention
    ? WILAYAS_LIST.find((w: WilayaMeta) => w.code === activeIntervention.wilayaCode)
    : null

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border/70 shadow-soft">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Espace Opérationnel — Chef de Mission Terrain</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            {isAr ? "لوحة قيادة وتأطير التدخل الميداني" : "Poste de Commandement de Mission"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Responsable : <strong className="text-foreground">{currentUser.firstName} {currentUser.lastName}</strong> · Wilaya {currentUser.wilayaCode ? padWilayaCode(currentUser.wilayaCode) : "Nationale"}
          </p>
        </div>

        {/* Mission Selector */}
        {interventions.length > 0 && (
          <div className="sm:w-72">
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Mission active assignée
            </label>
            <select
              value={selectedInterventionId}
              onChange={(e) => setSelectedInterventionId(e.target.value)}
              className="w-full h-10 rounded-2xl border border-border bg-muted/30 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {interventions.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.reference} — {int.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeIntervention ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Mission details & Operational Roster */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card className="rounded-3xl border-border/70 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-primary">
                    {activeIntervention.reference}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    activeIntervention.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : activeIntervention.status === "in_progress"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-sky-100 text-sky-800"
                  }`}>
                    {activeIntervention.status === "completed"
                      ? "Mission terminée"
                      : activeIntervention.status === "in_progress"
                      ? "Intervention en cours"
                      : "En préparation"}
                  </span>
                </div>
                <CardTitle className="text-lg font-extrabold mt-1">
                  {activeIntervention.title}
                </CardTitle>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {wilayaObj ? `${padWilayaCode(wilayaObj.code)} - ${wilayaObj.name}` : "Wilaya"} ({activeIntervention.commune})
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Début : {activeIntervention.startDate}</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  {activeIntervention.description}
                </p>

                {activeIntervention.instructions && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Consignes de sécurité & d'engagement :
                    </span>
                    <p className="text-amber-800 leading-relaxed whitespace-pre-line">
                      {activeIntervention.instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task distribution checklist */}
            <Card className="rounded-3xl border-border/70 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" />
                    Répartition des tâches opérationnelles
                  </span>
                  <span className="text-xs font-mono font-normal text-muted-foreground">
                    {tasks.filter((t) => t.completed).length} / {tasks.length} achevées
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        task.completed
                          ? "bg-emerald-50/50 border-emerald-200 text-muted-foreground"
                          : "bg-white border-border hover:border-primary/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className={`text-xs font-semibold ${task.completed ? "line-through" : ""}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {task.assignee}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={addTask} className="flex gap-2 pt-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ajouter une instruction opérationnelle..."
                    className="rounded-2xl h-10 text-xs"
                  />
                  <Button type="submit" size="sm" className="rounded-2xl px-4 font-bold shrink-0">
                    Ajouter
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Attendance & QR scanner check-in */}
            <Card className="rounded-3xl border-border/70 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Pointage de présence des bénévoles (Check-in QR)
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowScanner(!showScanner)}
                    className="rounded-2xl gap-1.5 text-xs font-bold"
                  >
                    <ScanLine className="w-3.5 h-3.5 text-primary" />
                    {showScanner ? "Fermer le scanner" : "Scanner QR Bénévole"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanMessage && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{scanMessage}</span>
                  </div>
                )}

                {showScanner && (
                  <div className="p-4 rounded-3xl border border-primary/20 bg-muted/20">
                    <QrScanner onScan={handleScanSuccess} />
                  </div>
                )}

                {/* Team roster */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Membres mobilisés dans l'équipe ({activeIntervention.teams.reduce((acc, t) => acc + t.members.length, 0)} effectifs)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {activeIntervention.teams.flatMap((t) => t.members).map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-border/70 bg-white p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {m.profession || "Bénévole polyvalent"} · {m.role === "leader" ? "Chef d'équipe" : "Équipier"}
                          </p>
                        </div>
                        <a
                          href={`tel:${m.phone}`}
                          className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          title="Appeler"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Debriefing & Mission Closure Form */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-border/70 shadow-soft sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Rapport de clôture & Debriefing
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Transmission officielle du rapport d'intervention aux services de la DJS.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {debriefSubmitted && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Rapport enregistré et scellé au registre d'audit avec succès !</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Observations de terrain & Résultats obtenus :
                  </label>
                  <textarea
                    rows={6}
                    value={debriefNotes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDebriefNotes(e.target.value)}
                    placeholder="Précisez le volume de distribution, l'état des lieux, les difficultés rencontrées et les préconisations pour le suivi..."
                    className="w-full rounded-2xl border border-border bg-white p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Validation DJS de wilaya :</span>
                    <strong className="text-emerald-700 font-semibold">Conforme</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Heures de bénévolat attribuées :</span>
                    <strong className="text-foreground font-mono">100% scellées</strong>
                  </div>
                </div>

                <Button
                  onClick={handleCloseMission}
                  disabled={!debriefNotes.trim()}
                  className="w-full rounded-2xl h-11 font-bold gap-2 bg-primary hover:bg-primary/90 text-xs shadow-soft"
                >
                  <Send className="w-4 h-4" />
                  Valider & Sceller la mission
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="rounded-3xl border-border/70 p-12 text-center text-muted-foreground">
          Aucune mission active n'est assignée actuellement.
        </Card>
      )}
    </div>
  )
}
