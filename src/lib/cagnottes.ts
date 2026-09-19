import type { LucideIcon } from "lucide-react"
import { Building2, Gift, GraduationCap, HandCoins, Moon } from "lucide-react"

export type CagnotteTypeId =
  | "aid_adha"
  | "aid_fitr"
  | "ramadan"
  | "rentree"
  | "associations"

export type CagnotteTypeDef = {
  id: CagnotteTypeId
  icon: LucideIcon
  /** Soft accent for card chrome */
  accent: string
  defaultGoal: number
}

export const CAGNOTTE_TYPES: CagnotteTypeDef[] = [
  {
    id: "aid_adha",
    icon: Gift,
    accent: "bg-amber-50 text-amber-700",
    defaultGoal: 500_000,
  },
  {
    id: "aid_fitr",
    icon: HandCoins,
    accent: "bg-emerald-50 text-emerald-700",
    defaultGoal: 300_000,
  },
  {
    id: "ramadan",
    icon: Moon,
    accent: "bg-indigo-50 text-indigo-700",
    defaultGoal: 400_000,
  },
  {
    id: "rentree",
    icon: GraduationCap,
    accent: "bg-sky-50 text-sky-700",
    defaultGoal: 350_000,
  },
  {
    id: "associations",
    icon: Building2,
    accent: "bg-rose-50 text-rose-700",
    defaultGoal: 250_000,
  },
]

export function getCagnotteType(id: CagnotteTypeId) {
  return CAGNOTTE_TYPES.find((t) => t.id === id)
}

export function formatDzd(amount: number, locale = "fr-DZ") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Luhn check for card number validation (UI only) */
export function isValidCardNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, "")
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function maskCardDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16)
  const parts = digits.match(/.{1,4}/g) ?? []
  return parts.join(" ")
}

export function onlyDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max)
}
