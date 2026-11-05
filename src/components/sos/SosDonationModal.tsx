import { useState, type FormEvent } from "react"
import { CheckCircle2, HeartHandshake, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import type { SosMaterialNeed } from "@/lib/types"

type Props = {
  need: SosMaterialNeed | null
  onClose: () => void
  onSuccess?: () => void
}

export default function SosDonationModal({ need, onClose, onSuccess }: Props) {
  const { t } = useI18n()
  const { pledgeSosMaterialDonation } = useAppData()

  const [donorName, setDonorName] = useState("")
  const [donorPhone, setDonorPhone] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!need) return null

  const remaining = Math.max(0, need.requiredQuantity - (need.receivedQuantity || 0))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")

    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setError(t("sos.errors.quantity"))
      return
    }

    const res = pledgeSosMaterialDonation({
      materialNeedId: need.id,
      donorName,
      donorPhone,
      donorEmail,
      wilayaCode: need.wilayaCode,
      quantityPledged: qty,
      note,
    })

    if (!res.ok) {
      setError(t(res.error))
      return
    }

    setSuccess(true)
    if (onSuccess) onSuccess()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground">
              {t("sos.material.pledgeSuccess")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {need.title} — {quantity} {need.unit}
            </p>
            <Button type="button" onClick={onClose} className="rounded-2xl px-6 mt-4">
              {t("common.close")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">
                  {t("sos.material.pledgeModalTitle")}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{need.title}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground flex justify-between items-center">
              <span>{t("sos.material.remaining", { count: remaining, unit: need.unit })}</span>
              <span className="font-semibold text-foreground">
                {need.receivedQuantity} / {need.requiredQuantity} {need.unit}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.material.pledgeQuantity")} ({need.unit})
                </label>
                <Input
                  type="number"
                  min="1"
                  max={remaining > 0 ? remaining : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`Ex: ${Math.min(50, remaining || 10)}`}
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.material.donorName")}
                </label>
                <Input
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Nom complet ou Association..."
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.material.donorPhone")}
                </label>
                <Input
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="05 / 06 / 07..."
                  required
                  dir="ltr"
                  className="rounded-2xl mt-1 h-11 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.material.donorEmail")}
                </label>
                <Input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="nom@exemple.dz"
                  dir="ltr"
                  className="rounded-2xl mt-1 h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.material.donorNote")}
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Lieu de dépôt prévu, créneau de livraison..."
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-2xl h-11"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1 rounded-2xl h-11">
                {t("sos.material.pledgeSubmit")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

