import { useMemo, useState, type ReactNode } from "react"
import { Award, CheckCircle2, History, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import VolunteerRecognitionBadge from "@/components/shared/VolunteerRecognitionBadge"
import { useAppData, type ValidateParticipationInput } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { VOLUNTEER_CATEGORIES } from "@/lib/volunteer"
import {
  ACTIVITY_TYPES,
  CATEGORY_COEFFICIENTS,
  DURATION_OPTIONS,
  RESPONSIBILITY_OPTIONS,
  getActivityType,
  getDuration,
  getResponsibility,
  type ActivityTypeId,
  type DurationId,
  type ResponsibilityId,
} from "@/lib/volunteerPoints"
import type { VolunteerCategoryId } from "@/lib/volunteer"
import type { VolunteerParticipation } from "@/lib/types"

type Props = {
  initialVolunteerId?: string | null
}

const emptyForm = {
  activityTitle: "",
  activityDate: new Date().toISOString().slice(0, 10),
  categoryId: "social" as VolunteerCategoryId,
  activityTypeId: "standard" as ActivityTypeId,
  durationId: "h4_8" as DurationId,
  responsibilityId: "participant" as ResponsibilityId,
}

function displayError(
  error: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  return error.startsWith("errors.") ? t(error) : error
}

export default function VolunteerPointsManager({ initialVolunteerId = null }: Props) {
  const { t } = useI18n()
  const {
    data,
    previewParticipationPoints,
    validateParticipation,
    cancelParticipation,
    modifyParticipationPoints,
    getVolunteerParticipations,
    getVolunteerStats,
  } = useAppData()

  const [query, setQuery] = useState("")
  const [volunteerId, setVolunteerId] = useState<string | null>(initialVolunteerId)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [modifyingId, setModifyingId] = useState<string | null>(null)
  const [modPoints, setModPoints] = useState("")
  const [modReason, setModReason] = useState("")

  const volunteers = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return data.registrants
    return data.registrants.filter((r) =>
      [r.lastName, r.firstName, r.nationalId, r.id].join(" ").toLowerCase().includes(needle)
    )
  }, [data.registrants, query])

  const selected = data.registrants.find((r) => r.id === volunteerId) ?? null
  const stats = volunteerId ? getVolunteerStats(volunteerId) : null
  const history = volunteerId ? getVolunteerParticipations(volunteerId) : []

  const preview = useMemo(() => {
    try {
      return previewParticipationPoints({
        volunteerId: volunteerId ?? "",
        ...form,
      })
    } catch {
      return null
    }
  }, [form, previewParticipationPoints, volunteerId])

  const previewLines = useMemo(() => {
    if (!preview) return []
    return [
      {
        label: t(`scoring.activityTypes.${form.activityTypeId}`),
        detail: `${preview.basePoints} pts`,
      },
      {
        label: t("scoring.lineCategory", {
          label: t(`volunteer.category.${form.categoryId}`),
        }),
        detail: `× ${preview.categoryCoefficient.toFixed(2)}`,
      },
      {
        label: t("scoring.lineDuration", {
          label: t(`scoring.durations.${form.durationId}`),
        }),
        detail: `× ${preview.durationMultiplier.toFixed(2)}`,
      },
      {
        label: t(`scoring.responsibilities.${form.responsibilityId}`),
        detail: `× ${preview.responsibilityMultiplier.toFixed(2)}`,
      },
    ]
  }, [form.activityTypeId, form.categoryId, form.durationId, form.responsibilityId, preview, t])

  function resetForm() {
    setForm(emptyForm)
    setMessage(null)
  }

  function onValidate() {
    if (!volunteerId) {
      setMessage({ type: "err", text: t("admin.points.selectRequired") })
      return
    }
    const confirmed = window.confirm(
      t("admin.points.confirmAward", {
        points: preview?.finalPoints ?? "?",
        title: form.activityTitle,
      })
    )
    if (!confirmed) return

    const payload: ValidateParticipationInput = { volunteerId, ...form }
    const result = validateParticipation(payload)
    if (!result.ok) {
      setMessage({ type: "err", text: displayError(result.error, t) })
      return
    }
    setMessage({
      type: "ok",
      text: t("admin.points.validatedOk", { points: result.participation.pointsAwarded }),
    })
    setForm((f) => ({ ...f, activityTitle: "" }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("admin.points.title")}</h1>
        <p className="text-sm text-gray-500 max-w-3xl">{t("admin.points.subtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Volunteer picker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("admin.points.stepMember")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder={t("admin.points.searchPh")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[420px] overflow-y-auto space-y-1">
              {volunteers.length === 0 && (
                <p className="text-sm text-gray-400 py-6 text-center">{t("admin.points.emptyMembers")}</p>
              )}
              {volunteers.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVolunteerId(v.id)
                    setMessage(null)
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    volunteerId === v.id
                      ? "border-primary bg-primary/10"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold">
                    {v.lastName} {v.firstName}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{v.id}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {t("admin.common.pts", { count: v.points ?? 0 })}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 min-w-0">
          {selected && stats && (
            <Card>
              <CardContent className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{t("admin.points.volunteer")}</p>
                  <p className="font-semibold text-lg">
                    {selected.lastName} {selected.firstName}
                  </p>
                  <p className="text-xs font-mono text-gray-500">{selected.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{t("admin.points.totalPoints")}</p>
                  <p className="text-2xl font-bold text-primary tabular-nums">{stats.totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{t("admin.points.activities")}</p>
                  <p className="text-2xl font-bold tabular-nums">{stats.activityCount}</p>
                  <p className="text-xs text-gray-500">
                    {t("admin.points.hoursVol", { count: stats.hoursVolunteered })}
                  </p>
                </div>
                <VolunteerRecognitionBadge points={stats.totalPoints} />
              </CardContent>
            </Card>
          )}

          {/* Validation form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                {t("admin.points.validateTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selected && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {t("admin.points.selectHint")}
                </p>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t("admin.points.activityTitle")}>
                  <Input
                    value={form.activityTitle}
                    disabled={!selected}
                    onChange={(e) => setForm({ ...form, activityTitle: e.target.value })}
                    placeholder={t("admin.points.activityTitlePh")}
                  />
                </Field>
                <Field label={t("admin.points.date")}>
                  <Input
                    type="date"
                    value={form.activityDate}
                    disabled={!selected}
                    onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                  />
                </Field>

                <Field label={t("admin.points.category")}>
                  <Select
                    disabled={!selected}
                    value={form.categoryId}
                    onChange={(v) => setForm({ ...form, categoryId: v as VolunteerCategoryId })}
                    options={VOLUNTEER_CATEGORIES.map((c) => ({
                      value: c.id,
                      label: `${t(`volunteer.category.${c.id}`)} (×${CATEGORY_COEFFICIENTS[c.id].toFixed(2)})`,
                    }))}
                  />
                </Field>

                <Field label={t("admin.points.activityType")}>
                  <Select
                    disabled={!selected}
                    value={form.activityTypeId}
                    onChange={(v) => setForm({ ...form, activityTypeId: v as ActivityTypeId })}
                    options={ACTIVITY_TYPES.map((a) => ({
                      value: a.id,
                      label: `${t(`scoring.activityTypes.${a.id}`)} (${t("admin.common.pts", { count: a.basePoints })})`,
                    }))}
                  />
                </Field>

                <Field label={t("admin.points.duration")}>
                  <Select
                    disabled={!selected}
                    value={form.durationId}
                    onChange={(v) => setForm({ ...form, durationId: v as DurationId })}
                    options={DURATION_OPTIONS.map((d) => ({
                      value: d.id,
                      label: `${t(`scoring.durations.${d.id}`)} (×${d.multiplier.toFixed(2)})`,
                    }))}
                  />
                </Field>

                <Field label={t("admin.points.responsibility")}>
                  <Select
                    disabled={!selected}
                    value={form.responsibilityId}
                    onChange={(v) =>
                      setForm({ ...form, responsibilityId: v as ResponsibilityId })
                    }
                    options={RESPONSIBILITY_OPTIONS.map((r) => ({
                      value: r.id,
                      label: `${t(`scoring.responsibilities.${r.id}`)} (×${r.multiplier.toFixed(2)})`,
                    }))}
                  />
                </Field>
              </div>

              {preview && (
                <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-800">{t("admin.points.calcPreview")}</p>
                  <div className="space-y-1 text-sm font-mono">
                    {previewLines.map((line) => (
                      <div key={line.label} className="flex justify-between gap-4">
                        <span className="text-gray-600 font-sans">{line.label}</span>
                        <span>{line.detail}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between gap-4 font-sans font-bold text-primary">
                      <span>{t("admin.points.total")}</span>
                      <span>{t("admin.common.pts", { count: preview.finalPoints })}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1">{preview.formula}</p>
                  <p className="text-[11px] text-gray-500">{t("admin.points.coeffNote")}</p>
                </div>
              )}

              {message && (
                <p
                  className={`text-sm rounded-lg px-3 py-2 border ${
                    message.type === "ok"
                      ? "bg-primary/10 border-green-100 text-green-800"
                      : "bg-red-50 border-red-100 text-red-700"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!selected || !form.activityTitle.trim()}
                  className="bg-primary hover:bg-primary/90"
                  onClick={onValidate}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("admin.points.validate")}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t("admin.points.reset")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("admin.points.history")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selected && (
                <p className="text-sm text-gray-400 py-8 text-center">
                  {t("admin.points.historySelect")}
                </p>
              )}
              {selected && history.length === 0 && (
                <p className="text-sm text-gray-400 py-8 text-center">
                  {t("admin.points.historyEmpty")}
                </p>
              )}
              {selected && history.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colDate")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colActivity")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colCategory")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colRole")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colDuration")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colPoints")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colStatus")}</th>
                        <th className="px-3 py-2 font-medium">{t("admin.points.colActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((p) => (
                        <HistoryRow
                          key={p.id}
                          participation={p}
                          isModifying={modifyingId === p.id}
                          modPoints={modPoints}
                          modReason={modReason}
                          onStartModify={() => {
                            setModifyingId(p.id)
                            setModPoints(String(p.pointsAwarded))
                            setModReason("")
                          }}
                          onCancelModify={() => setModifyingId(null)}
                          onModPoints={setModPoints}
                          onModReason={setModReason}
                          onConfirmModify={() => {
                            if (
                              !window.confirm(
                                t("admin.points.modifyConfirm", {
                                  from: p.pointsAwarded,
                                  to: modPoints,
                                })
                              )
                            )
                              return
                            const res = modifyParticipationPoints(
                              p.id,
                              Number(modPoints),
                              modReason
                            )
                            if (!res.ok) {
                              setMessage({ type: "err", text: displayError(res.error, t) })
                              return
                            }
                            setModifyingId(null)
                            setMessage({ type: "ok", text: t("admin.points.modifiedOk") })
                          }}
                          onCancelParticipation={() => {
                            const reason = window.prompt(t("admin.points.cancelReasonPrompt"))
                            if (!reason) return
                            const res = cancelParticipation(p.id, reason)
                            if (!res.ok) {
                              setMessage({ type: "err", text: displayError(res.error, t) })
                              return
                            }
                            setMessage({
                              type: "ok",
                              text: t("admin.points.cancelledOk"),
                            })
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function HistoryRow({
  participation: p,
  isModifying,
  modPoints,
  modReason,
  onStartModify,
  onCancelModify,
  onModPoints,
  onModReason,
  onConfirmModify,
  onCancelParticipation,
}: {
  participation: VolunteerParticipation
  isModifying: boolean
  modPoints: string
  modReason: string
  onStartModify: () => void
  onCancelModify: () => void
  onModPoints: (v: string) => void
  onModReason: (v: string) => void
  onConfirmModify: () => void
  onCancelParticipation: () => void
}) {
  const { t, formatDateTime } = useI18n()
  const role = getResponsibility(p.responsibilityId)
  const duration = getDuration(p.durationId)
  const activity = getActivityType(p.activityTypeId)

  function reasonText(reason: string) {
    return reason.startsWith("errors.") ? t(reason) : reason
  }

  return (
    <>
      <tr className="border-t align-top">
        <td className="px-3 py-2 whitespace-nowrap">{p.activityDate}</td>
        <td className="px-3 py-2">
          <p className="font-medium">{p.activityTitle}</p>
          <p className="text-xs text-gray-500">
            {activity ? t(`scoring.activityTypes.${activity.id}`) : null}
          </p>
        </td>
        <td className="px-3 py-2">{t(`volunteer.category.${p.categoryId}`)}</td>
        <td className="px-3 py-2">
          {role ? t(`scoring.responsibilities.${role.id}`) : null}
        </td>
        <td className="px-3 py-2">{duration ? t(`scoring.durations.${duration.id}`) : null}</td>
        <td className="px-3 py-2 font-semibold tabular-nums">
          {p.status === "cancelled" ? "—" : t("admin.common.pts", { count: p.pointsAwarded })}
          {p.changes.length > 0 && p.status === "validated" && (
            <p className="text-[10px] text-gray-400 font-normal">
              {t("admin.points.origPoints", { points: p.originalPoints })}
            </p>
          )}
        </td>
        <td className="px-3 py-2">
          <StatusBadge status={p.status} />
        </td>
        <td className="px-3 py-2">
          {p.status === "validated" && !isModifying && (
            <div className="flex flex-col gap-1">
              <Button type="button" size="sm" variant="outline" onClick={onStartModify}>
                {t("admin.points.modify")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={onCancelParticipation}
              >
                {t("admin.points.cancelPart")}
              </Button>
            </div>
          )}
        </td>
      </tr>
      {isModifying && (
        <tr className="bg-amber-50/60">
          <td colSpan={8} className="px-3 py-3">
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium">{t("admin.points.newPoints")}</label>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-28"
                  value={modPoints}
                  onChange={(e) => onModPoints(e.target.value)}
                />
              </div>
              <div className="space-y-1 flex-1 w-full">
                <label className="text-xs font-medium">{t("admin.points.reason")}</label>
                <Input
                  className="h-8"
                  value={modReason}
                  onChange={(e) => onModReason(e.target.value)}
                  placeholder={t("admin.points.reasonPh")}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" className="bg-primary hover:bg-primary/90" onClick={onConfirmModify}>
                  {t("admin.points.confirm")}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onCancelModify}>
                  {t("admin.points.cancelModify")}
                </Button>
              </div>
            </div>
            {p.changes.length > 0 && (
              <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                {p.changes.map((c) => (
                  <li key={c.id}>
                    {formatDateTime(c.at)} —{" "}
                    {t("admin.points.changeLog", {
                      prev: c.previousPoints,
                      next: c.newPoints,
                      reason: reasonText(c.reason) + (c.adminNote ? ` : ${c.adminNote}` : ""),
                    })}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
      {!isModifying && p.changes.length > 0 && (
        <tr>
          <td colSpan={8} className="px-3 pb-2">
            <ul className="text-[11px] text-gray-500 space-y-0.5">
              {p.changes.map((c) => (
                <li key={c.id}>
                  {t("admin.points.historyLog", {
                    prev: c.previousPoints,
                    next: c.newPoints,
                    reason: reasonText(c.reason) + (c.adminNote ? ` (${c.adminNote})` : ""),
                  })}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: VolunteerParticipation["status"] }) {
  const { t } = useI18n()
  if (status === "validated") {
    return (
      <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        {t("admin.points.validated")}
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
      {t("admin.points.cancelled")}
    </span>
  )
}
