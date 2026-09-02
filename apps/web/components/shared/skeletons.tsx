import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Suspense fallbacks.
 *
 * These mirror the real layouts closely enough that content swapping in does
 * not shift the page — a dashboard that jumps on every poll is worse than one
 * that pauses.
 */

export function StatCardSkeleton({
  tier = "support",
}: {
  tier?: "lead" | "support"
}) {
  const lead = tier === "lead"

  return (
    <Card className={cn("gap-0", lead ? "py-5" : "py-4")}>
      <CardHeader className={cn("pb-1", lead ? "px-5" : "px-4")}>
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className={lead ? "px-5" : "px-4"}>
        {/* Heights track StatCard's two value sizes so the figure lands where
            its placeholder sat rather than nudging the hint below it. */}
        <Skeleton className={cn(lead ? "h-9 w-28" : "h-6 w-20")} />
        <Skeleton className={cn("h-3 w-28", lead ? "mt-3" : "mt-2")} />
      </CardContent>
    </Card>
  )
}

/** For uniform strips — the mechanics roster counts. */
export function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Mirrors the overview's two-tier metric block, 3 lead + 5 support. */
export function OverviewStatsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <StatCardSkeleton key={i} tier="lead" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({
  rows = 8,
  columns = 8,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-lg border">
        <div className="flex items-center gap-4 border-b px-4 py-3">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0"
          >
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActivitySkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="mt-1 size-2 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}
