import { useMemo, useState, type ReactNode } from "react"
import { Award, CheckCircle2, History, Search, PlusCircle, X, AlertCircle, Trash2, Edit3, ShieldAlert, Sliders } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PointsLevelInfo from "@/components/shared/PointsLevelInfo"
import LevelProgressBar from "@/components/shared/LevelProgressBar"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useGovernance } from "@/context/GovernanceContext"
import { DEFAULT_POINT_RULES } from "@/lib/pointsEngine"
import { ACTIVITY_CATEGORIES, type CategoryId } from "@/lib/categories"
import {
  ACTIVITY_TYPES,
  DURATION_OPTIONS,
  RESPONSIBILITY_OPTIONS,
  getDuration,
  getResponsibility,
  type ActivityTypeId,
  type DurationId,
  type ResponsibilityId,
} from "@/lib/volunteerPoints"

type Props = {
  initialVolunteerId?: string | null
  onClose?: () => void
}

const emptyForm = {
  activityPreset: "custom", // "custom" or "activity:<id>" or "event:<id>"
  activityTitle: "",
  activityDate: new Date().toISOString().slice(0, 10),
  categoryId: "social" as CategoryId,
  activityTypeId: "standard" as ActivityTypeId,
  durationId: "h2_4" as DurationId,
  responsibilityId: "participant" as ResponsibilityId,
  useCustomPoints: false,
  customPoints: "20",
  adminNote: "",
}

function displayError(
  error: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  return error.startsWith("errors.") ? t(error) : error
}

export default function VolunteerPointsManager({
  initialVolunteerId = null,
  onClose,
}: Props) {
  const { t, dir } = useI18n()
  const { currentUser } = useGovernance()
  const isAuditor = currentUser?.role === "national_auditor"

  const {
    data,
    previewParticipationPoints,
    validateParticipation,
    cancelParticipation,
    modifyParticipationPoints,
    getVolunteerParticipations,
    getVolunteerStats,
    updatePointRulesConfig,
  } = useAppData()

  const [query, setQuery] = useState("")
  const [volunteerId, setVolunteerId] = useState<string | null>(initialVolunteerId)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Point rules configuration modal state
  const currentRules = data.pointRulesConfig || DEFAULT_POINT_RULES
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const [rulesForm, setRulesForm] = useState({
    registrationValidated: String(currentRules.registrationValidated),
    presenceConfirmed: String(currentRules.presenceConfirmed),
    missionCompleted: String(currentRules.missionCompleted),
    reportAccepted: String(currentRules.reportAccepted),
    criticalMissionBonus: String(currentRules.criticalMissionBonus),
    exceptionalMissionBonus: String(currentRules.exceptionalMissionBonus),
  })

  const volunteers = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return data.registrants
    return data.registrants.filter((r) =>
      [r.lastName, r.firstName, r.nationalId, r.id, r.qrCode]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [data.registrants, query])

  const selected = data.registrants.find((r) => r.id === volunteerId) ?? null
  const stats = volunteerId ? getVolunteerStats(volunteerId) : null
  const history = volunteerId ? getVolunteerParticipations(volunteerId) : []

  // List of existing published activities and events to offer as one-click presets
  const availablePresets = useMemo(() => {
    const items: { value: string; label: string; title: string; categoryId: CategoryId; date: string }[] = []
    
    data.activities
      .filter((a) => a.published)
      .forEach((a) => {
        items.push({
          value: `activity:${a.id}`,
          label: `[Activité] ${a.title}`,
          title: a.title,
          categoryId: a.categoryId ?? "social",
          date: a.date || new Date().toISOString().slice(0, 10),
        })
      })

    data.events
      .filter((e) => e.published)
      .forEach((e) => {
        items.push({
          value: `event:${e.id}`,
          label: `[Événement] ${e.title}`,
          title: e.title,
          categoryId: e.categoryId ?? "evenementiel",
          date: e.date || new Date().toISOString().slice(0, 10),
        })
      })

    return items
  }, [data.activities, data.events])

  // Calculation preview
  const preview = useMemo(() => {
    if (form.useCustomPoints) {
      const pts = Number(form.customPoints) || 0
      return {
        basePoints: pts,
        categoryCoefficient: 1,
        durationMultiplier: 1,
        responsibilityMultiplier: 1,
        rawTotal: pts,
        finalPoints: Math.max(0, pts),
        hoursCounted: 3,
        lines: [{ label: "Points personnalisés", detail: `${pts} pts` }],
        formula: `${pts} pts (saisie manuelle)`,
      }
    }
    try {
      return previewParticipationPoints({
        categoryId: form.categoryId,
        activityTypeId: form.activityTypeId,
        durationId: form.durationId,
        responsibilityId: form.responsibilityId,
      })
    } catch {
      return null
    }
  }, [form, previewParticipationPoints])

  function handlePresetChange(presetVal: string) {
    if (presetVal === "custom") {
      setForm((prev) => ({ ...prev, activityPreset: "custom" }))
      return
    }
    const match = availablePresets.find((p) => p.value === presetVal)
    if (match) {
      setForm((prev) => ({
        ...prev,
        activityPreset: presetVal,
        activityTitle: match.title,
        categoryId: match.categoryId,
        activityDate: match.date.length >= 10 ? match.date.slice(0, 10) : prev.activityDate,
      }))
    }
  }

  function resetForm() {
    setForm(emptyForm)
    setMessage(null)
  }

  function onValidate() {
    if (isAuditor) {
      setMessage({
        type: "err",
        text: "Accès refusé : l'auditeur national est en lecture seule stricte et ne peut pas valider de participation.",
      })
      return
    }

    if (!volunteerId) {
      setMessage({ type: "err", text: t("admin.points.selectRequired") })
      return
    }

    const title = form.activityTitle.trim()
    if (!title) {
      setMessage({ type: "err", text: t("errors.activityTitleRequired") })
      return
    }

    const res = validateParticipation({
      volunteerId,
      activityTitle: title,
      activityDate: form.activityDate,
      categoryId: form.categoryId,
      activityTypeId: form.activityTypeId,
      durationId: form.durationId,
      responsibilityId: form.responsibilityId,
      customPoints: form.useCustomPoints ? Number(form.customPoints) : undefined,
      adminNote: form.adminNote.trim() || undefined,
      authorId: currentUser?.id,
      authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined,
      authorRole: currentUser?.role,
      authorWilayaCode: currentUser?.wilayaCode,
    })

    if (!res.ok) {
      setMessage({ type: "err", text: displayError(res.error, t) })
      return
    }

    setMessage({
      type: "ok",
      text: t("admin.points.validatedOk", { points: res.participation.pointsAwarded }),
    })
    setForm((prev) => ({
      ...emptyForm,
      activityDate: prev.activityDate,
    }))
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("admin.points.title")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("admin.points.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isAuditor && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const r = data.pointRulesConfig || DEFAULT_POINT_RULES
                setRulesForm({
                  registrationValidated: String(r.registrationValidated),
                  presenceConfirmed: String(r.presenceConfirmed),
                  missionCompleted: String(r.missionCompleted),
                  reportAccepted: String(r.reportAccepted),
                  criticalMissionBonus: String(r.criticalMissionBonus),
                  exceptionalMissionBonus: String(r.exceptionalMissionBonus),
                })
                setRulesModalOpen(true)
              }}
              className="text-xs font-bold gap-1.5 border-border/80"
            >
              <Sliders className="h-4 w-4 text-primary" />
              Configurer les barèmes
            </Button>
          )}

          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              {t("common.close")}
            </Button>
          )}
        </div>
      </div>

      {isAuditor && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
          <p className="flex-1">
            Mode Consultation — <strong>Auditeur National</strong> : la validation de présence et la modification de points sont verrouillées (lecture seule stricte pour traçabilité et indépendance de contrôle).
          </p>
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm font-medium ${
            message.type === "ok"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <p className="flex-1">{message.text}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left = Volunteer Picker & Stats, Right = Award Points Form & History */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (5 cols): Member selection & Profile */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{t("admin.points.stepMember")}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {volunteers.length} {t("admin.crm.member")}
                </span>
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("admin.points.searchPh")}
                  className="pl-8 text-xs h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto divide-y divide-border/50 border-t border-border/50">
                {volunteers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {t("admin.points.emptyMembers")}
                  </p>
                ) : (
                  volunteers.map((v) => {
                    const isSelected = v.id === volunteerId
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVolunteerId(v.id)
                          setMessage(null)
                        }}
                        className={`w-full text-start p-3 transition-colors flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-primary/10 border-l-4 border-l-primary"
                            : "hover:bg-surface"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {v.lastName} {v.firstName}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            ID: {v.id}
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <span className="font-bold text-xs text-primary tabular-nums">
                            {v.points ?? 0} pts
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Member Card */}
          {selected && (
            <Card className="border-border/60 shadow-sm bg-surface/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <span>{t("admin.points.volunteer")}</span>
                  </CardTitle>
                  <PointsLevelInfo points={selected.points ?? 0} size="md" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div>
                  <p className="text-base font-black text-slate-900">
                    {selected.lastName} {selected.firstName}
                  </p>
                  <p className="font-mono text-xs text-slate-600 font-semibold">
                    NIN : {selected.nationalId}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-bold">
                      {t("admin.points.totalPoints")}
                    </span>
                    <span className="text-xl font-black text-emerald-700 tabular-nums">
                      {selected.points ?? 0} pts
                    </span>
                  </div>
                  <LevelProgressBar points={selected.points ?? 0} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <p className="text-slate-600 text-[10px] uppercase font-bold">
                      {t("admin.points.activities")}
                    </p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {stats?.activityCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <p className="text-slate-600 text-[10px] uppercase font-bold">
                      {t("admin.points.duration")}
                    </p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {stats?.hoursVolunteered ?? 0} h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (8 cols): Award Points Form + History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Action Form */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <span>{t("admin.points.validateTitle")}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {!selected ? (
                <div className="py-10 text-center text-sm text-muted-foreground bg-surface/40 rounded-2xl border border-dashed border-border/80">
                  <Award className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="font-semibold">{t("admin.points.selectRequired")}</p>
                  <p className="text-xs mt-1">{t("admin.points.selectHint")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Activity Presets Selector */}
                  <Field label="Choisir une activité existante ou saisir manuellement">
                    <select
                      value={form.activityPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
                    >
                      <option value="custom">Saisie personnalisée / Autre activité</option>
                      <optgroup label="Activités & Événements au programme">
                        {availablePresets.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </Field>

                  {/* Activity Title & Date */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("admin.points.activityTitle")}>
                      <Input
                        value={form.activityTitle}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            activityTitle: e.target.value,
                            activityPreset: "custom",
                          }))
                        }
                        placeholder={t("admin.points.activityTitlePh")}
                        className="text-xs rounded-xl h-10"
                      />
                    </Field>

                    <Field label={t("admin.points.date")}>
                      <Input
                        type="date"
                        value={form.activityDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, activityDate: e.target.value }))}
                        className="text-xs rounded-xl h-10"
                      />
                    </Field>
                  </div>

                  {/* Category & Role */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("admin.points.category")}>
                      <select
                        value={form.categoryId}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, categoryId: e.target.value as CategoryId }))
                        }
                        className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {ACTIVITY_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.labelFr} ({c.labelAr})
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={t("admin.points.responsibility")}>
                      <select
                        value={form.responsibilityId}
                        disabled={form.useCustomPoints}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            responsibilityId: e.target.value as ResponsibilityId,
                          }))
                        }
                        className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                      >
                        {RESPONSIBILITY_OPTIONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label} (×{r.multiplier})
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Scale & Duration */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("admin.points.activityType")}>
                      <select
                        value={form.activityTypeId}
                        disabled={form.useCustomPoints}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            activityTypeId: e.target.value as ActivityTypeId,
                          }))
                        }
                        className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                      >
                        {ACTIVITY_TYPES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label} ({a.basePoints} pts)
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={t("admin.points.duration")}>
                      <select
                        value={form.durationId}
                        disabled={form.useCustomPoints}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            durationId: e.target.value as DurationId,
                          }))
                        }
                        className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                      >
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label} (×{d.multiplier})
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Manual Point Override Option */}
                  <div className="pt-2 border-t border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground select-none">
                      <input
                        type="checkbox"
                        checked={form.useCustomPoints}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, useCustomPoints: e.target.checked }))
                        }
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span>Saisie directe des points (mode personnalisé sans multiplicateur)</span>
                    </label>

                    {form.useCustomPoints && (
                      <div className="mt-2 max-w-xs">
                        <Field label="Nombre exact de points à attribuer">
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            value={form.customPoints}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, customPoints: e.target.value }))
                            }
                            className="h-10 text-sm font-bold text-primary rounded-xl"
                          />
                        </Field>
                      </div>
                    )}
                  </div>

                  {/* Optional Admin Note */}
                  <Field label="Note administrative / Justification (optionnelle)">
                    <Input
                      value={form.adminNote}
                      onChange={(e) => setForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                      placeholder="Ex. Participation validée au festival, encadrement de 15 jeunes"
                      className="text-xs rounded-xl h-10"
                    />
                  </Field>

                  {/* Live Points Preview Box */}
                  {preview && (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
                          {t("admin.points.calcPreview")}
                        </span>
                        <p className="text-xs text-muted-foreground font-mono">
                          {preview.formula}
                        </p>
                      </div>
                      <div className="text-start sm:text-end shrink-0">
                        <span className="text-xs text-muted-foreground block font-medium">Points à créditer</span>
                        <span className="text-2xl font-black text-primary tabular-nums">
                          +{preview.finalPoints} pts
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      size="lg"
                      onClick={onValidate}
                      disabled={isAuditor}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Award className="h-5 w-5" />
                      <span>{t("admin.points.validate")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={resetForm}
                      className="rounded-xl text-xs"
                    >
                      {t("admin.points.reset")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History for Selected Member */}
          {selected && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span>{t("admin.points.history")}</span>
                </CardTitle>
                <span className="text-xs font-semibold text-primary">
                  {history.filter((p) => p.status === "validated").length} activité(s) validée(s)
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    {t("admin.points.historyEmpty")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-surface/70 border-b border-border/50 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3.5 text-start">{t("admin.points.colDate")}</th>
                          <th className="py-2.5 px-3.5 text-start">{t("admin.points.colActivity")}</th>
                          <th className="py-2.5 px-3.5 text-start">{t("admin.points.colCategory")}</th>
                          <th className="py-2.5 px-3.5 text-start">{t("admin.points.colRole")}</th>
                          <th className="py-2.5 px-3.5 text-start">{t("admin.points.colPoints")}</th>
                          <th className="py-2.5 px-3.5 text-start">{t("admin.points.colStatus")}</th>
                          <th className="py-2.5 px-3.5 text-end">{t("admin.points.colActions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {history.map((p) => {
                          const role = getResponsibility(p.responsibilityId)
                          const duration = getDuration(p.durationId)

                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors ${
                                p.status === "cancelled"
                                  ? "bg-gray-50/70 opacity-60 line-through"
                                  : "hover:bg-surface/50"
                              }`}
                            >
                              <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground">
                                {p.activityDate}
                              </td>
                              <td className="py-3 px-3.5 font-medium text-foreground">
                                <div>{p.activityTitle}</div>
                                {p.authorName && (
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                                    <span>Validé par : {p.authorName} ({p.authorRole || "admin"})</span>
                                  </div>
                                )}
                                {p.changes.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground no-underline mt-0.5">
                                    {p.changes[p.changes.length - 1].adminNote}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-muted-foreground capitalize">
                                {p.categoryId}
                              </td>
                              <td className="py-3 px-3.5 text-muted-foreground">
                                {role ? role.label : "Participant"} ({duration ? duration.label : "2–4h"})
                              </td>
                              <td className="py-3 px-3.5 font-bold tabular-nums text-primary">
                                {p.status === "cancelled" ? "0 pts" : `+${p.pointsAwarded} pts`}
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    p.status === "validated"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {p.status === "validated" ? t("admin.points.validated") : t("admin.points.cancelled")}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-end whitespace-nowrap">
                                {!isAuditor && p.status === "validated" && (
                                  <div className="inline-flex items-center gap-1">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                      title={t("admin.points.modify")}
                                      onClick={() => {
                                        const next = window.prompt(t("admin.points.newPoints"), String(p.pointsAwarded))
                                        if (next === null || next.trim() === "") return
                                        const reason = window.prompt(t("admin.points.reason"), "Correction administrative")
                                        if (!reason) return
                                        const res = modifyParticipationPoints(p.id, Number(next), reason, currentUser)
                                        if (!res.ok) {
                                          setMessage({ type: "err", text: displayError(res.error, t) })
                                        } else {
                                          setMessage({ type: "ok", text: t("admin.points.modifiedOk") })
                                        }
                                      }}
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title={t("admin.points.cancelPart")}
                                      onClick={() => {
                                        const reason = window.prompt(t("admin.points.cancelReasonPrompt"))
                                        if (!reason) return
                                        const res = cancelParticipation(p.id, reason, currentUser)
                                        if (!res.ok) {
                                          setMessage({ type: "err", text: displayError(res.error, t) })
                                        } else {
                                          setMessage({ type: "ok", text: t("admin.points.cancelledOk") })
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Point Rules Configuration Modal */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Configuration des Barèmes Officiels de Points
              </h3>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Ces barèmes définissent le montant de points crédité automatiquement aux bénévoles lors de chaque étape validée. Toute modification est tracée au registre d'audit.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Inscription validée (pts)</label>
                <Input
                  type="number"
                  value={rulesForm.registrationValidated}
                  onChange={(e) =>
                    setRulesForm((prev) => ({ ...prev, registrationValidated: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-card border-input"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Présence confirmée (pts)</label>
                <Input
                  type="number"
                  value={rulesForm.presenceConfirmed}
                  onChange={(e) =>
                    setRulesForm((prev) => ({ ...prev, presenceConfirmed: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-card border-input"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Mission terminée (pts)</label>
                <Input
                  type="number"
                  value={rulesForm.missionCompleted}
                  onChange={(e) =>
                    setRulesForm((prev) => ({ ...prev, missionCompleted: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-card border-input"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Rapport accepté (pts)</label>
                <Input
                  type="number"
                  value={rulesForm.reportAccepted}
                  onChange={(e) =>
                    setRulesForm((prev) => ({ ...prev, reportAccepted: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-card border-input"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Bonus mission critique (pts)</label>
                <Input
                  type="number"
                  value={rulesForm.criticalMissionBonus}
                  onChange={(e) =>
                    setRulesForm((prev) => ({ ...prev, criticalMissionBonus: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-card border-input"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Bonus exceptionnel (pts)</label>
                <Input
                  type="number"
                  value={rulesForm.exceptionalMissionBonus}
                  onChange={(e) =>
                    setRulesForm((prev) => ({ ...prev, exceptionalMissionBonus: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-card border-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRulesModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  updatePointRulesConfig(
                    {
                      registrationValidated: Number(rulesForm.registrationValidated) || 5,
                      presenceConfirmed: Number(rulesForm.presenceConfirmed) || 10,
                      missionCompleted: Number(rulesForm.missionCompleted) || 30,
                      reportAccepted: Number(rulesForm.reportAccepted) || 15,
                      criticalMissionBonus: Number(rulesForm.criticalMissionBonus) || 10,
                      exceptionalMissionBonus: Number(rulesForm.exceptionalMissionBonus) || 20,
                    },
                    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined
                  )
                  setMessage({
                    type: "ok",
                    text: "Barèmes officiels de points mis à jour avec succès.",
                  })
                  setRulesModalOpen(false)
                }}
                className="rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Enregistrer les nouveaux barèmes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  )
}
