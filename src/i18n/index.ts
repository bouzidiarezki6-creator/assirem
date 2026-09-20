import fr from "./locales/fr/common.json"
import en from "./locales/en/common.json"
import ar from "./locales/ar/common.json"
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationTree,
} from "./types"

export const dictionaries: Record<Locale, TranslationTree> = {
  fr: fr as TranslationTree,
  en: en as TranslationTree,
  ar: ar as TranslationTree,
}

export { LOCALES, DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale, type TranslationTree }

export function getLocaleMeta(locale: Locale) {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
}

export function getIntlLocale(locale: Locale): string {
  return getLocaleMeta(locale).intl
}

function getByPath(tree: TranslationTree, path: string): string | undefined {
  const parts = path.split(".")
  let cur: string | TranslationTree | undefined = tree
  for (const part of parts) {
    if (!cur || typeof cur === "string") return undefined
    cur = cur[part]
  }
  return typeof cur === "string" ? cur : undefined
}

export function hasTranslation(locale: Locale, key: string): boolean {
  return Boolean(getByPath(dictionaries[locale], key) ?? getByPath(dictionaries[DEFAULT_LOCALE], key))
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw =
    getByPath(dictionaries[locale], key) ??
    getByPath(dictionaries[DEFAULT_LOCALE], key) ??
    key

  if (!vars) return raw
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
    raw
  )
}

export function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) || localStorage.getItem("odej-locale")
    if (saved === "fr" || saved === "en" || saved === "ar") return saved
    // migrate former kabyle preference
    if (saved === "kab") return "ar"
  } catch {
    // ignore
  }
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : ""
  if (nav.startsWith("fr")) return "fr"
  if (nav.startsWith("en")) return "en"
  return "ar"
}

export function formatDate(
  dateStr: string | Date | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return "—"
  const d =
    dateStr instanceof Date
      ? dateStr
      : new Date(
          typeof dateStr === "string" && dateStr.length === 10
            ? `${dateStr}T12:00:00`
            : dateStr
        )
  if (Number.isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "—"
  return d.toLocaleDateString(getIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  })
}

export function formatDateLong(dateStr: string | Date | null | undefined, locale: Locale): string {
  return formatDate(dateStr, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDateTime(dateStr: string | Date | null | undefined, locale: Locale): string {
  if (!dateStr) return "—"
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr)
  if (Number.isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "—"
  return d.toLocaleString(getIntlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value)
}

/**
 * Resolve multilingual CMS fields without inventing translations.
 * Prefers title_fr / title_en / title_ar when present, else falls back to `title`.
 */
export function localizeContentField<T extends Record<string, unknown>>(
  item: T,
  baseKey: string,
  locale: Locale
): string {
  const candidates = [`${baseKey}_${locale}`, `${baseKey}${locale[0].toUpperCase()}${locale.slice(1)}`, baseKey]
  for (const key of candidates) {
    const val = item[key]
    if (typeof val === "string" && val.trim()) return val
  }
  return ""
}
