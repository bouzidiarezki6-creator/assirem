import { useRef, useState, type ReactNode } from "react"
import { Eye, ImagePlus, Megaphone, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import InstitutionCard from "@/components/shared/InstitutionCard"
import ActivityCard from "@/components/shared/ActivityCard"
import NewsCard from "@/components/shared/NewsCard"
import { useAppData } from "@/context/DataProvider"
import { useGovernance } from "@/context/GovernanceContext"
import { useI18n } from "@/context/I18nProvider"
import { processAnnouncementImage } from "@/lib/eventImage"
import { arabicMonthParts } from "@/lib/dates"
import { ACTIVITY_CATEGORIES, type CategoryId } from "@/lib/categories"
import { isDemoRecord } from "@/lib/storage"
import type {
  Activity,
  Announcement,
  Institution,
  NewsArticle,
  EventParticipationStatus,
} from "@/lib/types"

/* ───────── shared shell ───────── */

function AdminEditorShell({
  title,
  subtitle,
  onBack,
  form,
  preview,
}: {
  title: string
  subtitle: string
  onBack: () => void
  form: ReactNode
  preview: ReactNode
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          {t("admin.common.backToList")}
        </Button>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.common.form")}</CardTitle>
          </CardHeader>
          <CardContent>{form}</CardContent>
        </Card>
        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Eye className="h-4 w-4 text-primary" />
            {t("admin.common.preview")}
          </div>
          <div className="rounded-xl border border-primary/20 bg-surface p-4">{preview}</div>
        </div>
      </div>
    </div>
  )
}

function ListHeader({
  title,
  subtitle,
  onAdd,
}: {
  title: string
  subtitle: string
  onAdd: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <Button type="button" className="bg-primary hover:bg-primary/90" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t("admin.common.add")}
      </Button>
    </div>
  )
}

function ImageField({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("admin.common.imageLabel")}</label>
      <p className="text-xs text-gray-500">{t("admin.common.imageHint")}</p>
      {value ? (
        <img src={value} alt="" className="aspect-video w-full rounded-lg object-cover border" />
      ) : (
        <div className="aspect-video rounded-lg border bg-gray-100 flex items-center justify-center text-xs text-gray-400">
          {t("admin.common.noImageSelected")}
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setBusy(true)
          setErr("")
          const res = await processAnnouncementImage(file)
          setBusy(false)
          if (!res.ok) setErr(t(res.error))
          else onChange(res.dataUrl)
          if (ref.current) ref.current.value = ""
        }}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}>
          {value ? <Upload className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          {value ? t("admin.common.replace") : t("admin.common.upload")}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => onChange(null)}>
            {t("admin.common.delete")}
          </Button>
        )}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
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

/* ───────── Institutions ───────── */

const emptyInst: Omit<Institution, "id"> = {
  name: "",
  type: "بيت الشباب",
  location: "",
  phone: "",
  imageDataUrl: null,
  published: true,
}

export function InstitutionAdminPanel() {
  const { t } = useI18n()
  const { data, addInstitution, updateInstitution, deleteInstitution } = useAppData()
  const { currentUser } = useGovernance()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyInst)

  const isTerritorialScoped =
    currentUser.role === "wilaya_admin" || currentUser.role === "local_coordinator"

  const scopedInstitutions = isTerritorialScoped && currentUser.wilayaCode
    ? data.institutions.filter((item) => item.wilayaCode === currentUser.wilayaCode)
    : data.institutions

  if (mode === "form") {
    return (
      <AdminEditorShell
        title={editId ? t("admin.institutions.edit") : t("admin.institutions.add")}
        subtitle={t("admin.institutions.formHint")}
        onBack={() => setMode("list")}
        form={
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.name.trim() || !form.location.trim() || !form.type.trim()) return
              if (editId) updateInstitution(editId, form)
              else addInstitution(form)
              setMode("list")
            }}
          >
            <Field label={t("admin.fields.name")}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.type")}>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.location")}>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.phone")}>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <ImageField value={form.imageDataUrl} onChange={(v) => setForm({ ...form, imageDataUrl: v })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              {t("admin.fields.published")}
            </label>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {t("admin.common.save")}
            </Button>
          </form>
        }
        preview={
          <div dir="rtl">
            <InstitutionCard
              name={form.name || t("admin.institutions.namePh")}
              type={form.type || t("admin.institutions.typePh")}
              location={form.location || t("admin.institutions.locationPh")}
              phone={form.phone || undefined}
              image={form.imageDataUrl || undefined}
            />
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title={t("admin.institutions.title")}
        subtitle={t("admin.institutions.subtitle")}
        onAdd={() => {
          setEditId(null)
          setForm(emptyInst)
          setMode("form")
        }}
      />
      <div className="space-y-3">
        {scopedInstitutions.map((item) => (
          <Row
            key={item.id}
            title={item.name}
            meta={`${item.type} · ${item.location} · ${item.published ? t("admin.common.published") : t("admin.common.hidden")}`}
            thumb={item.imageDataUrl}
            onEdit={() => {
              setEditId(item.id)
              setForm({
                name: item.name,
                type: item.type,
                location: item.location,
                phone: item.phone,
                imageDataUrl: item.imageDataUrl,
                published: item.published,
              })
              setMode("form")
            }}
            onDelete={() => {
              if (confirm(t("admin.common.deleteConfirm"))) deleteInstitution(item.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ───────── Activities ───────── */

const emptyAct = {
  title: "",
  description: "",
  date: "",
  location: "",
  institution: "",
  categoryId: "social" as CategoryId,
  imageDataUrl: null as string | null,
  published: true,
  status: "open" as EventParticipationStatus,
  hours: "09:00 - 15:00",
  capacity: 100,
  registeredCount: 0,
  wilayaCode: 6,
  commune: "Béjaïa",
  conditions: "",
  isDemo: false,
}

const DEMO_WILAYAS_ACT = [
  { code: 6, name: "06 — Béjaïa (بجاية)", communes: ["Béjaïa", "Akbou"] },
  { code: 19, name: "19 — Sétif (سطيف)", communes: ["Sétif", "El Eulma"] },
]

export function ActivityAdminPanel() {
  const { t, locale } = useI18n()
  const { data, addActivity, updateActivity, deleteActivity } = useAppData()
  const { currentUser } = useGovernance()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyAct)
  const parts = arabicMonthParts(form.date)

  const isTerritorialScoped =
    currentUser.role === "wilaya_admin" || currentUser.role === "local_coordinator"

  const scopedActivities = isTerritorialScoped && currentUser.wilayaCode
    ? data.activities.filter((item) => !item.wilayaCode || item.wilayaCode === currentUser.wilayaCode)
    : data.activities

  const selectedWilaya = DEMO_WILAYAS_ACT.find((w) => w.code === (form.wilayaCode || 6)) || DEMO_WILAYAS_ACT[0]

  function toActivity(): Omit<Activity, "id"> {
    return {
      ...form,
      day: parts.day,
      month: parts.month,
    }
  }

  const activeCat = ACTIVITY_CATEGORIES.find((c) => c.id === form.categoryId)
  const catLabel = activeCat ? (locale === "ar" ? activeCat.labelAr : activeCat.labelFr) : ""

  if (mode === "form") {
    return (
      <AdminEditorShell
        title={editId ? t("admin.activitiesPanel.edit") : t("admin.activitiesPanel.add")}
        subtitle={t("admin.activitiesPanel.formHint")}
        onBack={() => setMode("list")}
        form={
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.title.trim() || !form.date || !form.location.trim()) return
              const payload = toActivity()
              if (editId) updateActivity(editId, payload)
              else addActivity(payload)
              setMode("list")
            }}
          >
            <Field label={t("admin.fields.title")}>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t("categories.title") || "Catégorie"}>
                <select
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value as CategoryId })}
                >
                  {ACTIVITY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.labelFr} / {cat.labelAr}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut de l'activité">
                <select
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.status || "open"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventParticipationStatus })}
                >
                  <option value="open">Ouvert</option>
                  <option value="upcoming">À venir</option>
                  <option value="full">Complet</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t("admin.fields.date")}>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </Field>

              <Field label="Horaires (ex: 09:00 - 15:00)">
                <Input value={form.hours || ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="09:00 - 15:00" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Wilaya (Périmètre officiel)">
                <select
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.wilayaCode || 6}
                  onChange={(e) => {
                    const code = Number(e.target.value)
                    const w = DEMO_WILAYAS_ACT.find((x) => x.code === code)
                    setForm({
                      ...form,
                      wilayaCode: code,
                      commune: w ? w.communes[0] : "Béjaïa",
                    })
                  }}
                >
                  {DEMO_WILAYAS_ACT.map((w) => (
                    <option key={w.code} value={w.code}>{w.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Commune">
                <select
                  className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.commune || selectedWilaya.communes[0]}
                  onChange={(e) => setForm({ ...form, commune: e.target.value })}
                >
                  {selectedWilaya.communes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t("admin.fields.location")}>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </Field>

            <Field label={t("admin.fields.institution")}>
              <Input
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Capacité d'accueil">
                <Input
                  type="number"
                  min="1"
                  value={form.capacity || 100}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </Field>

              <Field label="Inscrits actuels">
                <Input
                  type="number"
                  min="0"
                  value={form.registeredCount || 0}
                  onChange={(e) => setForm({ ...form, registeredCount: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label={t("admin.fields.description")}>
              <textarea
                className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </Field>

            <Field label="Conditions de participation (matériel, âge, consignes)">
              <textarea
                className="w-full min-h-[70px] rounded-md border px-3 py-2 text-sm"
                value={form.conditions || ""}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                placeholder="Ex: Accessible à partir de 16 ans. Équipement fourni sur place."
              />
            </Field>

            <ImageField value={form.imageDataUrl} onChange={(v) => setForm({ ...form, imageDataUrl: v })} />

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                {t("admin.fields.published")}
              </label>

              <label className="flex items-center gap-2 text-sm text-emerald-800 font-semibold">
                <input
                  type="checkbox"
                  checked={form.isDemo ?? false}
                  onChange={(e) => setForm({ ...form, isDemo: e.target.checked })}
                />
                Donnée DEMO
              </label>
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {t("admin.common.save")}
            </Button>
          </form>
        }
        preview={
          <div dir="rtl" className="max-w-sm">
            <ActivityCard
              title={form.title || t("admin.activitiesPanel.titlePh")}
              description={form.description || t("admin.activitiesPanel.descPh")}
              day={parts.day || "—"}
              month={parts.month || "—"}
              location={form.location || t("admin.activitiesPanel.locationPh")}
              institution={form.institution || t("admin.activitiesPanel.institutionPh")}
              categoryName={catLabel}
              image={form.imageDataUrl || undefined}
            />
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title={t("admin.activitiesPanel.title")}
        subtitle={t("admin.activitiesPanel.subtitle")}
        onAdd={() => {
          setEditId(null)
          setForm(emptyAct)
          setMode("form")
        }}
      />
      <div className="space-y-3">
        {scopedActivities.map((item) => {
          const itemCat = ACTIVITY_CATEGORIES.find((c) => c.id === item.categoryId)
          const catText = itemCat ? (locale === "ar" ? itemCat.labelAr : itemCat.labelFr) : ""
          const isDemo = isDemoRecord(item)

          return (
            <Row
              key={item.id}
              title={item.title}
              meta={`${item.date} · ${item.commune || item.location}${catText ? ` · ${catText}` : ""}${isDemo ? " · [DEMO]" : ""} · ${item.published ? t("admin.common.published") : t("admin.common.hidden")}`}
              thumb={item.imageDataUrl}
              onEdit={() => {
                setEditId(item.id)
                setForm({
                  title: item.title,
                  description: item.description,
                  date: item.date,
                  location: item.location,
                  institution: item.institution,
                  categoryId: item.categoryId || "social",
                  imageDataUrl: item.imageDataUrl,
                  published: item.published,
                  status: item.status || "open",
                  hours: item.hours || "",
                  capacity: item.capacity || 100,
                  registeredCount: item.registeredCount || 0,
                  wilayaCode: item.wilayaCode || 6,
                  commune: item.commune || "Béjaïa",
                  conditions: item.conditions || "",
                  isDemo: item.isDemo ?? isDemo,
                })
                setMode("form")
              }}
              onDelete={() => {
                if (confirm(t("admin.common.deleteConfirm"))) deleteActivity(item.id)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}



/* ───────── Inscription announcements ───────── */

const emptyAnn: Omit<Announcement, "id"> = {
  title: "",
  description: "",
  openFrom: "",
  openUntil: "",
  maxSlots: 50,
  active: true,
}

export function AnnouncementAdminPanel() {
  const { t } = useI18n()
  const { data, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAppData()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyAnn)

  if (mode === "form") {
    return (
      <AdminEditorShell
        title={editId ? t("admin.announcements.edit") : t("admin.announcements.add")}
        subtitle={t("admin.announcements.formHint")}
        onBack={() => setMode("list")}
        form={
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.title.trim() || !form.openFrom || !form.openUntil) return
              if (editId) updateAnnouncement(editId, form)
              else addAnnouncement(form)
              setMode("list")
            }}
          >
            <Field label={t("admin.fields.title")}>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.description")}>
              <textarea
                className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("admin.fields.openFrom")}>
                <Input
                  type="date"
                  value={form.openFrom}
                  onChange={(e) => setForm({ ...form, openFrom: e.target.value })}
                  required
                />
              </Field>
              <Field label={t("admin.fields.openUntil")}>
                <Input
                  type="date"
                  value={form.openUntil}
                  onChange={(e) => setForm({ ...form, openUntil: e.target.value })}
                  required
                />
              </Field>
            </div>
            <Field label={t("admin.fields.maxSlots")}>
              <Input
                type="number"
                min={1}
                value={form.maxSlots}
                onChange={(e) => setForm({ ...form, maxSlots: Number(e.target.value) || 1 })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              {t("admin.fields.active")}
            </label>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {t("admin.common.save")}
            </Button>
          </form>
        }
        preview={
          <div dir="rtl">
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-right flex-1">
                    <CardTitle className="text-lg">{form.title || t("admin.announcements.titlePh")}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {form.description || t("admin.announcements.descPh")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-gray-500 text-right">
                {t("inscription.fromToSlots", {
                  from: form.openFrom || "—",
                  to: form.openUntil || "—",
                  slots: form.maxSlots,
                })}
              </CardContent>
            </Card>
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title={t("admin.announcements.title")}
        subtitle={t("admin.announcements.subtitle")}
        onAdd={() => {
          setEditId(null)
          setForm(emptyAnn)
          setMode("form")
        }}
      />
      <div className="space-y-3">
        {data.announcements.map((item) => (
          <Row
            key={item.id}
            title={item.title}
            meta={`${item.openFrom} → ${item.openUntil} · ${item.active ? t("admin.common.active") : t("admin.common.inactive")}`}
            onEdit={() => {
              setEditId(item.id)
              setForm({
                title: item.title,
                description: item.description,
                openFrom: item.openFrom,
                openUntil: item.openUntil,
                maxSlots: item.maxSlots,
                active: item.active,
              })
              setMode("form")
            }}
            onDelete={() => {
              if (confirm(t("admin.common.deleteConfirm"))) deleteAnnouncement(item.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ───────── News ───────── */

const NEWS_CATS = ["أخبار", "رياضة", "ثقافة", "صحة", "مقال مميز"]

const emptyNews: Omit<NewsArticle, "id"> = {
  title: "",
  description: "",
  category: "أخبار",
  date: new Date().toISOString().slice(0, 10),
  imageDataUrl: null,
  featured: false,
  published: true,
}

export function NewsAdminPanel() {
  const { t } = useI18n()
  const { data, addNews, updateNews, deleteNews } = useAppData()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyNews)

  const displayDate = form.date.replace(/-/g, "/")

  if (mode === "form") {
    return (
      <AdminEditorShell
        title={editId ? t("admin.newsAdmin.edit") : t("admin.newsAdmin.add")}
        subtitle={t("admin.newsAdmin.formHint")}
        onBack={() => setMode("list")}
        form={
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.title.trim() || !form.description.trim()) return
              if (editId) updateNews(editId, form)
              else addNews(form)
              setMode("list")
            }}
          >
            <Field label={t("admin.fields.title")}>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.category")}>
              <select
                className="h-9 w-full rounded-md border px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {NEWS_CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("admin.fields.date")}>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </Field>
            <Field label={t("admin.fields.description")}>
              <textarea
                className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </Field>
            <ImageField value={form.imageDataUrl} onChange={(v) => setForm({ ...form, imageDataUrl: v })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              {t("admin.fields.featured")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              {t("admin.fields.published")}
            </label>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {t("admin.common.save")}
            </Button>
          </form>
        }
        preview={
          <div dir="rtl" className="max-w-sm">
            <NewsCard
              category={form.category}
              date={displayDate}
              title={form.title || t("admin.newsAdmin.titlePh")}
              description={form.description || t("admin.newsAdmin.descPh")}
              image={form.imageDataUrl || undefined}
            />
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title={t("admin.newsAdmin.title")}
        subtitle={t("admin.newsAdmin.subtitle")}
        onAdd={() => {
          setEditId(null)
          setForm(emptyNews)
          setMode("form")
        }}
      />
      <div className="space-y-3">
        {data.news.map((item) => (
          <Row
            key={item.id}
            title={item.title}
            meta={`${item.category} · ${item.date} · ${item.featured ? `${t("admin.common.featured")} · ` : ""}${item.published ? t("admin.common.published") : t("admin.common.hidden")}`}
            thumb={item.imageDataUrl}
            onEdit={() => {
              setEditId(item.id)
              setForm({
                title: item.title,
                description: item.description,
                category: item.category,
                date: item.date,
                imageDataUrl: item.imageDataUrl,
                featured: item.featured,
                published: item.published,
              })
              setMode("form")
            }}
            onDelete={() => {
              if (confirm(t("admin.common.deleteConfirm"))) deleteNews(item.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function Row({
  title,
  meta,
  thumb,
  onEdit,
  onDelete,
}: {
  title: string
  meta: string
  thumb?: string | null
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
      {thumb !== undefined && (
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-gray-400">—</div>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{title}</p>
        <p className="text-xs text-gray-500">{meta}</p>
      </div>
      <Button type="button" size="icon" variant="ghost" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
