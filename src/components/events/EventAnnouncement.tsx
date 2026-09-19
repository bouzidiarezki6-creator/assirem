import { Link } from "react-router-dom"
import { ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import EventMetadata from "@/components/events/EventMetadata"
import type { EventItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useI18n } from "@/context/I18nProvider"

export type EventAnnouncementData = Pick<
  EventItem,
  | "id"
  | "title"
  | "description"
  | "date"
  | "location"
  | "institution"
  | "imageDataUrl"
  | "requiresRegistration"
>

type Props = {
  event: EventAnnouncementData
  preview?: boolean
  className?: string
  onCtaClick?: () => void
}

export default function EventAnnouncement({
  event,
  preview = false,
  className,
  onCtaClick,
}: Props) {
  const { t } = useI18n()
  const detailsHref = event.id ? `/events/${event.id}` : "#"
  const canNavigate = !preview && Boolean(event.id)
  const descriptionPreview =
    event.description.length > 160
      ? `${event.description.slice(0, 160).trim()}…`
      : event.description

  const ctaLabel = t("events.details")

  const cta = canNavigate ? (
    <Button asChild className="w-full sm:w-auto">
      <Link to={detailsHref}>{ctaLabel}</Link>
    </Button>
  ) : (
    <Button type="button" className="w-full sm:w-auto" onClick={onCtaClick}>
      {ctaLabel}
    </Button>
  )

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 bg-white shadow-soft interactive-lift",
        preview && "ring-2 ring-primary/25",
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
        {event.imageDataUrl ? (
          <img
            src={event.imageDataUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-50" aria-hidden />
            <span className="text-xs font-medium">{t("events.imagePlaceholder")}</span>
          </div>
        )}
        {preview && (
          <span className="absolute start-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-soft">
            {t("events.previewBadge")}
          </span>
        )}
      </div>

      <CardContent className="space-y-4 p-5">
        <h3 className="text-xl font-bold leading-snug text-foreground">
          {event.title || t("events.titlePlaceholder")}
        </h3>

        <EventMetadata event={event} compact />

        <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
          {descriptionPreview || t("events.descriptionPlaceholder")}
        </p>

        <div className="pt-1">{cta}</div>
      </CardContent>
    </Card>
  )
}
