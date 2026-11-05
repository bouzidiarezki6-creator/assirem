import { useState, useMemo } from "react"
import { Eye, Pencil, Plus, Trash2, Search, Sparkles, MapPin, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EventAnnouncement from "@/components/events/EventAnnouncement"
import EventForm, { type EventFormValues } from "@/components/events/EventForm"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { isDemoRecord } from "@/lib/storage"
import { padWilayaCode } from "@/lib/wilayas"
import type { EventParticipationStatus } from "@/lib/types"

const emptyForm: EventFormValues = {
  title: "",
  description: "",
  date: "",
  location: "",
  institution: "",
  imageDataUrl: null,
  categoryId: "environnemental",
  requiresRegistration: true,
  published: true,
  status: "open",
  hours: "09:00 - 16:00",
  capacity: 100,
  registeredCount: 0,
  wilayaCode: 6,
  commune: "Béjaïa",
  conditions: "",
  isDemo: false,
}

const STATUS_LABELS: Record<EventParticipationStatus, { label: string; color: string }> = {
  open: { label: "Ouvert", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  upcoming: { label: "À venir", color: "bg-blue-100 text-blue-800 border-blue-300" },
  full: { label: "Complet", color: "bg-amber-100 text-amber-800 border-amber-300" },
  in_progress: { label: "En cours", color: "bg-purple-100 text-purple-800 border-purple-300" },
  completed: { label: "Terminé", color: "bg-slate-100 text-slate-800 border-slate-300" },
  cancelled: { label: "Annulé", color: "bg-rose-100 text-rose-800 border-rose-300" },
}

export default function EventAdminPanel() {
  const { data, addEvent, updateEvent, deleteEvent } = useAppData()
  const { t } = useI18n()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EventFormValues>(emptyForm)
  const [flash, setFlash] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredEvents = useMemo(() => {
    return data.events.filter((item) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const full = `${item.title} ${item.location} ${item.institution} ${item.commune || ""}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      if (wilayaFilter !== "all" && item.wilayaCode !== Number(wilayaFilter)) {
        return false
      }
      if (statusFilter !== "all" && (item.status || "open") !== statusFilter) {
        return false
      }
      return true
    })
  }, [data.events, search, wilayaFilter, statusFilter])

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setFlash(null)
    setMode("form")
  }

  function openEdit(id: string) {
    const item = data.events.find((e) => e.id === id)
    if (!item) return
    setEditId(id)
    setForm({
      title: item.title,
      description: item.description,
      date: item.date,
      location: item.location,
      institution: item.institution,
      imageDataUrl: item.imageDataUrl ?? null,
      categoryId: item.categoryId ?? "environnemental",
      requiresRegistration: item.requiresRegistration ?? false,
      published: item.published,
      status: item.status ?? "open",
      hours: item.hours ?? "",
      capacity: item.capacity ?? 100,
      registeredCount: item.registeredCount ?? 0,
      wilayaCode: item.wilayaCode ?? 6,
      commune: item.commune ?? "Béjaïa",
      conditions: item.conditions ?? "",
      isDemo: item.isDemo ?? isDemoRecord(item),
    })
    setFlash(null)
    setMode("form")
  }

  function closeForm() {
    setMode("list")
    setEditId(null)
    setForm(emptyForm)
  }

  function saveDraft() {
    const payload = { ...form, published: false }
    if (editId) updateEvent(editId, payload)
    else addEvent(payload)
    setFlash(t("admin.events.draftSaved"))
    closeForm()
  }

  function publish() {
    const payload = { ...form, published: true }
    if (editId) updateEvent(editId, payload)
    else addEvent(payload)
    setFlash(t("admin.events.publishedFlash"))
    closeForm()
  }

  const previewEvent = {
    id: editId ?? "",
    ...form,
  }

  if (mode === "form") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {editId ? t("admin.events.edit") : t("admin.events.create")}
            </h1>
            <p className="text-sm text-gray-500">{t("admin.events.formHint")}</p>
          </div>
          <Button type="button" variant="outline" onClick={closeForm}>
            {t("admin.common.backToList")}
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("admin.common.form")}</CardTitle>
            </CardHeader>
            <CardContent>
              <EventForm
                values={form}
                onChange={setForm}
                isEditing={!!editId}
                onSaveDraft={saveDraft}
                onPublish={publish}
                onCancel={closeForm}
              />
            </CardContent>
          </Card>

          <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Eye className="h-4 w-4 text-primary" />
              {t("admin.common.previewShared")}
            </div>
            <EventAnnouncement event={previewEvent} preview />
            <p className="text-xs text-gray-500">
              {t("admin.common.statusPlanned")}{" "}
              <strong>
                {form.published ? t("admin.common.published") : t("admin.common.draftAfterSave")}
              </strong>
              {t("admin.common.publishHint")}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("admin.events.title")}</h1>
          <p className="text-sm text-gray-500">
            Gestion complète des événements, statuts, capacités et détails de participation.
          </p>
        </div>
        <Button type="button" className="bg-primary hover:bg-primary/90" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("admin.events.add")}
        </Button>
      </div>

      {flash && (
        <p className="rounded-lg border border-green-100 bg-primary/10 px-3 py-2 text-sm text-green-800">
          {flash}
        </p>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, commune, lieu, institution..."
            className="pl-9 text-xs h-9 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={wilayaFilter}
            onChange={(e) => setWilayaFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Toutes les wilayas</option>
            <option value="6">06 — Béjaïa</option>
            <option value="19">19 — Sétif & El Eulma</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="upcoming">À venir</option>
            <option value="full">Complet</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">{t("admin.events.empty")}</p>
        )}
        {filteredEvents.map((item) => {
          const stMeta = STATUS_LABELS[item.status || "open"] || STATUS_LABELS.open
          const isDemo = isDemoRecord(item)

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm hover:border-primary/40 transition-all"
            >
              <div className="h-24 w-full sm:w-36 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {item.imageDataUrl ? (
                  <img src={item.imageDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                    {t("admin.common.noImage")}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stMeta.color}`}>
                    {stMeta.label}
                  </span>

                  {item.categoryId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.categoryId}
                    </span>
                  )}

                  {isDemo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Sparkles className="h-3 w-3 text-emerald-600" /> DEMO
                    </span>
                  )}

                  <span className={`text-[10px] font-bold ${item.published ? "text-emerald-700" : "text-amber-700"}`}>
                    {item.published ? "● Publié" : "○ Brouillon"}
                  </span>
                </div>

                <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                  {item.title}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {item.date} {item.hours ? `(${item.hours})` : ""}
                  </span>

                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {item.wilayaCode ? `Wilaya ${padWilayaCode(item.wilayaCode)} · ` : ""}
                    {item.commune ? `${item.commune} — ` : ""}
                    {item.location}
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {item.registeredCount || 0} / {item.capacity || 100} bénévoles
                  </span>
                </div>
              </div>

              <div className="flex gap-1 shrink-0 self-end sm:self-center">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-1 text-xs font-bold"
                  onClick={() => openEdit(item.id)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(t("admin.events.deleteConfirm"))) deleteEvent(item.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
