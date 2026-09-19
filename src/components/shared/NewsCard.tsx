import { Card, CardContent } from "../ui/card"

interface NewsCardProps {
  image?: string;
  category: string;
  date: string;
  title: string;
  description: string;
}

export default function NewsCard({ image, category, date, title, description }: NewsCardProps) {
  return (
    <Card className="overflow-hidden interactive-lift border-border/60 h-full group">
      <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
        )}
      </div>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between text-xs gap-2">
          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">{category}</span>
          <span className="text-muted-foreground shrink-0">{date}</span>
        </div>
        <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
    </Card>
  )
}
