import { useState } from "react"
import { Link2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/context/I18nProvider"
import { parseMapsLink } from "@/lib/sos"

type Props = {
  lat: string
  lng: string
  onLatChange: (v: string) => void
  onLngChange: (v: string) => void
  gpsBusy?: boolean
  onUseGps?: () => void
}

export default function SosGpsFields({
  lat,
  lng,
  onLatChange,
  onLngChange,
  gpsBusy = false,
  onUseGps,
}: Props) {
  const { t } = useI18n()
  const [link, setLink] = useState("")
  const [linkError, setLinkError] = useState("")
  const [linkOk, setLinkOk] = useState(false)

  const applyLink = () => {
    setLinkError("")
    setLinkOk(false)
    const parsed = parseMapsLink(link)
    if (!parsed) {
      setLinkError(t("sos.errors.mapLink"))
      return
    }
    onLatChange(parsed.lat.toFixed(6))
    onLngChange(parsed.lng.toFixed(6))
    setLinkOk(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("sos.fields.gps")}</p>
        {onUseGps && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={gpsBusy}
            onClick={onUseGps}
            className="gap-1.5"
          >
            <MapPin className="h-3.5 w-3.5" />
            {gpsBusy ? t("sos.gpsLocating") : t("sos.useMyGps")}
          </Button>
        )}
      </div>

      <div className="space-y-1.5 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3">
        <label className="text-xs font-semibold text-muted-foreground">
          {t("sos.fields.mapLink")}
        </label>
        <p className="text-[11px] text-muted-foreground">{t("sos.fields.mapLinkHint")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={link}
            onChange={(e) => {
              setLink(e.target.value)
              setLinkError("")
              setLinkOk(false)
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text")
              if (!pasted.trim()) return
              // Let the value update, then try parse on next tick with pasted text
              window.setTimeout(() => {
                const parsed = parseMapsLink(pasted)
                if (!parsed) return
                onLatChange(parsed.lat.toFixed(6))
                onLngChange(parsed.lng.toFixed(6))
                setLink(pasted.trim())
                setLinkOk(true)
                setLinkError("")
              }, 0)
            }}
            placeholder={t("sos.fields.mapLinkPlaceholder")}
            dir="ltr"
            className="h-11 flex-1 rounded-2xl font-mono text-xs sm:text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            className="gap-1.5 shrink-0"
            onClick={applyLink}
            disabled={!link.trim()}
          >
            <Link2 className="h-4 w-4" />
            {t("sos.applyMapLink")}
          </Button>
        </div>
        {linkError && <p className="text-xs text-rose-600">{linkError}</p>}
        {linkOk && !linkError && (
          <p className="text-xs font-medium text-emerald-700">{t("sos.mapLinkApplied")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 text-start">
          <label className="text-sm font-medium">{t("sos.fields.lat")}</label>
          <Input
            value={lat}
            onChange={(e) => onLatChange(e.target.value)}
            required
            dir="ltr"
            placeholder="36.75"
            className="h-11 rounded-2xl font-mono"
          />
        </div>
        <div className="space-y-1.5 text-start">
          <label className="text-sm font-medium">{t("sos.fields.lng")}</label>
          <Input
            value={lng}
            onChange={(e) => onLngChange(e.target.value)}
            required
            dir="ltr"
            placeholder="5.08"
            className="h-11 rounded-2xl font-mono"
          />
        </div>
      </div>
    </div>
  )
}
