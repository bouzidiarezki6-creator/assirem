import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/30 bg-[#041d13]/85 backdrop-blur-md px-6 py-16 text-center shadow-soft",
        className
      )}
      role="status"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
        <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-emerald-300/70 max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Button asChild className="bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-full hover:bg-primary/90">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button type="button" onClick={onAction} className="bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 rounded-full hover:bg-primary/90">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
