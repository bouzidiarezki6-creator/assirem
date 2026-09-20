export type Locale = "ar" | "fr" | "en"

export type TranslationTree = {
  [key: string]: string | TranslationTree
}

export const LOCALES: {
  code: Locale
  label: string
  nativeLabel: string
  flag: string
  dir: "rtl" | "ltr"
  intl: string
}[] = [
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", dir: "ltr", intl: "fr-FR" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇩🇿", dir: "rtl", intl: "ar-DZ" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", dir: "ltr", intl: "en-GB" },
]

/** Default for Algeria youth platform */
export const DEFAULT_LOCALE: Locale = "ar"
export const LOCALE_STORAGE_KEY = "yfy-locale"
