import Link from "next/link"

import { BookingStatusBadge } from "@/components/shared/booking-status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatNumber, formatPaiseCompact, formatPercent } from "@/lib/format"
import type { StatusBreakdownRow } from "@/types/api"

/**
 * Pipeline breakdown. Each row is a link that pre-filters the bookings table,
 * so the obvious next question ("which ones?") is one click away.
 *
 * The share bar is a plain div rather than a chart: six values with visible
 * numbers beside them don't need an axis.
 */
export function StatusSummary({ rows }: { rows: StatusBreakdownRow[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Booking status</CardTitle>
        <CardDescription>
          Every booking by pipeline stage. Select a stage to filter the table.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => (
          <Link
            key={row.status}
            href={`/bookings?status=${row.status}`}
            className="group flex flex-col gap-1.5 rounded-md p-1 -m-1 transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-3">
              <BookingStatusBadge status={row.status} />
              <div className="flex items-baseline gap-2 text-sm">
                <span className="tabular font-medium">
                  {formatNumber(row.count)}
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  {formatPercent(row.share)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-foreground/70 transition-[width] group-hover:bg-foreground"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
              <span className="tabular w-16 text-right text-xs text-muted-foreground">
                {formatPaiseCompact(row.amountPaise)}
              </span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
