import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  detectInitialLocale,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatNumber,
  getLocaleMeta,
  localizeContentField,
  translate,
  type Locale,
} from "@/i18n"
import { LOCALE_STORAGE_KEY } from "@/i18n/types"

type I18nContextValue = {
  locale: Locale
  dir: "rtl" | "ltr"
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  formatDate: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string
  formatDateLong: (date: string | Date | null | undefined) => string
  formatDateTime: (date: string | Date | null | undefined) => string
  formatNumber: (value: number) => string
  localizeField: <T extends Record<string, unknown>>(item: T, baseKey: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const DOCUMENT_TITLES: Record<Locale, string> = {
  ar: "يد في يد",
  fr: "Yed fel yed",
  en: "Yed fel yed",
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale())
  const meta = getLocaleMeta(locale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = meta.dir
    document.title = DOCUMENT_TITLES[locale]
  }, [locale, meta.dir])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  )

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: meta.dir,
      setLocale,
      t,
      formatDate: (date, options) => formatDate(date, locale, options),
      formatDateLong: (date) => formatDateLong(date, locale),
      formatDateTime: (date) => formatDateTime(date, locale),
      formatNumber: (n) => formatNumber(n, locale),
      localizeField: (item, baseKey) => localizeContentField(item, baseKey, locale),
    }),
    [locale, meta.dir, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
