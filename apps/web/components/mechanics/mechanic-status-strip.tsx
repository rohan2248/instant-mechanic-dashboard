import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatPercent } from "@/lib/format"
import {
  MECHANIC_STATUSES,
  MECHANIC_STATUS_PRESENTATION,
} from "@/lib/status"
import type { MechanicStatus } from "@/types/api"

/**
 * Roster availability at a glance. Each tile filters the table below, so the
 * strip doubles as the primary filter for the page.
 */
export function MechanicStatusStrip({
  counts,
}: {
  counts: Record<MechanicStatus, number>
}) {
  const total = MECHANIC_STATUSES.reduce(
    (sum, status) => sum + (counts[status] ?? 0),
    0
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {MECHANIC_STATUSES.map((status) => {
        const count = counts[status] ?? 0
        const { label, dot } = MECHANIC_STATUS_PRESENTATION[status]

        return (
          <Card key={status} className="py-4 transition-colors hover:bg-muted/40">
            <CardContent className="px-4">
              <Link
                href={`/mechanics?status=${status}`}
                className="flex items-center justify-between gap-3 focus-visible:outline-none"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={
                      dot === "hollow"
                        ? "size-2 rounded-full border border-muted-foreground"
                        : "size-2 rounded-full bg-foreground"
                    }
                  />
                  <span className="text-sm font-medium">{label}</span>
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="tabular text-xl font-semibold">
                    {formatNumber(count)}
                  </span>
                  <span className="tabular text-xs text-muted-foreground">
                    {formatPercent(total ? (count / total) * 100 : 0, 0)}
                  </span>
                </span>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
