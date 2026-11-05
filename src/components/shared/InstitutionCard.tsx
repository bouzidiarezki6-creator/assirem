import { Card, CardContent } from "../ui/card"
import { MapPin, Building2, Phone, Mail, Clock, ShieldCheck, HelpCircle } from "lucide-react"

interface InstitutionCardProps {
  image?: string;
  name: string;
  type: string;
  location: string;
  phone?: string;
  email?: string;
  hours?: string;
  isVerified?: boolean;
  domains?: string[];
}

export default function InstitutionCard({
  image,
  name,
  type,
  location,
  phone,
  email,
  hours,
  isVerified = true,
  domains,
}: InstitutionCardProps) {
  return (
    <Card className="overflow-hidden interactive-lift border-border/60 group h-full flex flex-col justify-between">
      <div>
        <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary/30" aria-hidden />
            </div>
          )}
          <div className="absolute top-3 end-3 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-soft">
            {type}
          </div>
          {isVerified ? (
            <div className="absolute top-3 start-3 z-10 bg-white/95 backdrop-blur-md text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-soft flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agréée DJS</span>
            </div>
          ) : (
            <div className="absolute top-3 start-3 z-10 bg-white/95 backdrop-blur-md text-muted-foreground px-2.5 py-1 rounded-full text-[11px] font-medium shadow-soft flex items-center gap-1 border border-border">
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Déclarative</span>
            </div>
          )}
        </div>

        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
            {name}
          </h3>

          <div className="space-y-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
              <span>{location}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                <span dir="ltr">{phone}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                <span className="truncate" dir="ltr">{email}</span>
              </div>
            )}
            {hours && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                <span>{hours}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {domains && domains.length > 0 && (
        <div className="px-5 pb-4 pt-1 flex flex-wrap gap-1.5 border-t border-border/50">
          {domains.map((d, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md"
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
