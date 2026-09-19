import type { Locale } from "@/i18n"
import { getIntlLocale } from "@/i18n"

/** Locale-aware month short label for activity card badges */
export function monthParts(dateStr: string, locale: Locale = "ar") {
  const d = new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : ""))
  if (Number.isNaN(d.getTime())) return { day: "", month: "" }
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString(getIntlLocale(locale), { month: "short" }),
  }
}

/** @deprecated Prefer monthParts(date, locale) */
export function arabicMonthParts(dateStr: string) {
  return monthParts(dateStr, "ar")
}
