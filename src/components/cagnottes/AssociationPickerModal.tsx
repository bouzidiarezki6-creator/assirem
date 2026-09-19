import { useEffect, useId, useMemo, useState } from "react"
import { ArrowLeft, Building2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import {
  ASSOCIATION_SECTORS,
  formatCcpDisplay,
  getAssociationSector,
  type AssociationSectorId,
} from "@/lib/associations"
import type { Association } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  wilayaLabel: string
  onClose: () => void
  onSelect: (org: Association) => void
}

export default function AssociationPickerModal({
  open,
  wilayaLabel,
  onClose,
  onSelect,
}: Props) {
  const { data } = useAppData()
  const { t, dir } = useI18n()
  const titleId = useId()
  const [sector, setSector] = useState<AssociationSectorId | "all">("all")

  useEffect(() => {
    if (!open) return
    setSector("all")
  }, [open])

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

  const published = useMemo(
    () => data.associations.filter((a) => a.published),
    [data.associations]
  )

  const filtered = useMemo(() => {
    if (sector === "all") return published
    return published.filter((o) => o.sectorId === sector)
  }, [published, sector])

  if (!open) return null

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
        className="relative z-10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-border/60 bg-white shadow-elevated max-h-[92vh] overflow-hidden flex flex-col"
        dir={dir}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-white px-5 py-4">
          <div className="min-w-0 text-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {wilayaLabel}
            </p>
            <h2 id={titleId} className="text-lg font-extrabold text-foreground">
              {t("cagnottes.associationsTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("cagnottes.associationsHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 overflow-x-auto">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => setSector("all")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                sector === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t("cagnottes.allSectors")}
            </button>
            {ASSOCIATION_SECTORS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSector(s.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  sector === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <s.icon className="h-3.5 w-3.5" aria-hidden />
                {t(`cagnottes.sectors.${s.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">{t("common.noResults")}</p>
          ) : (
            filtered.map((org) => {
              const sectorDef = getAssociationSector(org.sectorId)
              const SectorIcon = sectorDef?.icon ?? Building2
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => onSelect(org)}
                  className="w-full flex items-start gap-4 rounded-2xl border border-border/70 bg-white p-4 text-start shadow-soft transition-all hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl",
                      !org.logoDataUrl && (sectorDef?.accent ?? "bg-primary/10 text-primary")
                    )}
                  >
                    {org.logoDataUrl ? (
                      <img src={org.logoDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <SectorIcon className="h-6 w-6" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground">{org.name}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                        {t(`cagnottes.sectors.${org.sectorId}`)}
                      </span>
                    </div>
                    {org.ccpAccount && (
                      <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                        CCP {formatCcpDisplay(org.ccpAccount)}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-primary pt-1">
                      {t("cagnottes.selectAssociation")} →
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="border-t border-border/60 px-5 py-3">
          <Button type="button" variant="ghost" className="w-full gap-2" onClick={onClose}>
            <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
            {t("common.back")}
          </Button>
        </div>
      </div>
    </div>
  )
}
