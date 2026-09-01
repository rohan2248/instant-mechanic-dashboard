import { Suspense } from "react"

import { BookingStatusChart } from "@/components/analytics/booking-status-chart"
import { BookingsOverTimeChart } from "@/components/analytics/bookings-over-time-chart"
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart"
import { RangeToggle } from "@/components/analytics/range-toggle"
import { RevenueOverTimeChart } from "@/components/analytics/revenue-over-time-chart"
import { ChartCard } from "@/components/shared/chart-card"
import { PageHeader } from "@/components/shared/page-header"
import { ChartSkeleton } from "@/components/shared/skeletons"
import {
  getRevenueByCategory,
  getStatusBreakdown,
  getTimeseries,
} from "@/lib/api/queries"
import { parseDays } from "@/lib/api/search-params"
import { formatDate, formatNumber, formatPaise } from "@/lib/format"

export default async function AnalyticsPage({
  searchParams,
}: PageProps<"/analytics">) {
  // searchParams is a Promise in Next 16.
  const days = parseDays(await searchParams)

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Booking volume, revenue and service mix over time."
        actions={<RangeToggle days={days} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Keyed on `days` so switching range shows the skeleton again rather
            than holding the previous window's chart while the new one loads. */}
        <Suspense key={`bookings-${days}`} fallback={<ChartSkeleton />}>
          <BookingsSection days={days} />
        </Suspense>

        <Suspense key={`revenue-${days}`} fallback={<ChartSkeleton />}>
          <RevenueSection days={days} />
        </Suspense>

        <Suspense fallback={<ChartSkeleton height={220} />}>
          <StatusSection />
        </Suspense>

        <Suspense fallback={<ChartSkeleton height={340} />}>
          <CategorySection />
        </Suspense>
      </div>
    </>
  )
}

async function BookingsSection({ days }: { days: number }) {
  const series = await getTimeseries(days)
  const total = series.points.reduce((sum, p) => sum + p.bookings, 0)

  return (
    <ChartCard
      title="Bookings over time"
      description={`${formatNumber(total)} bookings from ${formatDate(
        series.from
      )} to ${formatDate(series.to)}`}
      footnote="Days with no bookings are zero-filled by the API, so the line is continuous."
    >
      <BookingsOverTimeChart points={series.points} />
    </ChartCard>
  )
}

async function RevenueSection({ days }: { days: number }) {
  const series = await getTimeseries(days)
  const total = series.points.reduce((sum, p) => sum + p.revenuePaise, 0)

  return (
    <ChartCard
      title="Booked value over time"
      description={`${formatPaise(total)} scheduled across the window`}
      footnote="Counts bookings of every status. The revenue tile and category chart below count completed bookings only, so their totals are lower by design."
    >
      <RevenueOverTimeChart points={series.points} />
    </ChartCard>
  )
}

async function StatusSection() {
  return (
    <ChartCard
      title="Booking status"
      description="Share of all bookings by pipeline stage."
    >
      <BookingStatusChart rows={await getStatusBreakdown()} />
    </ChartCard>
  )
}

async function CategorySection() {
  const rows = await getRevenueByCategory()

  return (
    <ChartCard
      title="Revenue by service category"
      description="Completed bookings, highest earning first."
      footnote="Categories with no completed bookings are omitted by the API rather than shown at zero."
    >
      <CategoryBreakdownChart rows={rows} />
    </ChartCard>
  )
}
