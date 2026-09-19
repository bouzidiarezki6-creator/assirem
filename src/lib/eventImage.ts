/** Compress and normalize announcement images as data URLs for local storage. */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_INPUT_BYTES = 5 * 1024 * 1024
const MAX_WIDTH = 1600
const JPEG_QUALITY = 0.82

export type ImageProcessResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string }

export function validateAnnouncementImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "errors.imageUnsupported"
  }
  if (file.size > MAX_INPUT_BYTES) {
    return "errors.imageTooLarge"
  }
  return null
}

export async function processAnnouncementImage(file: File): Promise<ImageProcessResult> {
  const validationError = validateAnnouncementImageFile(file)
  if (validationError) return { ok: false, error: validationError }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_WIDTH / bitmap.width)
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return { ok: false, error: "errors.imageProcessFailed" }

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY)
    return { ok: true, dataUrl }
  } catch {
    return { ok: false, error: "errors.imageProcessError" }
  }
}

export function formatEventDate(dateStr: string, locale = "fr-FR"): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : ""))
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
