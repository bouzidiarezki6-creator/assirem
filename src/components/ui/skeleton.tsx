import { cn } from "@/lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  rounded?: "md" | "lg" | "xl" | "2xl" | "full"
}

export function Skeleton({ className, rounded = "2xl", ...props }: SkeletonProps) {
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "md"
        ? "rounded-md"
        : rounded === "lg"
          ? "rounded-lg"
          : rounded === "xl"
            ? "rounded-xl"
            : "rounded-2xl"

  return (
    <div
      className={cn("shimmer bg-muted", radius, className)}
      aria-hidden
      {...props}
    />
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/60 bg-white p-0 shadow-soft",
        className
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-[80%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[65%]" />
      </div>
    </div>
  )
}
