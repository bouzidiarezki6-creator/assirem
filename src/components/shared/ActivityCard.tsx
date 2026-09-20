import { useState } from "react"
import { Card, CardContent } from "../ui/card"
import { MapPin, Building2, ImageIcon } from "lucide-react"

interface ActivityCardProps {
  image?: string;
  day: string;
  month: string;
  title: string;
  description: string;
  location: string;
  institution: string;
  categoryName?: string;
}

export default function ActivityCard({ image, day, month, title, description, location, institution, categoryName }: ActivityCardProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(image && !imgError)

  return (
    <Card className="overflow-hidden border-border/60 relative group h-full interactive-lift">
      <div className="absolute top-4 end-4 z-10 bg-primary text-primary-foreground w-12 h-14 rounded-2xl flex flex-col items-center justify-center shadow-soft font-bold leading-none">
        <span className="text-xl">{day}</span>
        <span className="text-[10px] uppercase tracking-wide opacity-90">{month}</span>
      </div>
      {categoryName && (
        <div className="absolute top-4 start-4 z-10 bg-white/95 backdrop-blur-md text-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-soft border border-border/60">
          {categoryName}
        </div>
      )}
      <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden rounded-t-2xl">
        {hasImage ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-muted group-hover:scale-105 transition-transform duration-500 flex flex-col items-center justify-center gap-1.5 text-primary/40">
            <ImageIcon className="h-8 w-8" />
            <span className="text-[11px] font-semibold tracking-wider uppercase opacity-70">Yed fel yed</span>
          </div>
        )}
      </div>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/60">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span>{institution}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
