import Link from "next/link"
import { ArrowRightIcon, InboxIcon } from "lucide-react"

import { BookingStatusBadge } from "@/components/shared/booking-status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatRelativeTime } from "@/lib/format"
import type { ActivityItem } from "@/types/api"

/**
 * The booking event feed — the closest thing the API has to a live log, and
 * the surface where automatic polling is most visible.
 */
export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Status changes across all bookings, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                Booking status changes will appear here as they happen.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="h-[22rem] pr-3">
            <ol className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.fromStatus ? (
                      <>
                        <BookingStatusBadge status={item.fromStatus} />
                        <ArrowRightIcon
                          className="size-3 text-muted-foreground"
                          aria-hidden
                        />
                      </>
                    ) : null}
                    <BookingStatusBadge status={item.toStatus} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm">
                    <Link
                      href={`/bookings?q=${item.reference}`}
                      className="font-mono text-xs underline-offset-4 hover:underline"
                    >
                      {item.reference}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      · {item.customer} · {item.service}
                      {item.mechanic ? ` · ${item.mechanic}` : ""}
                    </span>
                  </p>

                  {item.note ? (
                    <p className="text-xs text-muted-foreground italic">
                      {item.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
