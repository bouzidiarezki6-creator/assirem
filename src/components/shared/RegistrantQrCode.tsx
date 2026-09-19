import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/context/I18nProvider"
import { buildQrPayload, downloadDataUrl } from "@/lib/qr"
import type { Registrant } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  registrant: Pick<Registrant, "id" | "qrCode" | "lastName" | "firstName" | "nationalId">
  size?: number
  className?: string
  showCode?: boolean
  downloadLabel?: string
}

export default function RegistrantQrCode({
  registrant,
  size = 140,
  className,
  showCode = true,
  downloadLabel,
}: Props) {
  const { t } = useI18n()
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const label = downloadLabel ?? t("qr.download")

  useEffect(() => {
    let cancelled = false
    const payload = buildQrPayload(registrant)
    QRCode.toDataURL(payload, {
      width: size * 2,
      margin: 2,
      color: { dark: "#1B7D67", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [registrant, size])

  const fileName = `QR-${registrant.qrCode}-${registrant.lastName}-${registrant.firstName}.png`

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {error && <p className="text-xs text-red-600">{t("errors.qrError")}</p>}
      {!error && dataUrl && (
        <img
          src={dataUrl}
          alt={`QR ${registrant.qrCode}`}
          width={size}
          height={size}
          className="rounded-md border bg-white p-1 shadow-sm"
        />
      )}
      {!error && !dataUrl && (
        <div
          className="animate-pulse rounded-md border bg-gray-100"
          style={{ width: size, height: size }}
        />
      )}
      {showCode && (
        <p className="font-mono text-[11px] font-semibold tracking-wide text-primary">
          {registrant.qrCode}
        </p>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!dataUrl}
        className="gap-1.5"
        onClick={() => {
          if (dataUrl) downloadDataUrl(dataUrl, fileName)
        }}
      >
        <Download className="h-3.5 w-3.5" />
        {label}
      </Button>
    </div>
  )
}
