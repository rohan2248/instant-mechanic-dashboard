import {
  BanknoteIcon,
  CalendarDaysIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClipboardListIcon,
  ClockIcon,
  UserPlusIcon,
  WrenchIcon,
} from "lucide-react"

import { StatCard } from "@/components/shared/stat-card"
import {
  formatNumber,
  formatPaiseCompact,
  formatPercent,
} from "@/lib/format"
import type { DashboardOverview, StatusBreakdownRow } from "@/types/api"

/**
 * The eight headline metrics.
 *
 * "Pending" is the true PENDING count from the status breakdown, not the
 * overview's `openBookings` — that field aggregates PENDING + ASSIGNED +
 * ON_THE_WAY + IN_PROGRESS, so showing it under a "Pending" label would
 * overstate the queue by roughly 4x. The wider figure appears as the hint.
 */
export function OverviewStats({
  overview,
  breakdown,
}: {
  overview: DashboardOverview
  breakdown: StatusBreakdownRow[]
}) {
  const pending =
    breakdown.find((row) => row.status === "PENDING")?.count ?? 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={ClipboardListIcon}
        label="Total bookings"
        value={formatNumber(overview.totalBookings)}
        hint="All time"
      />
      <StatCard
        icon={CalendarDaysIcon}
        label="Today's bookings"
        value={formatNumber(overview.todayBookings)}
        hint="Scheduled for today (IST)"
      />
      <StatCard
        icon={CircleCheckIcon}
        label="Completed"
        value={formatNumber(overview.completedBookings)}
        hint={`${formatPercent(overview.completionRate)} completion rate`}
      />
      <StatCard
        icon={ClockIcon}
        label="Pending"
        value={formatNumber(pending)}
        hint={`${formatNumber(overview.openBookings)} open incl. in progress`}
      />
      <StatCard
        icon={CircleXIcon}
        label="Cancelled"
        value={formatNumber(overview.cancelledBookings)}
        hint={`${formatPercent(
          overview.totalBookings
            ? (overview.cancelledBookings / overview.totalBookings) * 100
            : 0
        )} of all bookings`}
      />
      <StatCard
        icon={BanknoteIcon}
        label="Total revenue"
        value={formatPaiseCompact(overview.revenuePaise)}
        hint="Completed bookings only"
      />
      <StatCard
        icon={WrenchIcon}
        label="Active mechanics"
        value={formatNumber(overview.activeMechanics)}
        hint={`of ${formatNumber(overview.totalMechanics)} on the roster`}
      />
      <StatCard
        icon={UserPlusIcon}
        label="New customers"
        value={formatNumber(overview.newCustomersThisMonth)}
        hint={`${formatNumber(overview.newCustomersRolling30d)} in the last 30 days`}
      />
    </div>
  )
}
