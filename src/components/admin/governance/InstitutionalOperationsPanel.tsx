import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Flame,
  Layers,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useGovernance } from "@/context/GovernanceContext"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { padWilayaCode, getWilaya } from "@/lib/wilayas"
import type {
  InstitutionalOperation,
  OperationCategory,
  OperationRiskLevel,
  OperationValidationLevel,
  OperationWorkflowStatus,
  DigitalAttestation,
} from "@/lib/governanceTypes"
import AttestationModal from "./AttestationModal"

const STATUS_METAS: Record<
  OperationWorkflowStatus,
  { labelFr: string; color: string; badgeColor: string }
> = {
  draft: { labelFr: "Brouillon", color: "text-slate-600", badgeColor: "bg-slate-100 text-slate-800 border-slate-300" },
  submitted: { labelFr: "Soumise", color: "text-blue-700", badgeColor: "bg-blue-50 text-blue-800 border-blue-200" },
  under_review: { labelFr: "En cours de vérification", color: "text-indigo-700", badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  approved: { labelFr: "Validée / Approuvée", color: "text-emerald-700", badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  published: { labelFr: "Publiée", color: "text-teal-700", badgeColor: "bg-teal-50 text-teal-800 border-teal-300" },
  in_progress: { labelFr: "En cours d'exécution", color: "text-amber-700", badgeColor: "bg-amber-50 text-amber-800 border-amber-300" },
  completed: { labelFr: "Réalisée", color: "text-cyan-700", badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-300" },
  closed: { labelFr: "Clôturée", color: "text-purple-700", badgeColor: "bg-purple-50 text-purple-800 border-purple-300" },
  rejected: { labelFr: "Refusée", color: "text-rose-700", badgeColor: "bg-rose-50 text-rose-800 border-rose-300" },
  suspended: { labelFr: "Suspendue", color: "text-red-700", badgeColor: "bg-red-50 text-red-800 border-red-300" },
  cancelled: { labelFr: "Annulée", color: "text-slate-600", badgeColor: "bg-slate-100 text-slate-700 border-slate-300" },
}

const CATEGORY_LABELS: Record<OperationCategory, string> = {
  humanitarian_sos: "Aide Humanitaire & SOS",
  solidarity_convoi: "Convoi Solidaire",
  youth_empowerment: "Jeunesse & Citoyenneté",
  environmental_protection: "Protection Environnement",
  health_medical: "Santé & Soins Médicaux",
  sports_civic: "Sport & Mobilisation Civique",
  infrastructure_renovation: "Rénovation & BTP Proximité",
}

export default function InstitutionalOperationsPanel() {
  const {
    operations,
    currentUser,
    createOperation,
    transitionOperationStatus,
  } = useGovernance()
  const { wilayas } = useLocationFilter()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewAttestation, setViewAttestation] = useState<DigitalAttestation | null>(null)

  // Action / Transition Dialog
  const [targetOp, setTargetOp] = useState<InstitutionalOperation | null>(null)
  const [targetStatus, setTargetStatus] = useState<OperationWorkflowStatus | null>(null)
  const [isEmergencyAction, setIsEmergencyAction] = useState(false)
  const [transitionJustification, setTransitionJustification] = useState("")
  const [transitionError, setTransitionError] = useState("")
  const [transitionSuccess, setTransitionSuccess] = useState("")

  // Create Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<OperationCategory>("humanitarian_sos")
  const [riskLevel, setRiskLevel] = useState<OperationRiskLevel>("standard")
  const [requiredValidationLevel, setRequiredValidationLevel] = useState<OperationValidationLevel>("wilaya")
  const [wilayaCode, setWilayaCode] = useState<number>(currentUser.wilayaCode || 6)
  const [commune, setCommune] = useState<string>(currentUser.commune || "Akbou")
  const [address, setAddress] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState("")
  const [volunteersNeeded, setVolunteersNeeded] = useState("20")
  const [budgetDZD, setBudgetDZD] = useState("250000")
  const [isUrgent, setIsUrgent] = useState(false)
  const [createError, setCreateError] = useState("")

  const filtered = useMemo(() => {
    return operations.filter((op) => {
      const q = search.trim().toLowerCase()
      if (q) {
        const full = `${op.title} ${op.reference} ${op.commune} ${op.createdByName}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      if (statusFilter !== "all" && op.status !== statusFilter) return false
      if (categoryFilter !== "all" && op.category !== categoryFilter) return false
      return true
    })
  }, [operations, search, statusFilter, categoryFilter])

  const handleOpenTransition = (
    op: InstitutionalOperation,
    status: OperationWorkflowStatus,
    emergency = false
  ) => {
    setTargetOp(op)
    setTargetStatus(status)
    setIsEmergencyAction(emergency)
    setTransitionJustification("")
    setTransitionError("")
    setTransitionSuccess("")
  }

  const handleExecuteTransition = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetOp || !targetStatus) return
    setTransitionError("")
    setTransitionSuccess("")

    const res = transitionOperationStatus(
      targetOp.id,
      targetStatus,
      transitionJustification,
      { isEmergency: isEmergencyAction }
    )

    if (!res.ok) {
      setTransitionError(res.error)
    } else {
      setTransitionSuccess("Transition exécutée et attestation générée avec succès.")
      if (res.attestation) {
        // Auto open attestation
        setTimeout(() => {
          setTargetOp(null)
          setViewAttestation(res.attestation!)
        }, 800)
      } else {
        setTimeout(() => {
          setTargetOp(null)
        }, 900)
      }
    }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")

    if (!title.trim() || title.trim().length < 5) {
      setCreateError("Le titre doit contenir au moins 5 caractères.")
      return
    }

    const res = createOperation({
      title: title.trim(),
      description: description.trim(),
      category,
      riskLevel,
      requiredValidationLevel,
      wilayaCode,
      commune: commune.trim(),
      address: address.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      status: "submitted",
      isUrgent,
      urgentJustification: isUrgent ? "Alerte prioritaire déclarée" : undefined,
      kpis: {
        volunteersNeeded: Number(volunteersNeeded) || 10,
        volunteersMobilized: 0,
      },
      budgetDZD: Number(budgetDZD) || 0,
      verificationStage: "verified",
    })

    if (!res.ok) {
      setCreateError(res.error)
    } else {
      setIsCreateOpen(false)
      setTitle("")
      setDescription("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-emerald-700" />
            Opérations Institutionnelles & Interventions
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Supervision du cycle de vie des opérations territoriales, validations hiérarchiques et signatures numériques.
          </p>
        </div>

        {/* Create button (blocked for auditor) */}
        {currentUser.role !== "national_auditor" && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl h-11 px-5 font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Déposer une opération</span>
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher titre, référence, commune..."
                className="ps-10 rounded-2xl h-10 text-xs sm:text-sm border-slate-300 bg-white text-slate-900 font-medium"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-slate-300 bg-white text-slate-900 px-3 text-xs sm:text-sm font-semibold"
              >
                <option value="all">Tous les statuts de validation</option>
                <option value="draft">Brouillon</option>
                <option value="submitted">Soumise</option>
                <option value="under_review">En vérification</option>
                <option value="approved">Validée</option>
                <option value="published">Publiée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Réalisée</option>
                <option value="closed">Clôturée</option>
                <option value="suspended">Suspendue</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-slate-300 bg-white text-slate-900 px-3 text-xs sm:text-sm font-semibold"
              >
                <option value="all">Toutes les catégories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations List / Table */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-600 font-medium shadow-soft">
            Aucune opération ne correspond à vos filtres et à votre périmètre territorial.
          </div>
        ) : (
          filtered.map((op) => {
            const statusMeta = STATUS_METAS[op.status] || STATUS_METAS.draft
            const wilayaInfo = getWilaya(op.wilayaCode)
            const isCreator = op.createdById === currentUser.id
            const needsHigherApproval = op.requiredValidationLevel !== "local"

            return (
              <div
                key={op.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft space-y-4 transition-all hover:border-emerald-300"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {op.reference}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusMeta.badgeColor}`}>
                      {statusMeta.labelFr}
                    </span>
                    {op.isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-950 border border-orange-300 px-2.5 py-0.5 text-[11px] font-extrabold">
                        <Flame className="h-3 w-3 text-orange-600" /> Urgence
                      </span>
                    )}
                    <span className="text-xs text-slate-700 font-medium">
                      Niveau requis : <strong className="text-slate-900 font-bold">{op.requiredValidationLevel.toUpperCase()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-slate-900">
                      Wilaya {padWilayaCode(op.wilayaCode)} ({wilayaInfo?.name}) • {op.commune}
                    </span>
                  </div>
                </div>

                {/* Operation Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {op.title}
                  </h3>
                  <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-2 leading-relaxed">
                    {op.description}
                  </p>
                </div>

                {/* Separation of Duties Warning */}
                {isCreator && needsHigherApproval && op.status === "submitted" && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>
                      <strong className="font-bold">Séparation des responsabilités :</strong> Vous êtes l'auteur de cette opération. L'approbation doit être prononcée par un autre responsable habilité.
                    </span>
                  </div>
                )}

                {/* Metadata & KPIs */}
                <div className="grid gap-2 sm:grid-cols-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs">
                  <div>
                    <span className="text-slate-600 font-bold">Catégorie :</span>
                    <p className="font-bold text-slate-900 truncate mt-0.5">
                      {CATEGORY_LABELS[op.category] || op.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold">Bénévoles mobilisés :</span>
                    <p className="font-black text-slate-950 mt-0.5">
                      {op.kpis.volunteersMobilized} / {op.kpis.volunteersNeeded} requis
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold">Étape de contrôle :</span>
                    <p className="font-black text-emerald-800 capitalize mt-0.5">
                      {op.verificationStage}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold">Attestations scellées :</span>
                    <p className="font-black text-slate-950 mt-0.5">
                      {op.attestations.length} certificat(s)
                    </p>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    {/* View Attestation button */}
                    {op.attestations.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setViewAttestation(op.attestations[op.attestations.length - 1])}
                        className="rounded-xl h-8 px-2.5 text-xs font-bold gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                      >
                        <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Voir l'Attestation ({op.attestations.length})</span>
                      </Button>
                    )}
                  </div>

                  {/* Operational transition buttons (disabled for auditor) */}
                  {currentUser.role !== "national_auditor" && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* DRAFT -> SUBMIT */}
                      {op.status === "draft" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenTransition(op, "submitted")}
                          className="rounded-xl h-8 px-3 text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Soumettre</span>
                        </Button>
                      )}

                      {/* SUBMITTED -> UNDER_REVIEW */}
                      {op.status === "submitted" && currentUser.role !== "mission_lead" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTransition(op, "under_review")}
                          className="rounded-xl h-8 px-3 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        >
                          <span>Mettre en vérification</span>
                        </Button>
                      )}

                      {/* UNDER_REVIEW / SUBMITTED -> APPROVE (Attestation) */}
                      {(op.status === "under_review" || op.status === "submitted") &&
                        (!isCreator || !needsHigherApproval || currentUser.role === "national_admin") && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenTransition(op, "approved")}
                            className="rounded-xl h-8 px-3 text-xs font-bold gap-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approuver & Sceller</span>
                          </Button>
                        )}

                      {/* Emergency Fast-track publish (for urgent cases) */}
                      {(op.isUrgent || op.riskLevel === "critical_emergency") &&
                        ["submitted", "under_review", "approved"].includes(op.status) &&
                        (currentUser.role === "national_admin" || currentUser.role === "wilaya_admin") && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenTransition(op, "published", true)}
                            className="rounded-xl h-8 px-3 text-xs font-extrabold gap-1 bg-orange-600 hover:bg-orange-700 text-white"
                            title="Publication immédiate sous régime d'urgence avec contrôle a posteriori"
                          >
                            <Flame className="h-3.5 w-3.5" />
                            <span>Circuit d'Urgence Accéléré</span>
                          </Button>
                        )}

                      {/* APPROVED -> PUBLISHED */}
                      {op.status === "approved" && currentUser.role !== "mission_lead" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenTransition(op, "published")}
                          className="rounded-xl h-8 px-3 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                        >
                          <span>Publier au public</span>
                        </Button>
                      )}

                      {/* PUBLISHED / APPROVED -> IN_PROGRESS */}
                      {(op.status === "published" || op.status === "approved") && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenTransition(op, "in_progress")}
                          className="rounded-xl h-8 px-3 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>Lancer sur le terrain</span>
                        </Button>
                      )}

                      {/* IN_PROGRESS -> COMPLETED */}
                      {op.status === "in_progress" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenTransition(op, "completed")}
                          className="rounded-xl h-8 px-3 text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white"
                        >
                          <span>Valider fin de mission</span>
                        </Button>
                      )}

                      {/* COMPLETED -> CLOSED */}
                      {op.status === "completed" && currentUser.role !== "mission_lead" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenTransition(op, "closed")}
                          className="rounded-xl h-8 px-3 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white"
                        >
                          <span>Prononcer la Clôture</span>
                        </Button>
                      )}

                      {/* SUSPEND (when active) */}
                      {["approved", "published", "in_progress"].includes(op.status) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenTransition(op, "suspended")}
                          className="rounded-xl h-8 px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          <span>Suspendre</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL 1: FORMULAIRE DE CRÉATION D'OPÉRATION */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Nouvelle Opération Institutionnelle
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Enregistrement au registre territorial des missions de solidarité
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800">
                  Titre de l'opération <span className="text-rose-600">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Convoi Solidaire et Chauffage Akbou..."
                  required
                  className="rounded-2xl mt-1 h-11 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Description & Objectifs
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Préciser les objectifs, bénéficiaires et matériel mobilisé..."
                  rows={3}
                  className="w-full mt-1 rounded-2xl border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as OperationCategory)}
                    className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Niveau de validation hiérarchique
                  </label>
                  <select
                    value={requiredValidationLevel}
                    onChange={(e) => setRequiredValidationLevel(e.target.value as OperationValidationLevel)}
                    className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    <option value="local">Local (Coordinateur de commune)</option>
                    <option value="wilaya">Wilaya (Direction Jeunesse & Sports)</option>
                    <option value="national">National (Ministère / Direction Générale)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Wilaya
                  </label>
                  <select
                    value={wilayaCode}
                    onChange={(e) => setWilayaCode(Number(e.target.value))}
                    disabled={currentUser.role !== "national_admin"}
                    className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium disabled:opacity-60"
                  >
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>
                        {padWilayaCode(w.code)} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Commune
                  </label>
                  <Input
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    required
                    className="rounded-2xl mt-1 h-11 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Adresse / Lieu
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ex. Rue des Frères, Akbou"
                    className="rounded-2xl mt-1 h-11 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Niveau d'analyse de risque
                  </label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as OperationRiskLevel)}
                    className="w-full rounded-2xl border border-border bg-white px-3 h-11 text-xs mt-1"
                  >
                    <option value="standard">Standard (Faible)</option>
                    <option value="elevated">Élevé (Sous conditions)</option>
                    <option value="critical">Critique (Mesures spéciales)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-2xl mt-1 h-11 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Date de fin (optionnelle)
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-2xl mt-1 h-11 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Bénévoles requis
                  </label>
                  <Input
                    type="number"
                    value={volunteersNeeded}
                    onChange={(e) => setVolunteersNeeded(e.target.value)}
                    className="rounded-2xl mt-1 h-11 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Budget estimé (DZD)
                  </label>
                  <Input
                    type="number"
                    value={budgetDZD}
                    onChange={(e) => setBudgetDZD(e.target.value)}
                    className="rounded-2xl mt-1 h-11 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Urgence checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isUrgent" className="text-xs font-semibold text-orange-900 cursor-pointer flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-600" />
                  Opération d'urgence humanitaire ou sinistre (Accélération autorisée)
                </label>
              </div>

              {createError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {createError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 rounded-2xl h-11 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Créer et soumettre
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIALOGUE D'ACTION & MOTIF OBLIGATOIRE */}
      {targetOp && targetStatus && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 space-y-4">
            <button
              type="button"
              onClick={() => setTargetOp(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleExecuteTransition} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Confirmation de la Décision
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Transition vers : <strong className="text-slate-900">{STATUS_METAS[targetStatus]?.labelFr}</strong>
                  </p>
                </div>
              </div>

              {isEmergencyAction && (
                <div className="rounded-2xl border border-orange-300 bg-orange-50 p-3 text-xs text-orange-950 flex items-start gap-2">
                  <Flame className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Circuit d'Urgence Accéléré :</strong> Cette décision publie directement l'opération. Elle sera enregistrée au registre d'audit avec contrôle a posteriori obligatoire.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-800">
                  Motif / Justification formelle obligatoire <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={transitionJustification}
                  onChange={(e) => setTransitionJustification(e.target.value)}
                  placeholder="Indiquer les motifs circonstanciés de la décision, références du dossier..."
                  rows={3}
                  required
                  className="w-full mt-1 rounded-2xl border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {transitionError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {transitionError}
                </div>
              )}

              {transitionSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{transitionSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTargetOp(null)}
                  className="flex-1 rounded-2xl h-11 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Valider & Sceller
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VISIONNEUSE D'ATTESTATION */}
      <AttestationModal
        attestation={viewAttestation}
        onClose={() => setViewAttestation(null)}
      />
    </div>
  )
}
