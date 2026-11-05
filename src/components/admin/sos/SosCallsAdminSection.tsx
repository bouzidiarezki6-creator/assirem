import { useState, useMemo, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Edit3,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import {
  SOS_PROFESSIONS,
  SOS_PROFESSION_CATEGORIES,
  getProfessionMeta,
  parseGpsCoord,
} from "@/lib/sos"
import type {
  SosCall,
  SosCallStatus,
  SosCallType,
  SosCallUrgency,
  SosProfessionCategory,
} from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

export default function SosCallsAdminSection() {
  const { t, locale } = useI18n()
  const { wilayas, selectedCode } = useLocationFilter()
  const { data, addSosCall, updateSosCall, deleteSosCall } = useAppData()

  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState("")

  // Stepper state: 1 to 5
  const [step, setStep] = useState<number>(1)

  // Context menu open state (call ID)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Step 1: General Info
  const [type, setType] = useState<SosCallType>("professional")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState<SosCallUrgency>("urgent")

  // Step 2: Profiles & Skills
  const [professionCategory, setProfessionCategory] = useState<SosProfessionCategory>("health")
  const [professionId, setProfessionId] = useState("doctor")
  const [customProfessionTitle, setCustomProfessionTitle] = useState("")
  const [mandatoryQualifications, setMandatoryQualifications] = useState(true)
  const [conditions, setConditions] = useState("")
  const [requiredEquipment, setRequiredEquipment] = useState("")

  // Step 3: Capacity & Schedule
  const [requiredSlots, setRequiredSlots] = useState("5")
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState("")
  const [timeSchedule, setTimeSchedule] = useState("08h30 - 16h30")
  const [estimatedDuration, setEstimatedDuration] = useState("3 jours")

  // Step 4: Location & Organization
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [commune, setCommune] = useState("Akbou")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [coordinatorName, setCoordinatorName] = useState("Coordinateur Terrain")
  const [coordinatorContact, setCoordinatorContact] = useState("0550112233")

  // Step 5: Verification & Status
  const [status, setStatus] = useState<SosCallStatus>("open")
  const [adminNote, setAdminNote] = useState("")

  const calls = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data.sosCalls || []).filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false
      if (!needle) return true
      return [c.title, c.commune, c.reference, c.customProfessionTitle || "", String(c.wilayaCode)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [data.sosCalls, filterType, search])

  const openNewForm = () => {
    setEditingId(null)
    setStep(1)
    setType("professional")
    setTitle("")
    setDescription("")
    setProfessionCategory("health")
    setProfessionId("doctor")
    setCustomProfessionTitle("")
    setMandatoryQualifications(true)
    setConditions("")
    setRequiredEquipment("")
    setRequiredSlots("5")
    setStartDate(new Date().toISOString().slice(0, 10))
    setEndDate("")
    setTimeSchedule("08h30 - 16h30")
    setEstimatedDuration("3 jours")
    setWilayaCode(selectedCode ?? 6)
    setCommune("Akbou")
    setAddress("")
    setLat("")
    setLng("")
    setCoordinatorName("Coordinateur Terrain")
    setCoordinatorContact("0550112233")
    setStatus("open")
    setUrgencyLevel("urgent")
    setAdminNote("")
    setFormError("")
    setShowForm(true)
  }

  const openEditForm = (c: SosCall) => {
    setEditingId(c.id)
    setStep(1)
    setType(c.type)
    setTitle(c.title)
    setDescription(c.description || "")
    setProfessionCategory(c.professionCategory || "health")
    setProfessionId(c.professionId || "doctor")
    setCustomProfessionTitle(c.customProfessionTitle || "")
    setMandatoryQualifications(c.mandatoryQualifications ?? true)
    setRequiredSlots(String(c.requiredSlots))
    setWilayaCode(c.wilayaCode)
    setCommune(c.commune)
    setAddress(c.address || "")
    setLat(c.lat != null ? String(c.lat) : "")
    setLng(c.lng != null ? String(c.lng) : "")
    setStartDate(c.startDate)
    setEndDate(c.endDate || "")
    setTimeSchedule(c.timeSchedule || "")
    setEstimatedDuration(c.estimatedDuration || "")
    setUrgencyLevel(c.urgencyLevel)
    setConditions(c.conditions || "")
    setRequiredEquipment(c.requiredEquipment || "")
    setCoordinatorName(c.coordinatorName)
    setCoordinatorContact(c.coordinatorContact || "")
    setStatus(c.status)
    setAdminNote(c.adminNote || "")
    setFormError("")
    setShowForm(true)
  }

  // Stepper Step Validation
  const validateStep = (currentStep: number): boolean => {
    setFormError("")
    if (currentStep === 1) {
      if (!title.trim()) {
        setFormError("Veuillez saisir le titre de la mission.")
        return false
      }
      if (!description.trim()) {
        setFormError("Veuillez saisir une description de la mission.")
        return false
      }
    } else if (currentStep === 3) {
      const slots = Number(requiredSlots)
      if (!slots || slots <= 0) {
        setFormError("Le nombre de places requises doit être supérieur à 0.")
        return false
      }
      if (!startDate) {
        setFormError("La date de début est requise.")
        return false
      }
    } else if (currentStep === 4) {
      if (!commune.trim()) {
        setFormError("La commune est requise.")
        return false
      }
      if (!coordinatorName.trim()) {
        setFormError("Le nom du coordinateur est requis.")
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(5, s + 1))
    }
  }

  const handlePrev = () => {
    setFormError("")
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError("")

    const slots = Number(requiredSlots)
    if (!slots || slots <= 0) {
      setFormError("Le nombre de places requises doit être supérieur à 0.")
      return
    }

    const latN = lat.trim() ? parseGpsCoord(lat) : undefined
    const lngN = lng.trim() ? parseGpsCoord(lng) : undefined

    if (editingId) {
      const res = updateSosCall(editingId, {
        type,
        title: title.trim(),
        description: description.trim(),
        professionCategory: type === "professional" ? professionCategory : undefined,
        professionId: type === "professional" ? professionId : undefined,
        customProfessionTitle: customProfessionTitle.trim() || undefined,
        mandatoryQualifications: type === "professional" ? mandatoryQualifications : false,
        requiredSlots: slots,
        wilayaCode,
        commune: commune.trim(),
        address: address.trim() || undefined,
        lat: latN ?? undefined,
        lng: lngN ?? undefined,
        startDate,
        endDate: endDate || undefined,
        timeSchedule: timeSchedule.trim() || undefined,
        estimatedDuration: estimatedDuration.trim() || undefined,
        urgencyLevel,
        conditions: conditions.trim() || undefined,
        requiredEquipment: requiredEquipment.trim() || undefined,
        coordinatorName: coordinatorName.trim(),
        coordinatorContact: coordinatorContact.trim() || undefined,
        status,
        adminNote: adminNote.trim() || undefined,
      })

      if ("error" in res) {
        setFormError(t(res.error))
        return
      }
    } else {
      const res = addSosCall({
        type,
        title: title.trim(),
        description: description.trim(),
        professionCategory: type === "professional" ? professionCategory : undefined,
        professionId: type === "professional" ? professionId : undefined,
        customProfessionTitle: customProfessionTitle.trim() || undefined,
        mandatoryQualifications: type === "professional" ? mandatoryQualifications : false,
        requiredSlots: slots,
        wilayaCode,
        commune: commune.trim(),
        address: address.trim() || undefined,
        lat: latN ?? undefined,
        lng: lngN ?? undefined,
        startDate,
        endDate: endDate || undefined,
        timeSchedule: timeSchedule.trim() || undefined,
        estimatedDuration: estimatedDuration.trim() || undefined,
        urgencyLevel,
        conditions: conditions.trim() || undefined,
        requiredEquipment: requiredEquipment.trim() || undefined,
        coordinatorName: coordinatorName.trim(),
        coordinatorContact: coordinatorContact.trim() || undefined,
        status,
        adminNote: adminNote.trim() || undefined,
      })

      if ("error" in res) {
        setFormError(t(res.error))
        return
      }
    }

    setShowForm(false)
    setEditingId(null)
  }

  const filteredProfessions = useMemo(() => {
    return SOS_PROFESSIONS.filter((p) => p.category === professionCategory)
  }, [professionCategory])

  const stepsMeta = [
    { num: 1, title: "Général", desc: "Titre, type & urgence" },
    { num: 2, title: "Compétences", desc: "Métier & matériel" },
    { num: 3, title: "Capacité", desc: "Places & planning" },
    { num: 4, title: "Localisation", desc: "Zone & responsable" },
    { num: 5, title: "Publication", desc: "Vérification finale" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">
            {t("admin.sosCrm.tabs.calls")} ({calls.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Gestion des appels pro et bénévoles avec limitation stricte des places et stepper d'édition.
          </p>
        </div>

        <Button
          type="button"
          onClick={showForm ? () => setShowForm(false) : openNewForm}
          className="rounded-2xl gap-2"
        >
          <Plus className="h-4 w-4" />
          {showForm ? t("common.cancel") : t("admin.sosCrm.actions.addCall")}
        </Button>
      </div>

      {/* STEPPER FORM */}
      {showForm && (
        <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-soft animate-fade-in space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {editingId ? "Modification de l'appel" : "Nouvel appel à mobilisation"}
              </span>
              <h3 className="text-lg font-black text-foreground">
                Étape {step} sur 5 : {stepsMeta[step - 1].title}
              </h3>
            </div>

            {/* Stepper progress dots / numbers */}
            <div className="hidden sm:flex items-center gap-2">
              {stepsMeta.map((s) => (
                <div key={s.num} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      step === s.num
                        ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                        : step > s.num
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  {s.num < 5 && <div className="h-0.5 w-4 bg-muted" />}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* ÉTAPE 1 : INFORMATIONS GÉNÉRALES */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Type d'appel *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as SosCallType)}
                      className="w-full mt-1.5 h-11 rounded-2xl border border-input bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      <option value="professional">Professionnels & Compétences spécifiques</option>
                      <option value="volunteer">Missions citoyennes & Bénévoles sans prérequis</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Niveau d'urgence *</label>
                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value as SosCallUrgency)}
                      className="w-full mt-1.5 h-11 rounded-2xl border border-input bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      <option value="critical">Critique (Intervention immédiate)</option>
                      <option value="urgent">Urgent</option>
                      <option value="moderate">Modéré</option>
                      <option value="low">Standard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Titre de la mission *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Médecins urgentistes pour intervention mobile"
                    required
                    className="rounded-2xl mt-1.5 h-11 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Description détaillée *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Détaillez le contexte de l'intervention, les objectifs précis et le déroulement attendu..."
                    required
                    className="w-full mt-1.5 rounded-2xl border border-input bg-background p-3 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : PROFILS & COMPÉTENCES */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {type === "professional" ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-foreground">
                          Secteur professionnel *
                        </label>
                        <select
                          value={professionCategory}
                          onChange={(e) => {
                            const cat = e.target.value as SosProfessionCategory
                            setProfessionCategory(cat)
                            const first = SOS_PROFESSIONS.find((p) => p.category === cat)
                            if (first) setProfessionId(first.id)
                          }}
                          className="w-full mt-1.5 h-11 rounded-2xl border border-input bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                        >
                          {SOS_PROFESSION_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {t(c.labelKey)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-foreground">
                          Métier recherché *
                        </label>
                        <select
                          value={professionId}
                          onChange={(e) => setProfessionId(e.target.value)}
                          className="w-full mt-1.5 h-11 rounded-2xl border border-input bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                        >
                          {filteredProfessions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {t(p.labelKey)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground">
                        Intitulé spécifique ou personnalisé (facultatif)
                      </label>
                      <Input
                        value={customProfessionTitle}
                        onChange={(e) => setCustomProfessionTitle(e.target.value)}
                        placeholder="Ex : Cardiologue pédiatrique, grutier certifié..."
                        className="rounded-2xl mt-1.5 h-11 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="mandatoryQualifications"
                        checked={mandatoryQualifications}
                        onChange={(e) => setMandatoryQualifications(e.target.checked)}
                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="mandatoryQualifications"
                        className="text-xs font-bold text-foreground cursor-pointer"
                      >
                        Justificatif professionnel / diplôme obligatoire pour cette mission
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-800">
                    <p className="font-bold">Missions citoyennes ouvertes à tous</p>
                    <p className="mt-1 text-muted-foreground">
                      Aucune qualification professionnelle spécifique n'est exigée pour ce type d'appel.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Conditions de participation
                    </label>
                    <Input
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      placeholder="Ex: Permis B, condition physique..."
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Matériel éventuellement requis
                    </label>
                    <Input
                      value={requiredEquipment}
                      onChange={(e) => setRequiredEquipment(e.target.value)}
                      placeholder="Ex: Chaussures de sécurité, blouse..."
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : CAPACITÉ & DISPONIBILITÉ */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900">
                  <p className="font-bold">Règle de limitation stricte des places</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Dès que le nombre d'acceptations atteint la capacité maximale, l'appel bascule automatiquement en état complet et toute nouvelle inscription est orientée vers la liste d'attente.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Nombre de personnes nécessaires (Capacité max) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={requiredSlots}
                      onChange={(e) => setRequiredSlots(e.target.value)}
                      required
                      className="rounded-2xl mt-1.5 h-11 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Durée estimée de la mission
                    </label>
                    <Input
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="Ex: 3 jours, 1 week-end..."
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Date de début *</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Date de fin</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Horaires prévus</label>
                    <Input
                      value={timeSchedule}
                      onChange={(e) => setTimeSchedule(e.target.value)}
                      placeholder="08h30 - 16h30"
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : LOCALISATION & ORGANISATION */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Wilaya *</label>
                    <select
                      value={wilayaCode}
                      onChange={(e) => setWilayaCode(Number(e.target.value))}
                      className="w-full mt-1.5 h-11 rounded-2xl border border-input bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      {wilayas.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {locale === "ar" ? w.name_ar : w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Commune *</label>
                    <Input
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      placeholder="Ex: Akbou"
                      required
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Adresse ou repère précis</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Centre de santé polyclinique, Rue 1er Novembre"
                    className="rounded-2xl mt-1.5 h-11 text-xs"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Latitude GPS (facultatif)</label>
                    <Input
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="36.4578"
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Longitude GPS (facultatif)</label>
                    <Input
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="4.5421"
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/40">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Responsable de la mission *
                    </label>
                    <Input
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      placeholder="Nom du coordinateur"
                      required
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Téléphone de contact
                    </label>
                    <Input
                      value={coordinatorContact}
                      onChange={(e) => setCoordinatorContact(e.target.value)}
                      placeholder="0550112233"
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 5 : RÉCAPITULATIF & PUBLICATION */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Récapitulatif de l'appel
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Titre :</span>
                      <strong className="text-foreground text-sm">{title}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Type :</span>
                      <strong className="text-foreground capitalize">{type}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Capacité maximale :</span>
                      <strong className="text-primary text-sm">{requiredSlots} personnes</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Zone :</span>
                      <strong className="text-foreground">{commune} (Wilaya {wilayaCode})</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Dates :</span>
                      <strong className="text-foreground">{startDate} {endDate ? `→ ${endDate}` : ""}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Coordinateur :</span>
                      <strong className="text-foreground">{coordinatorName} ({coordinatorContact})</strong>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Statut de l'appel</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as SosCallStatus)}
                      className="w-full mt-1.5 h-11 rounded-2xl border border-input bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      <option value="open">Ouvert (recrutement actif)</option>
                      <option value="full">Complet</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="closed">Fermé / Clôturé</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Note interne administrative</label>
                    <Input
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Note visible uniquement par la coordination"
                      className="rounded-2xl mt-1.5 h-11 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={step === 1 ? () => setShowForm(false) : handlePrev}
                className="rounded-2xl gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {step === 1 ? t("common.cancel") : "Précédent"}
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-2xl gap-1.5 text-xs font-bold bg-primary px-6"
                >
                  Suivant
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="rounded-2xl gap-1.5 text-xs font-bold bg-primary px-6"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {editingId ? t("common.save") : "Publier l'appel à mobilisation"}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, compétence, commune..."
            className="h-11 rounded-2xl ps-10 text-xs shadow-sm bg-white"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-11 rounded-2xl border border-input bg-white px-3 text-xs font-semibold shadow-sm"
        >
          <option value="all">Tous les types d'appels</option>
          <option value="professional">Professionnels uniquement</option>
          <option value="volunteer">Bénévoles uniquement</option>
        </select>
      </div>

      {/* CALLS TABLE WITH CLEAN CONTEXTUAL MENU */}
      <div className="overflow-x-auto rounded-3xl border border-border/70 bg-white shadow-soft">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4 text-start">Réf & Titre</th>
              <th className="p-4 text-start">Type / Rôle</th>
              <th className="p-4 text-start">Capacité</th>
              <th className="p-4 text-start">Localisation</th>
              <th className="p-4 text-start">Urgence</th>
              <th className="p-4 text-start">Statut</th>
              <th className="p-4 text-end">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {calls.map((c) => {
              const prof = getProfessionMeta(c.professionId)
              const remaining = Math.max(0, c.requiredSlots - (c.acceptedCount || 0))
              const percent = Math.min(
                100,
                Math.round(((c.acceptedCount || 0) / c.requiredSlots) * 100)
              )
              const isMenuOpen = activeMenuId === c.id

              return (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {c.reference}
                    </span>
                    <strong className="text-foreground text-xs sm:text-sm font-bold block">{c.title}</strong>
                    <span className="text-[10px] text-muted-foreground">
                      Coord : {c.coordinatorName}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        c.type === "professional"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {c.type === "professional" ? (
                        <Briefcase className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      {c.customProfessionTitle || (prof ? t(prof.labelKey) : c.type)}
                    </span>
                  </td>

                  <td className="p-4 min-w-[150px]">
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span>
                        {c.acceptedCount || 0}/{c.requiredSlots} acceptés
                      </span>
                      <span className="text-primary font-bold">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          c.status === "full" ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      {c.receivedCount || 0} reçues · {remaining} restante{remaining > 1 ? "s" : ""}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-medium text-foreground">{c.commune}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      Wilaya {padWilayaCode(c.wilayaCode)}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        c.urgencyLevel === "critical" && "bg-rose-100 text-rose-800",
                        c.urgencyLevel === "urgent" && "bg-amber-100 text-amber-800",
                        c.urgencyLevel === "moderate" && "bg-blue-100 text-blue-800",
                        c.urgencyLevel === "low" && "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {c.urgencyLevel}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        c.status === "open" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        c.status === "full" && "bg-amber-50 text-amber-700 border border-amber-200",
                        c.status === "in_progress" && "bg-blue-50 text-blue-700 border border-blue-200",
                        c.status === "completed" && "bg-teal-50 text-teal-700 border border-teal-200",
                        c.status === "closed" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="p-4 text-end relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(isMenuOpen ? null : c.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Contextual Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-4 top-12 z-20 w-44 rounded-2xl border border-border/80 bg-white p-1.5 shadow-xl animate-fade-in text-start">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            openEditForm(c)
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-primary" />
                          Modifier
                        </button>

                        <div className="my-1 border-t border-border/40" />

                        <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                          Changer statut :
                        </div>
                        {(["open", "full", "in_progress", "completed", "closed"] as SosCallStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                updateSosCall(c.id, { status: st })
                                setActiveMenuId(null)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs",
                                c.status === st
                                  ? "font-bold text-primary bg-primary/5"
                                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              )}
                            >
                              <span>{st}</span>
                              {c.status === st && <Check className="h-3 w-3" />}
                            </button>
                          )
                        )}

                        <div className="my-1 border-t border-border/40" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            if (confirm(`Supprimer l'appel "${c.title}" ?`)) {
                              deleteSosCall(c.id)
                            }
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {calls.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Aucun appel à mobilisation trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
