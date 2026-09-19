import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  hint?: string
  action?: ReactNode
  className?: string
  align?: "start" | "center"
}

export default function PageHeader({
  title,
  description,
  hint,
  action,
  className,
  align = "center",
}: PageHeaderProps) {
  const centered = align === "center"

  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-b border-border/50 pb-10",
        centered
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between text-start",
        className
      )}
    >
      <div className={cn("space-y-3 max-w-3xl", centered && "mx-auto")}>
        <h1 className="type-h1">{title}</h1>
        {description && <p className="type-body mx-auto">{description}</p>}
        {hint && (
          <p className={cn("text-sm font-medium text-primary", centered && "mx-auto")}>
            {hint}
          </p>
        )}
      </div>
      {action && <div className={cn("shrink-0", centered && "mx-auto")}>{action}</div>}
    </div>
  )
}
