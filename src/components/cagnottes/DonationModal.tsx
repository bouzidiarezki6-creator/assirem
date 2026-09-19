import { useEffect, useId, useState, type FormEvent } from "react"
import { CheckCircle2, CreditCard, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import type { Cagnotte } from "@/lib/types"
import {
  formatDzd,
  getCagnotteType,
  isValidCardNumber,
  maskCardDisplay,
  onlyDigits,
} from "@/lib/cagnottes"
import { cn } from "@/lib/utils"

type Props = {
  cagnotte: Cagnotte
  wilayaLabel: string
  open: boolean
  onClose: () => void
  associationId?: string | null
  associationName?: string | null
  associationSector?: string | null
}

export default function DonationModal({
  cagnotte,
  wilayaLabel,
  open,
  onClose,
  associationId = null,
  associationName = null,
  associationSector = null,
}: Props) {
  const { t, locale, dir } = useI18n()
  const { addDonation } = useAppData()
  const titleId = useId()
  const type = getCagnotteType(cagnotte.typeId)

  const [donorName, setDonorName] = useState("")
  const [amount, setAmount] = useState("1000")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setDonorName("")
    setAmount("1000")
    setCardNumber("")
    setExpiry("")
    setCvv("")
    setError("")
    setSubmitting(false)
    setSuccess(false)
  }, [open, cagnotte.id, associationId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  const intlLocale = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-DZ"
  const typeLabel = associationName || t(`cagnottes.types.${cagnotte.typeId}`)
  const subtitle = associationName
    ? associationSector
      ? t(`cagnottes.sectors.${associationSector}`)
      : t("cagnottes.types.associations")
    : type
      ? t(`cagnottes.typesDesc.${cagnotte.typeId}`)
      : ""

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 100) {
      setError(t("cagnottes.errors.amount"))
      return
    }
    if (donorName.trim().length < 2) {
      setError(t("cagnottes.errors.name"))
      return
    }
    if (!isValidCardNumber(cardNumber)) {
      setError(t("cagnottes.errors.card"))
      return
    }
    const exp = expiry.replace(/\D/g, "")
    if (exp.length !== 4) {
      setError(t("cagnottes.errors.expiry"))
      return
    }
    const mm = Number(exp.slice(0, 2))
    if (mm < 1 || mm > 12) {
      setError(t("cagnottes.errors.expiry"))
      return
    }
    if (cvv.replace(/\D/g, "").length < 3) {
      setError(t("cagnottes.errors.cvv"))
      return
    }

    setSubmitting(true)
    window.setTimeout(() => {
      const result = addDonation({
        cagnotteId: cagnotte.id,
        amount: amt,
        donorName,
        cardNumber,
        associationId,
        associationName,
      })
      setSubmitting(false)
      if ("error" in result) {
        const key = result.error
        setError(key.startsWith("cagnottes.") || key.startsWith("errors.") ? t(key) : key)
        return
      }
      setSuccess(true)
    }, 700)
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border/60 bg-white shadow-elevated",
          "max-h-[92vh] overflow-y-auto"
        )}
        dir={dir}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border/60 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0 text-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {wilayaLabel}
            </p>
            <h2 id={titleId} className="text-lg font-extrabold text-foreground truncate">
              {typeLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center success-pop">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-9 w-9 text-primary" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">{t("cagnottes.successTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("cagnottes.successHint")}</p>
              </div>
              <Button type="button" onClick={onClose} className="mt-2">
                {t("common.close")}
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="rounded-2xl bg-muted/50 border border-border/60 p-4 space-y-1 text-start">
                <p className="text-sm text-muted-foreground">{t("cagnottes.donateTo")}</p>
                <p className="font-bold text-foreground">{typeLabel}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground pt-1">{subtitle}</p>
                )}
              </div>

              <div className="space-y-2 text-start">
                <label className="text-sm font-semibold" htmlFor="donorName">
                  {t("cagnottes.donorName")}
                </label>
                <Input
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={t("cagnottes.donorNamePlaceholder")}
                  autoComplete="cc-name"
                  required
                />
              </div>

              <div className="space-y-2 text-start">
                <label className="text-sm font-semibold" htmlFor="amount">
                  {t("cagnottes.amount")}
                </label>
                <Input
                  id="amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(onlyDigits(e.target.value, 9))}
                  placeholder="1000"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("cagnottes.minAmount", { amount: formatDzd(100, intlLocale) })}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" aria-hidden />
                  {t("cagnottes.cardSection")}
                </div>

                <div className="space-y-2 text-start">
                  <label className="text-sm font-semibold" htmlFor="cardNumber">
                    {t("cagnottes.cardNumber")}
                  </label>
                  <Input
                    id="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={maskCardDisplay(cardNumber)}
                    onChange={(e) => setCardNumber(onlyDigits(e.target.value, 19))}
                    placeholder="XXXX XXXX XXXX XXXX"
                    dir="ltr"
                    className="font-mono tracking-wider"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 text-start">
                    <label className="text-sm font-semibold" htmlFor="expiry">
                      {t("cagnottes.expiry")}
                    </label>
                    <Input
                      id="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={
                        expiry.replace(/\D/g, "").length > 2
                          ? `${expiry.replace(/\D/g, "").slice(0, 2)}/${expiry.replace(/\D/g, "").slice(2, 4)}`
                          : expiry.replace(/\D/g, "")
                      }
                      onChange={(e) => setExpiry(onlyDigits(e.target.value, 4))}
                      placeholder="MM/YY"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-2 text-start">
                    <label className="text-sm font-semibold" htmlFor="cvv">
                      {t("cagnottes.cvv")}
                    </label>
                    <Input
                      id="cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(onlyDigits(e.target.value, 4))}
                      placeholder="•••"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
                  {t("cagnottes.securityNote")}
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive text-start" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? t("common.loading")
                  : t("cagnottes.pay", {
                      amount: formatDzd(Number(amount) || 0, intlLocale),
                    })}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
