import { useMemo, useState } from "react"
import { HeartHandshake, MapPin } from "lucide-react"
import PageHeader from "@/components/shared/PageHeader"
import DonationModal from "@/components/cagnottes/DonationModal"
import AssociationPickerModal from "@/components/cagnottes/AssociationPickerModal"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { CAGNOTTE_TYPES, formatDzd, getCagnotteType } from "@/lib/cagnottes"
import {
  localizedOrgName,
  type AssociationSectorId,
} from "@/lib/associations"
import type { Association, Cagnotte } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

export default function Cagnottes() {
  const { data } = useAppData()
  const { t, locale, dir } = useI18n()
  const { wilayas, selectedCode, setSelectedCode, selected } = useLocationFilter()
  const [active, setActive] = useState<Cagnotte | null>(null)
  const [pickAssociations, setPickAssociations] = useState<Cagnotte | null>(null)
  const [selectedOrg, setSelectedOrg] = useState<Association | null>(null)

  const intlLocale = locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-DZ"

  const effectiveCode = selectedCode ?? 6

  const pots = useMemo(() => {
    return data.cagnottes
      .filter((c) => c.published && c.wilayaCode === effectiveCode)
      .sort((a, b) => {
        const ia = CAGNOTTE_TYPES.findIndex((t) => t.id === a.typeId)
        const ib = CAGNOTTE_TYPES.findIndex((t) => t.id === b.typeId)
        return ia - ib
      })
  }, [data.cagnottes, effectiveCode])

  const wilayaLabel = useMemo(() => {
    const w = wilayas.find((x) => x.code === effectiveCode) ?? selected
    if (!w) return padWilayaCode(effectiveCode)
    const name = locale === "ar" ? w.name_ar : w.name
    return `${padWilayaCode(w.code)} — ${name}`
  }, [effectiveCode, locale, selected, wilayas])

  const totalRaised = pots.reduce((s, p) => s + p.raisedAmount, 0)

  const openPot = (pot: Cagnotte) => {
    if (pot.typeId === "associations") {
      setPickAssociations(pot)
      setSelectedOrg(null)
      setActive(null)
      return
    }
    setPickAssociations(null)
    setSelectedOrg(null)
    setActive(pot)
  }

  const onSelectAssociation = (org: Association) => {
    if (!pickAssociations) return
    setSelectedOrg(org)
    setActive(pickAssociations)
    setPickAssociations(null)
  }

  const closeDonation = () => {
    setActive(null)
    setSelectedOrg(null)
  }

  return (
    <div className="page-shell section-gap">
      <PageHeader
        title={t("cagnottes.title")}
        description={t("cagnottes.subtitle")}
      />

      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 rounded-3xl border border-border/60 bg-white p-3 sm:p-4 shadow-soft">
        <div className="relative flex-1 max-w-xl mx-auto w-full">
          <MapPin
            className={cn(
              "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-primary",
              dir === "rtl" ? "right-3" : "left-3"
            )}
            aria-hidden
          />
          <select
            value={effectiveCode}
            onChange={(e) => setSelectedCode(Number(e.target.value))}
            className={cn(
              "h-11 w-full rounded-2xl border border-border bg-muted/30 py-2 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/25 focus:bg-white",
              dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"
            )}
            aria-label={t("cagnottes.chooseWilaya")}
          >
            {wilayas.map((w) => (
              <option key={w.code} value={w.code}>
                {padWilayaCode(w.code)} — {locale === "ar" ? w.name_ar : w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-primary/15 bg-primary/5 px-5 py-4 text-center space-y-1">
        <p className="text-sm font-semibold text-primary">{wilayaLabel}</p>
        <p className="text-sm text-muted-foreground">
          {t("cagnottes.totalRaised", { amount: formatDzd(totalRaised, intlLocale) })}
        </p>
        {!selectedCode && (
          <p className="text-xs text-muted-foreground pt-1">{t("cagnottes.defaultWilayaHint")}</p>
        )}
      </div>

      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-6">
        {pots.map((pot) => {
          const def = getCagnotteType(pot.typeId)
          const Icon = def?.icon ?? HeartHandshake
          const pct = pot.goalAmount > 0 ? Math.min(100, Math.round((pot.raisedAmount / pot.goalAmount) * 100)) : 0
          const isAssociations = pot.typeId === "associations"

          return (
            <article
              key={pot.id}
              className="flex flex-col rounded-3xl border border-border/60 bg-white p-5 shadow-soft interactive-lift"
            >
              <div
                className={cn(
                  "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
                  def?.accent ?? "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-lg font-extrabold text-foreground leading-snug">
                {t(`cagnottes.types.${pot.typeId}`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                {t(`cagnottes.typesDesc.${pot.typeId}`)}
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDzd(pot.raisedAmount, intlLocale)}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("cagnottes.goal", { amount: formatDzd(pot.goalAmount, intlLocale) })}
                </p>
              </div>

              <Button type="button" className="mt-5 w-full" onClick={() => openPot(pot)}>
                {isAssociations ? t("cagnottes.chooseAssociation") : t("cagnottes.donate")}
              </Button>
            </article>
          )
        })}
      </div>

      {pickAssociations && (
        <AssociationPickerModal
          open={!!pickAssociations}
          wilayaLabel={wilayaLabel}
          onClose={() => setPickAssociations(null)}
          onSelect={onSelectAssociation}
        />
      )}

      {active && (
        <DonationModal
          open={!!active}
          cagnotte={active}
          wilayaLabel={wilayaLabel}
          associationId={selectedOrg?.id ?? null}
          associationName={selectedOrg ? localizedOrgName(selectedOrg, locale) : null}
          associationSector={selectedOrg?.sectorId as AssociationSectorId | null}
          onClose={closeDonation}
        />
      )}
    </div>
  )
}
