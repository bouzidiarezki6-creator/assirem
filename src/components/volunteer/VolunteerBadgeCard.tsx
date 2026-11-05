import { useEffect, useState, useRef } from "react"
import QRCode from "qrcode"
import { Award, Calendar, Download, Printer, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/context/I18nProvider"
import { getLevelProgress } from "@/lib/levels"
import type { VolunteerAccount } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { buildQrPayload } from "@/lib/qr"
import { cn } from "@/lib/utils"

type Props = {
  volunteer: VolunteerAccount
  className?: string
}

export default function VolunteerBadgeCard({ volunteer, className }: Props) {
  const { formatDate } = useI18n()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const progress = getLevelProgress(volunteer.points || 0)

  // Safe QR payload containing NO sensitive personal data (no NIN, no password, no email, no phone)
  const safeQrPayload = buildQrPayload({
    id: volunteer.id,
    qrCode: volunteer.volunteerCode,
    lastName: volunteer.lastName,
    firstName: volunteer.firstName,
    nationalId: volunteer.volunteerCode,
  })

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(safeQrPayload, {
      width: 256,
      margin: 1,
      color: { dark: "#0f5132", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch((err) => {
        console.error("QR Code generation error:", err)
      })
    return () => {
      cancelled = true
    }
  }, [safeQrPayload])

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = `Badge-QR-${volunteer.volunteerCode}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Official Volunteer Badge Card */}
      <div
        ref={cardRef}
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-card via-card/95 to-surface p-6 shadow-card"
      >
        {/* Top Header Stamp */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <img src="/LOGO.png" alt="Yed fel yed" className="h-8 w-auto object-contain" />
            <div>
              <span className="block text-xs font-black uppercase tracking-wider text-primary">
                Yed fel yed · يد في يد
              </span>
              <span className="block text-[10px] text-muted-foreground font-semibold">
                Carte officielle de bénévole
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold">
            <ShieldCheck className="h-3 w-3" />
            Actif
          </span>
        </div>

        {/* Volunteer Identity & QR code */}
        <div className="flex flex-col sm:flex-row items-center gap-5 py-5">
          {/* Safe QR Code */}
          <div className="shrink-0 flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Badge QR ${volunteer.volunteerCode}`}
                className="h-28 w-28 rounded-2xl border border-primary/20 bg-white p-1.5 shadow-sm"
              />
            ) : (
              <div className="h-28 w-28 animate-pulse rounded-2xl bg-muted" />
            )}
            <span className="font-mono text-[10px] font-bold text-primary mt-1.5 tracking-wider">
              {volunteer.volunteerCode}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2 text-center sm:text-start flex-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Bénévole certifié
              </span>
              <h3 className="text-lg font-black text-foreground">
                {volunteer.firstName} {volunteer.lastName}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {volunteer.commune} · Wilaya {padWilayaCode(volunteer.wilayaCode)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                <Award className="h-3.5 w-3.5" />
                <span>Niveau {progress.level}</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-bold text-foreground">
                <Award className="h-3 w-3 text-primary" />
                {volunteer.points || 0} pts
              </span>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center justify-center sm:justify-start gap-1 pt-1">
              <Calendar className="h-3 w-3" />
              <span>Membre depuis le {formatDate(volunteer.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer verification note */}
        <div className="border-t border-border/50 pt-2.5 text-center text-[10px] text-muted-foreground">
          Badge personnel strictement individuel · Présenter lors des pointages de missions
        </div>
      </div>

      {/* Action buttons (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          className="rounded-2xl gap-2 text-xs font-bold"
        >
          <Download className="h-4 w-4 text-primary" />
          Télécharger le QR Code
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handlePrint}
          className="rounded-2xl gap-2 text-xs font-bold"
        >
          <Printer className="h-4 w-4 text-primary" />
          Imprimer mon badge
        </Button>
      </div>
    </div>
  )
}
