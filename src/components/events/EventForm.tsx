import { useRef, useState, type FormEvent, type ReactNode } from "react"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { processAnnouncementImage } from "@/lib/eventImage"
import type { EventItem } from "@/lib/types"
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
        <FieldBlock label={t("admin.fields.title")} error={errors.title}>
          <Input
            value={values.title}
            onChange={(e) => onChange({ ...values, title: e.target.value })}
            placeholder={t("admin.eventForm.titlePh")}
            required
          />
        </FieldBlock>

        <FieldBlock label={t("admin.fields.date")} error={errors.date}>
          <Input
            type="date"
            value={values.date}
            onChange={(e) => onChange({ ...values, date: e.target.value })}
            required
          />
        </FieldBlock>

        <FieldBlock label={t("admin.fields.location")} error={errors.location}>
          <Input
            value={values.location}
            onChange={(e) => onChange({ ...values, location: e.target.value })}
            placeholder={t("admin.eventForm.locationPh")}
            required
          />
        </FieldBlock>

        <FieldBlock label={t("admin.fields.institution")} error={errors.institution}>
          <Input
            value={values.institution}
            onChange={(e) => onChange({ ...values, institution: e.target.value })}
            placeholder={t("admin.eventForm.institutionPh")}
            required
          />
        </FieldBlock>
      </div>

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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.requiresRegistration}
          onChange={(e) => onChange({ ...values, requiresRegistration: e.target.checked })}
        />
        {t("admin.eventForm.requiresReg")}
      </label>

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
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
