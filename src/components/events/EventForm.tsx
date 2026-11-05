import { useRef, useState, type FormEvent, type ReactNode } from "react"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { processAnnouncementImage } from "@/lib/eventImage"
import type { EventItem, EventParticipationStatus } from "@/lib/types"
import { ACTIVITY_CATEGORIES, type CategoryId } from "@/lib/categories"
import { useI18n } from "@/context/I18nProvider"

export type EventFormValues = Omit<EventItem, "id">

type Props = {
  values: EventFormValues
  onChange: (values: EventFormValues) => void
  onSaveDraft: () => void
  onPublish: () => void
  onCancel?: () => void
  isEditing?: boolean
  busy?: boolean
}

const STATUS_OPTIONS: { id: EventParticipationStatus; labelFr: string; labelAr: string }[] = [
  { id: "open", labelFr: "Ouvert aux inscriptions", labelAr: "مفتوح للتسجيل" },
  { id: "upcoming", labelFr: "À venir (bientôt ouvert)", labelAr: "قريباً" },
  { id: "full", labelFr: "Complet (capacité atteinte)", labelAr: "مكتمل العدد" },
  { id: "in_progress", labelFr: "En cours d'exécution", labelAr: "جارٍ التنفيذ" },
  { id: "completed", labelFr: "Terminé / Clôturé", labelAr: "مكتمل" },
  { id: "cancelled", labelFr: "Annulé", labelAr: "ملغى" },
]

const DEMO_WILAYAS = [
  { code: 6, name: "06 — Béjaïa (بجاية)", communes: ["Béjaïa", "Akbou"] },
  { code: 19, name: "19 — Sétif (سطيف)", communes: ["Sétif", "El Eulma"] },
]

export default function EventForm({
  values,
  onChange,
  onSaveDraft,
  onPublish,
  onCancel,
  isEditing = false,
  busy = false,
}: Props) {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageError, setImageError] = useState("")
  const [imageBusy, setImageBusy] = useState(false)

  const selectedWilaya = DEMO_WILAYAS.find((w) => w.code === (values.wilayaCode || 6)) || DEMO_WILAYAS[0]

  function validate(requireImage: boolean): boolean {
    const next: Record<string, string> = {}
    if (!values.title.trim()) next.title = t("admin.eventForm.titleRequired")
    if (!values.date) next.date = t("admin.eventForm.dateRequired")
    else if (Number.isNaN(new Date(values.date).getTime())) next.date = t("admin.eventForm.dateInvalid")
    if (!values.location.trim()) next.location = t("admin.eventForm.locationRequired")
    if (!values.institution.trim()) next.institution = t("admin.eventForm.institutionRequired")
    if (!values.description.trim()) next.description = t("admin.eventForm.descriptionRequired")
    if (requireImage && !values.imageDataUrl) {
      next.image = t("admin.eventForm.imageRequired")
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setImageBusy(true)
    setImageError("")
    const result = await processAnnouncementImage(file)
    setImageBusy(false)
    if (!result.ok) {
      setImageError(t(result.error))
      return
    }
    onChange({ ...values, imageDataUrl: result.dataUrl })
    setErrors((e) => {
      const { image: _, ...rest } = e
      return rest
    })
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleDraft() {
    if (!validate(false)) return
    onSaveDraft()
  }

  function handlePublish(e: FormEvent) {
    e.preventDefault()
    if (!validate(true)) return
    onPublish()
  }

  return (
    <form className="space-y-5" onSubmit={handlePublish} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Titre */}
        <div className="md:col-span-2">
          <FieldBlock label={t("admin.fields.title")} error={errors.title}>
            <Input
              value={values.title}
              onChange={(e) => onChange({ ...values, title: e.target.value })}
              placeholder={t("admin.eventForm.titlePh")}
              required
            />
          </FieldBlock>
        </div>

        {/* Catégorie */}
        <FieldBlock label="Catégorie d'activité">
          <select
            value={values.categoryId || "environnemental"}
            onChange={(e) => onChange({ ...values, categoryId: e.target.value as CategoryId })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold shadow-xs focus:border-primary focus:outline-none"
          >
            {ACTIVITY_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.labelFr} / {cat.labelAr}
              </option>
            ))}
          </select>
        </FieldBlock>

        {/* Statut de participation */}
        <FieldBlock label="Statut de l'événement">
          <select
            value={values.status || "open"}
            onChange={(e) => onChange({ ...values, status: e.target.value as EventParticipationStatus })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold shadow-xs focus:border-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st.id} value={st.id}>
                {st.labelFr} ({st.labelAr})
              </option>
            ))}
          </select>
        </FieldBlock>

        {/* Date */}
        <FieldBlock label={t("admin.fields.date")} error={errors.date}>
          <Input
            type="date"
            value={values.date}
            onChange={(e) => onChange({ ...values, date: e.target.value })}
            required
          />
        </FieldBlock>

        {/* Horaires */}
        <FieldBlock label="Horaires (ex: 08:30 - 15:30)">
          <Input
            value={values.hours || ""}
            onChange={(e) => onChange({ ...values, hours: e.target.value })}
            placeholder="08:30 - 15:30"
          />
        </FieldBlock>

        {/* Wilaya (Béjaïa ou Sétif) */}
        <FieldBlock label="Wilaya (Périmètre officiel)">
          <select
            value={values.wilayaCode || 6}
            onChange={(e) => {
              const code = Number(e.target.value)
              const w = DEMO_WILAYAS.find((x) => x.code === code)
              onChange({
                ...values,
                wilayaCode: code,
                commune: w ? w.communes[0] : "Béjaïa",
              })
            }}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold shadow-xs focus:border-primary focus:outline-none"
          >
            {DEMO_WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
        </FieldBlock>

        {/* Commune */}
        <FieldBlock label="Commune (Béjaïa, Akbou, Sétif, El Eulma)">
          <select
            value={values.commune || selectedWilaya.communes[0]}
            onChange={(e) => onChange({ ...values, commune: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold shadow-xs focus:border-primary focus:outline-none"
          >
            {selectedWilaya.communes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldBlock>

        {/* Lieu / Adresse précise */}
        <FieldBlock label={t("admin.fields.location")} error={errors.location}>
          <Input
            value={values.location}
            onChange={(e) => onChange({ ...values, location: e.target.value })}
            placeholder={t("admin.eventForm.locationPh")}
            required
          />
        </FieldBlock>

        {/* Organisateur / Institution */}
        <FieldBlock label={t("admin.fields.institution")} error={errors.institution}>
          <Input
            value={values.institution}
            onChange={(e) => onChange({ ...values, institution: e.target.value })}
            placeholder={t("admin.eventForm.institutionPh")}
            required
          />
        </FieldBlock>

        {/* Capacité maximale */}
        <FieldBlock label="Capacité d'accueil (bénévoles)">
          <Input
            type="number"
            min="1"
            value={values.capacity || 100}
            onChange={(e) => onChange({ ...values, capacity: Number(e.target.value) })}
            placeholder="100"
          />
        </FieldBlock>

        {/* Bénévoles inscrits */}
        <FieldBlock label="Nombre d'inscrits actuels">
          <Input
            type="number"
            min="0"
            value={values.registeredCount || 0}
            onChange={(e) => onChange({ ...values, registeredCount: Number(e.target.value) })}
            placeholder="0"
          />
        </FieldBlock>
      </div>

      {/* Description détaillée */}
      <FieldBlock label={t("admin.fields.description")} error={errors.description}>
        <textarea
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          rows={6}
          required
          placeholder={t("admin.eventForm.descriptionPh")}
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </FieldBlock>

      {/* Conditions de participation */}
      <FieldBlock label="Conditions de participation (âge minimum, matériel requis, autorisations)">
        <textarea
          value={values.conditions || ""}
          onChange={(e) => onChange({ ...values, conditions: e.target.value })}
          rows={3}
          placeholder="Ex: Accessible à partir de 16 ans. Prévoir chaussures de marche fermées, gourde et protection solaire."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </FieldBlock>

      {/* Image de couverture */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("admin.eventForm.imageLabel")}</p>
        <p className="text-xs text-gray-500">{t("admin.eventForm.imageHint")}</p>

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
          {values.imageDataUrl ? (
            <div className="relative overflow-hidden rounded-lg border bg-white">
              <img
                src={values.imageDataUrl}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-white border text-gray-400 text-sm">
              {t("admin.common.noImageSelected")}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={imageBusy || busy}
              onClick={() => fileRef.current?.click()}
            >
              {values.imageDataUrl ? (
                <>
                  <Upload className="h-4 w-4" />
                  {t("admin.eventForm.replaceImage")}
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  {t("admin.eventForm.uploadImage")}
                </>
              )}
            </Button>
            {values.imageDataUrl && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600"
                disabled={busy}
                onClick={() => onChange({ ...values, imageDataUrl: null })}
              >
                <Trash2 className="h-4 w-4" />
                {t("admin.common.delete")}
              </Button>
            )}
          </div>

          {imageBusy && <p className="text-xs text-gray-500">{t("admin.common.imageOptimizing")}</p>}
          {(imageError || errors.image) && (
            <p className="text-xs text-red-600">{imageError || errors.image}</p>
          )}
        </div>
      </div>

      {/* Options complémentaires */}
      <div className="flex flex-wrap items-center gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={values.requiresRegistration}
            onChange={(e) => onChange({ ...values, requiresRegistration: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          {t("admin.eventForm.requiresReg")}
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-emerald-800">
          <input
            type="checkbox"
            checked={values.isDemo ?? false}
            onChange={(e) => onChange({ ...values, isDemo: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Donnée de Démonstration (DEMO)
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={handleDraft}
        >
          {t("admin.eventForm.saveDraft")}
        </Button>
        <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary/90">
          {isEditing ? t("admin.eventForm.publishEdit") : t("admin.eventForm.publish")}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            {t("admin.common.cancel")}
          </Button>
        )}
      </div>
    </form>
  )
}

function FieldBlock({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
