"use client"

import * as React from "react"

import { BookingStatusBadge } from "@/components/shared/booking-status-badge"
import { MechanicStatusBadge } from "@/components/shared/mechanic-status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchMechanicDetail } from "@/lib/api/actions"
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPaise,
  initials,
} from "@/lib/format"
import { BOOKING_STATUSES, BOOKING_STATUS_PRESENTATION } from "@/lib/status"
import type { MechanicDetail } from "@/types/api"

/**
 * Mechanic detail, including the booking history.
 *
 * This is where "last booking" comes from: the list endpoint only exposes a
 * *current* job (and only for ON_THE_WAY / IN_PROGRESS), so the most recent
 * completed work is only available here via `recentBookings`.
 */
export function MechanicDetailSheet({
  mechanicId,
  name,
  onOpenChange,
}: {
  mechanicId: number | null
  name?: string
  onOpenChange: (open: boolean) => void
}) {
  // Tagged with the id it belongs to, so a mismatch reads as loading and no
  // synchronous reset is needed when the sheet moves between rows.
  const [loaded, setLoaded] = React.useState<{
    id: number
    detail?: MechanicDetail
    error?: string
  } | null>(null)

  React.useEffect(() => {
    if (mechanicId === null) return

    let cancelled = false

    fetchMechanicDetail(mechanicId).then((result) => {
      if (cancelled) return
      setLoaded(
        result.ok
          ? { id: mechanicId, detail: result.data }
          : { id: mechanicId, error: result.message }
      )
    })

    return () => {
      cancelled = true
    }
  }, [mechanicId])

  const current = loaded?.id === mechanicId ? loaded : null
  const detail = current?.detail ?? null
  const error = current?.error ?? null

  return (
    <Sheet open={mechanicId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{detail?.name ?? name ?? "Mechanic"}</SheetTitle>
          <SheetDescription>
            {detail
              ? `Hired ${formatDate(detail.hiredAt)} · ${detail.email}`
              : "Loading mechanic details…"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !detail ? (
            <DetailSkeleton />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback>{initials(detail.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <MechanicStatusBadge status={detail.status} />
                  <span className="text-xs text-muted-foreground">
                    {detail.phone}
                  </span>
                </div>
                <div className="ml-auto text-right">
                  <div className="tabular text-lg font-semibold">
                    {formatPaise(detail.revenuePaise)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    lifetime revenue
                  </div>
                </div>
              </div>

              {detail.currentBooking ? (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Current job</span>
                    <BookingStatusBadge
                      status={detail.currentBooking.status}
                    />
                  </div>
                  <p className="mt-1 font-mono text-xs">
                    {detail.currentBooking.reference}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.currentBooking.service} ·{" "}
                    {detail.currentBooking.customer} ·{" "}
                    {formatDateTime(detail.currentBooking.scheduledAt)}
                  </p>
                </div>
              ) : null}

              <Separator />

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Bookings by status</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {BOOKING_STATUSES.map((status) => (
                    <div
                      key={status}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <dt className="text-muted-foreground">
                        {BOOKING_STATUS_PRESENTATION[status].label}
                      </dt>
                      <dd className="tabular font-medium">
                        {formatNumber(detail.bookingsByStatus[status] ?? 0)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Recent bookings</h3>
                {detail.recentBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bookings yet.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {detail.recentBookings.map((booking) => (
                      <li
                        key={booking.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-mono text-xs">
                            {booking.reference}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {booking.service} · {booking.customer}
                          </span>
                          <span className="tabular text-xs text-muted-foreground">
                            {formatDateTime(booking.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <BookingStatusBadge status={booking.status} />
                          <span className="tabular text-xs">
                            {formatPaise(booking.amountPaise)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      {Array.from({ length: 3 }, (_, section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }, (_, row) => (
            <Skeleton key={row} className="h-3.5 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
