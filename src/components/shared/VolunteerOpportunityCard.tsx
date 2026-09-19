import { Building2, CalendarDays, MapPin, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCategoryById, type VolunteerOpportunity } from "@/lib/volunteer"
import { cn } from "@/lib/utils"
import { useI18n } from "@/context/I18nProvider"

type Props = {
  opportunity: VolunteerOpportunity
  className?: string
}

export default function VolunteerOpportunityCard({ opportunity, className }: Props) {
  const { t } = useI18n()
  const category = getCategoryById(opportunity.categoryId)
  const Icon = category?.icon
  const categoryLabel = category ? t(`volunteer.category.${category.id}`) : null

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 shadow-soft interactive-lift group h-full",
        className
      )}
    >
      <CardContent className="p-5 space-y-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            {category && categoryLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
                {categoryLabel}
              </span>
            )}
            <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
              {opportunity.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {opportunity.date}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{opportunity.description}</p>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t border-border/60">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
            {opportunity.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            {opportunity.institution}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("volunteer.places", { count: opportunity.slots })}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("volunteer.badge")}
          </span>
        </div>

        <Button asChild className="w-full">
          <Link to={`/inscription?volunteer=${opportunity.id}`}>{t("volunteer.apply")}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
