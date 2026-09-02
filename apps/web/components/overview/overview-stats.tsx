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
 * The eight headline metrics, in two tiers.
 *
 * The three `lead` tiles answer what someone opening the dashboard mid-shift
 * actually wants: how much is queued, how much is running today, and what has
 * been earned. The remaining five are context and sit in a denser row beneath,
 * which is what stops the block reading as eight interchangeable squares.
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          tier="lead"
          icon={ClockIcon}
          label="Pending"
          value={formatNumber(pending)}
          hint={`${formatNumber(overview.openBookings)} open incl. in progress`}
        />
        <StatCard
          tier="lead"
          icon={CalendarDaysIcon}
          label="Today's bookings"
          value={formatNumber(overview.todayBookings)}
          hint="Scheduled for today (IST)"
        />
        <StatCard
          tier="lead"
          icon={BanknoteIcon}
          label="Total revenue"
          value={formatPaiseCompact(overview.revenuePaise)}
          hint="Completed bookings only"
        />
      </div>

      {/* Five across on a wide screen — deliberately not four, so the row
          can't line up column-for-column with the tier above it. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={ClipboardListIcon}
          label="Total bookings"
          value={formatNumber(overview.totalBookings)}
          hint="All time"
        />
        <StatCard
          icon={CircleCheckIcon}
          label="Completed"
          value={formatNumber(overview.completedBookings)}
          hint={`${formatPercent(overview.completionRate)} completion rate`}
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
    </div>
  )
}
