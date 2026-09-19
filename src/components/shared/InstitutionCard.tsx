import { Card, CardContent } from "../ui/card"
import { MapPin, Building2, Phone } from "lucide-react"

interface InstitutionCardProps {
  image?: string;
  name: string;
  type: string;
  location: string;
  phone?: string;
}

export default function InstitutionCard({ image, name, type, location, phone }: InstitutionCardProps) {
  return (
    <Card className="overflow-hidden interactive-lift border-border/60 group h-full">
      <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-primary/30" aria-hidden />
          </div>
        )}
        <div className="absolute top-4 end-4 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-soft">
          {type}
        </div>
      </div>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{name}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden />
            <span>{location}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary shrink-0" aria-hidden />
              <span dir="ltr">{phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
