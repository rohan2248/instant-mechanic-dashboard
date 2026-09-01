import { Suspense } from "react"

import { OverviewStats } from "@/components/overview/overview-stats"
import { RecentActivity } from "@/components/overview/recent-activity"
import { StatusSummary } from "@/components/overview/status-summary"
import { PageHeader } from "@/components/shared/page-header"
import {
  ActivitySkeleton,
  ListSkeleton,
  StatGridSkeleton,
} from "@/components/shared/skeletons"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getActivity, getOverview, getStatusBreakdown } from "@/lib/api/queries"
import { formatDateTime } from "@/lib/format"

/**
 * Overview.
 *
 * Each block fetches inside its own Suspense boundary, so a slow endpoint
 * delays only its own card. Next 16 does not cache `fetch` by default, so
 * every render — including the ones the polling provider triggers — hits the
 * API fresh.
 */
export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Live vehicle service operations across every workshop."
      />

      <Suspense fallback={<StatGridSkeleton />}>
        <StatsSection />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<CardFallback><ListSkeleton /></CardFallback>}>
          <StatusSection />
        </Suspense>
        <Suspense fallback={<CardFallback><ActivitySkeleton /></CardFallback>}>
          <ActivitySection />
        </Suspense>
      </div>
    </>
  )
}

async function StatsSection() {
  // Both endpoints are needed for the tiles: "Pending" is a per-status count
  // that only the breakdown exposes. Fetched in parallel so the slower of the
  // two sets the latency, not their sum.
  const [overview, breakdown] = await Promise.all([
    getOverview(),
    getStatusBreakdown(),
  ])

  return (
    <div className="flex flex-col gap-2">
      <OverviewStats overview={overview} breakdown={breakdown} />
      <p className="text-xs text-muted-foreground">
        Server computed these figures at {formatDateTime(overview.asOf)}.
      </p>
    </div>
  )
}

async function StatusSection() {
  return <StatusSummary rows={await getStatusBreakdown()} />
}

async function ActivitySection() {
  return <RecentActivity items={await getActivity(15)} />
}

function CardFallback({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-3 w-56" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
