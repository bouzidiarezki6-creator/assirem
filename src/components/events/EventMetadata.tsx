import { Building2, CalendarDays, MapPin } from "lucide-react"
import { useI18n } from "@/context/I18nProvider"
import type { EventItem } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  event: Pick<
    EventItem,
    "title" | "description" | "date" | "location" | "institution" | "imageDataUrl"
  >
  className?: string
  /** Compact for list cards */
  compact?: boolean
}

export default function EventMetadata({ event, className, compact = false }: Props) {
  const { formatDateLong } = useI18n()
  const textSize = compact ? "text-xs" : "text-sm"

  return (
    <div className={cn("flex flex-col gap-2 text-gray-600", textSize, className)}>
      <div className="inline-flex items-start gap-2">
        <CalendarDays className={cn("mt-0.5 shrink-0 text-primary", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        <span className="capitalize">{formatDateLong(event.date)}</span>
      </div>
      <div className="inline-flex items-start gap-2">
        <MapPin className={cn("mt-0.5 shrink-0 text-primary", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        <span>{event.location || "—"}</span>
      </div>
      {event.institution ? (
        <div className="inline-flex items-start gap-2">
          <Building2 className={cn("mt-0.5 shrink-0 text-primary", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
          <span>{event.institution}</span>
        </div>
      ) : null}
    </div>
  )
}
