import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { getAssociationSector, formatCcpDisplay } from "@/lib/associations"
import { HeartHandshake } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Associations() {
  const { data } = useAppData()
  const { t, dir } = useI18n()

  const publishedAssocs = data.associations.filter((a) => a.published)

  return (
    <div className="w-full">
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-surface py-16 text-center">
        <div className="content-width">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <div className="mb-6 rounded-full bg-primary/10 p-4 shadow-inner">
              <HeartHandshake className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {t("nav.associations") || "Associations Partenaires"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Découvrez les associations partenaires qui œuvrent pour le bien-être de notre communauté.
            </p>
          </div>
        </div>
      </section>

      <section className="content-width py-12">
        {publishedAssocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30 p-12 text-center">
            <HeartHandshake className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground">Aucune association</h3>
            <p className="mt-2 text-muted-foreground">Les associations apparaîtront ici prochainement.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publishedAssocs.map((assoc) => {
              const sectorDef = getAssociationSector(assoc.sectorId)
              const SectorIcon = sectorDef?.icon || HeartHandshake

              return (
                <div
                  key={assoc.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-border/50 transition-all hover:shadow-hover hover:ring-primary/20"
                >
                  <div className="flex h-32 w-full items-center justify-center bg-muted/30">
                    {assoc.logoDataUrl ? (
                      <img
                        src={assoc.logoDataUrl}
                        alt={assoc.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HeartHandshake className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-bold text-foreground leading-tight" dir={dir}>
                        {assoc.name}
                      </h3>
                      {sectorDef && (
                        <div
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                            sectorDef.accent
                          )}
                          title="Secteur"
                        >
                          <SectorIcon className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Compte CCP
                      </span>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {formatCcpDisplay(assoc.ccpAccount)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
