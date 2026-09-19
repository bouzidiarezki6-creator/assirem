import { useState } from "react"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EventAnnouncement from "@/components/events/EventAnnouncement"
import EventForm, { type EventFormValues } from "@/components/events/EventForm"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

const emptyForm: EventFormValues = {
  title: "",
  description: "",
  date: "",
  location: "",
  institution: "",
  imageDataUrl: null,
  requiresRegistration: false,
  published: false,
}

export default function EventAdminPanel() {
  const { data, addEvent, updateEvent, deleteEvent } = useAppData()
  const { t } = useI18n()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EventFormValues>(emptyForm)
  const [flash, setFlash] = useState<string | null>(null)

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
      requiresRegistration: item.requiresRegistration ?? false,
      published: item.published,
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
    else {
      addEvent(payload)
    }
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
          <p className="text-sm text-gray-500">{t("admin.events.subtitle")}</p>
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

      <div className="space-y-3">
        {data.events.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">{t("admin.events.empty")}</p>
        )}
        {data.events.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="h-20 w-full sm:w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {item.imageDataUrl ? (
                <img src={item.imageDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                  {t("admin.common.noImage")}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{item.title}</p>
              <p className="text-xs text-gray-500">
                {item.date} · {item.location} ·{" "}
                <span className={item.published ? "text-primary font-medium" : "text-amber-700 font-medium"}>
                  {item.published ? t("admin.common.published") : t("admin.common.draft")}
                </span>
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(item.id)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-red-600"
                onClick={() => {
                  if (confirm(t("admin.events.deleteConfirm"))) deleteEvent(item.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
