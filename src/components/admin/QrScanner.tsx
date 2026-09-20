import { useEffect, useId, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Camera, CameraOff, ImagePlus, SwitchCamera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/context/I18nProvider"

type Facing = "environment" | "user"

type Props = {
  onScan: (text: string) => void
  active?: boolean
}

export default function QrScanner({ onScan, active = true }: Props) {
  const { t } = useI18n()
  const regionId = useId().replace(/:/g, "")
  const readerId = `yfy-qr-reader-${regionId}`

  const [running, setRunning] = useState(false)
  const [facing, setFacing] = useState<Facing>("environment")
  const [error, setError] = useState("")
  const [galleryBusy, setGalleryBusy] = useState(false)
  const [restartToken, setRestartToken] = useState(0)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const fileInputRef = useRef<HTMLInputElement>(null)
  onScanRef.current = onScan

  useEffect(() => {
    if (!active) {
      void stopScanner()
      return
    }

    let cancelled = false

    async function start() {
      setError("")
      await stopScanner()
      try {
        const scanner = new Html5Qrcode(readerId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: facing },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            onScanRef.current(decoded)
          },
          () => undefined
        )
        if (!cancelled) setRunning(true)
      } catch {
        if (!cancelled) {
          setError(t("admin.scanner.cameraError"))
          setRunning(false)
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      void stopScanner()
    }
  }, [active, facing, readerId, restartToken, t])

  async function stopScanner() {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) {
      setRunning(false)
      return
    }
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } catch {
      // ignore cleanup errors
    }
    setRunning(false)
  }

  function flipCamera() {
    setFacing((prev) => (prev === "environment" ? "user" : "environment"))
  }

  async function onGalleryFile(file: File | undefined) {
    if (!file) return
    setGalleryBusy(true)
    setError("")
    const shouldRestart = active

    try {
      if (scannerRef.current?.isScanning) {
        await stopScanner()
      }

      const temp = new Html5Qrcode(readerId)
      const decoded = await temp.scanFile(file, true)
      try {
        temp.clear()
      } catch {
        // ignore
      }
      onScanRef.current(decoded)
    } catch {
      setError(t("admin.scanner.noQrInImage"))
      if (shouldRestart) setRestartToken((tok) => tok + 1)
    } finally {
      setGalleryBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {running ? (
            <>
              <Camera className="h-4 w-4 text-primary" />
              {facing === "environment" ? t("admin.scanner.rear") : t("admin.scanner.front")}
            </>
          ) : (
            <>
              <CameraOff className="h-4 w-4 text-gray-400" />
              {t("admin.scanner.stopped")}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!active || galleryBusy}
            onClick={flipCamera}
            title={t("admin.scanner.flipTitle")}
          >
            <SwitchCamera className="h-4 w-4" />
            {facing === "environment" ? t("admin.scanner.selfie") : t("admin.scanner.backCam")}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={galleryBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {galleryBusy ? t("admin.scanner.analyzing") : t("admin.scanner.gallery")}
          </Button>

          {running && (
            <Button type="button" size="sm" variant="outline" onClick={() => void stopScanner()}>
              {t("admin.scanner.stop")}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onGalleryFile(e.target.files?.[0])}
      />

      <div
        id={readerId}
        className="overflow-hidden rounded-xl border bg-black/90 min-h-[240px] [&_video]:mx-auto [&_video]:max-h-[320px] [&_img]:mx-auto [&_img]:max-h-[320px]"
      />

      <p className="text-xs text-gray-500">{t("admin.scanner.hint")}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
