import { useState, useMemo, type FormEvent } from "react"
import { Edit3, Plus, Search, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { parseGpsCoord } from "@/lib/sos"
import type { SosIntervention, SosInterventionStatus } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

export default function SosInterventionsAdminSection() {
  const { t, locale } = useI18n()
  const { wilayas, selectedCode } = useLocationFilter()
  const {
    data,
    addSosIntervention,
    updateSosIntervention,
    deleteSosIntervention,
    addTeamToIntervention,
  } = useAppData()

  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState("")

  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [callId, setCallId] = useState("")
  const [coordinatorName, setCoordinatorName] = useState("Yacine Mezdad")
  const [coordinatorPhone, setCoordinatorPhone] = useState("0770112233")
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [commune, setCommune] = useState("Akbou")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<SosInterventionStatus>("in_progress")
  const [instructions, setInstructions] = useState("")

  // Team modal state
  const [teamModalInterventionId, setTeamModalInterventionId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState("")
  const [teamLeaderName, setTeamLeaderName] = useState("")
  const [teamLeaderPhone, setTeamLeaderPhone] = useState("")
  const [teamMission, setTeamMission] = useState("")

  const interventions = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data.sosInterventions || []).filter((i) => {
      if (!needle) return true
      return [i.title, i.commune, i.coordinatorName, i.reference, String(i.wilayaCode)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [data.sosInterventions, search])

  const openNewForm = () => {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setCallId("")
    setCoordinatorName("Coordinateur Akbou")
    setCoordinatorPhone("0770112233")
    setWilayaCode(selectedCode ?? 6)
    setCommune("Akbou")
    setAddress("")
    setLat("")
    setLng("")
    setStartDate(new Date().toISOString().slice(0, 10))
    setEndDate("")
    setStatus("in_progress")
    setInstructions("")
    setFormError("")
    setShowForm(true)
  }

  const openEditForm = (i: SosIntervention) => {
    setEditingId(i.id)
    setTitle(i.title)
    setDescription(i.description || "")
    setCallId(i.callId || "")
    setCoordinatorName(i.coordinatorName)
    setCoordinatorPhone(i.coordinatorPhone || "")
    setWilayaCode(i.wilayaCode)
    setCommune(i.commune)
    setAddress(i.address || "")
    setLat(i.lat != null ? String(i.lat) : "")
    setLng(i.lng != null ? String(i.lng) : "")
    setStartDate(i.startDate)
    setEndDate(i.endDate || "")
    setStatus(i.status)
    setInstructions(i.instructions || "")
    setFormError("")
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError("")

    const latN = lat.trim() ? parseGpsCoord(lat) : undefined
    const lngN = lng.trim() ? parseGpsCoord(lng) : undefined

    if (editingId) {
      const res = updateSosIntervention(editingId, {
        title: title.trim(),
        description: description.trim(),
        callId: callId || undefined,
        coordinatorName: coordinatorName.trim(),
        coordinatorPhone: coordinatorPhone.trim() || undefined,
        wilayaCode,
        commune: commune.trim(),
        address: address.trim() || undefined,
        lat: latN ?? undefined,
        lng: lngN ?? undefined,
        startDate,
        endDate: endDate || undefined,
        status,
        instructions: instructions.trim() || undefined,
      })
      if ("error" in res) {
        setFormError(t(res.error))
        return
      }
    } else {
      const res = addSosIntervention({
        title: title.trim(),
        description: description.trim(),
        callId: callId || undefined,
        coordinatorName: coordinatorName.trim(),
        coordinatorPhone: coordinatorPhone.trim() || undefined,
        wilayaCode,
        commune: commune.trim(),
        address: address.trim() || undefined,
        lat: latN ?? undefined,
        lng: lngN ?? undefined,
        startDate,
        endDate: endDate || undefined,
        status,
        instructions: instructions.trim() || undefined,
        teams: [],
      })
      if ("error" in res) {
        setFormError(t(res.error))
        return
      }
    }

    setShowForm(false)
    setEditingId(null)
  }

  const handleAddTeamSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!teamModalInterventionId) return

    addTeamToIntervention(teamModalInterventionId, {
      name: teamName.trim(),
      leaderName: teamLeaderName.trim(),
      leaderPhone: teamLeaderPhone.trim(),
      mission: teamMission.trim(),
      members: [],
    })

    setTeamModalInterventionId(null)
    setTeamName("")
    setTeamLeaderName("")
    setTeamLeaderPhone("")
    setTeamMission("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">
            {t("admin.sosCrm.tabs.interventions")} ({interventions.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Planification des missions, constitution des équipes et suivi de l'avancement.
          </p>
        </div>

        <Button
          type="button"
          onClick={showForm ? () => setShowForm(false) : openNewForm}
          className="rounded-2xl gap-2"
        >
          <Plus className="h-4 w-4" />
          {showForm ? t("common.cancel") : t("admin.sosCrm.actions.addIntervention")}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border/80 bg-white p-6 shadow-soft animate-fade-in"
        >
          <h3 className="text-base font-extrabold text-foreground">
            {editingId ? "Modifier l'intervention" : t("admin.sosCrm.actions.addIntervention")}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Titre de l'intervention *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Intervention Logistique Soummam : Hub de tri et acheminement"
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Statut d'avancement *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SosInterventionStatus)}
                className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="preparation">En préparation</option>
                <option value="in_progress">En cours d'intervention</option>
                <option value="suspended">Suspendue</option>
                <option value="completed">Mission achevée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Liée à un appel (facultatif)</label>
              <select
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="">Aucun appel lié</option>
                {(data.sosCalls || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Coordinateur en chef *</label>
              <Input
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                placeholder="Nom du responsable"
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Téléphone coordinateur</label>
              <Input
                value={coordinatorPhone}
                onChange={(e) => setCoordinatorPhone(e.target.value)}
                placeholder="0770..."
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Wilaya *</label>
              <select
                value={wilayaCode}
                onChange={(e) => setWilayaCode(Number(e.target.value))}
                className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
              >
                {wilayas.map((w) => (
                  <option key={w.code} value={w.code}>
                    {padWilayaCode(w.code)} — {locale === "ar" ? w.name_ar : w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Commune *</label>
              <Input
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Akbou..."
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Adresse exacte / Lieu de ralliement</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Z.I. Akbou Hangar 4..."
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Date de début *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Date de fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Consignes et instructions de sécurité</label>
              <Input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Port du gilet obligatoire, point de rassemblement à 08h30..."
                className="rounded-2xl mt-1 h-11"
              />
            </div>
          </div>

          {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="rounded-2xl"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="rounded-2xl">
              {editingId ? t("common.save") : "Créer l'intervention"}
            </Button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre, commune, coordinateur..."
          className="h-11 rounded-2xl ps-11 text-xs sm:text-sm"
        />
      </div>

      {/* Interventions Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {interventions.map((interv) => {
          const teams = interv.teams || []
          return (
            <div
              key={interv.id}
              className="rounded-3xl border border-border/80 bg-white p-5 shadow-soft space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground block">
                    {interv.reference}
                  </span>
                  <h3 className="text-base font-extrabold text-foreground">{interv.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {interv.commune} · Wilaya {padWilayaCode(interv.wilayaCode)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                    interv.status === "in_progress" && "bg-emerald-100 text-emerald-800",
                    interv.status === "preparation" && "bg-amber-100 text-amber-800",
                    interv.status === "completed" && "bg-blue-100 text-blue-800"
                  )}
                >
                  {t(`sos.interventions.status.${interv.status}`)}
                </span>
              </div>

              {interv.instructions && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                  {interv.instructions}
                </p>
              )}

              {/* Teams breakdown */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    Équipes affectées ({teams.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setTeamModalInterventionId(interv.id)}
                    className="h-7 text-[11px] gap-1 text-primary rounded-xl"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter équipe
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {teams.map((tm) => (
                    <div
                      key={tm.id}
                      className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-foreground">{tm.name}</strong>
                        <span className="text-[10px] text-muted-foreground">
                          {tm.members?.length || 0} membre(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Responsable : {tm.leaderName} ({tm.leaderPhone})
                      </p>
                      <p className="text-[11px] text-muted-foreground italic">
                        Mission : {tm.mission}
                      </p>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Aucune équipe constituée pour l'instant.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                <span className="text-muted-foreground">
                  Coord : {interv.coordinatorName} ({interv.coordinatorPhone})
                </span>
                <div className="space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditForm(interv)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Supprimer l'intervention "${interv.title}" ?`)) {
                        deleteSosIntervention(interv.id)
                      }
                    }}
                    className="h-8 w-8 p-0 text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal to add a team to an intervention */}
      {teamModalInterventionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 shadow-card">
            <h3 className="text-base font-extrabold text-foreground mb-4">
              Créer une équipe d'intervention
            </h3>
            <form onSubmit={handleAddTeamSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Nom de l'équipe *</label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Équipe Déblaiement & Dégagement"
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Chef d'équipe *</label>
                <Input
                  value={teamLeaderName}
                  onChange={(e) => setTeamLeaderName(e.target.value)}
                  placeholder="Nom du responsable"
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Téléphone chef d'équipe *</label>
                <Input
                  value={teamLeaderPhone}
                  onChange={(e) => setTeamLeaderPhone(e.target.value)}
                  placeholder="0550..."
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Mission spécifique *</label>
                <Input
                  value={teamMission}
                  onChange={(e) => setTeamMission(e.target.value)}
                  placeholder="Nettoyage cour école, distribution vivres..."
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTeamModalInterventionId(null)}
                  className="rounded-2xl"
                >
                  Annuler
                </Button>
                <Button type="submit" className="rounded-2xl">
                  Enregistrer l'équipe
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
