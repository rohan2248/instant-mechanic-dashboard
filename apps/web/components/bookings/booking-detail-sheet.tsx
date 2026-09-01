"use client"

import * as React from "react"
import { ArrowRightIcon } from "lucide-react"

import { BookingStatusBadge } from "@/components/shared/booking-status-badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchBookingDetail } from "@/lib/api/actions"
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatPaise,
} from "@/lib/format"
import type { BookingDetail } from "@/types/api"

/**
 * Slide-over with the full record and its event timeline.
 *
 * Detail is fetched on open through a Server Action — client components can't
 * import the server-only API client, and loading it lazily keeps the list
 * response from carrying an event history per row.
 */
export function BookingDetailSheet({
  bookingId,
  reference,
  onOpenChange,
}: {
  bookingId: number | null
  reference?: string
  onOpenChange: (open: boolean) => void
}) {
  // One state slot tagged with the id it belongs to. Anything whose id
  // doesn't match the open row reads as loading, which removes the need to
  // synchronously clear state when the sheet moves between rows.
  const [loaded, setLoaded] = React.useState<{
    id: number
    detail?: BookingDetail
    error?: string
  } | null>(null)

  React.useEffect(() => {
    if (bookingId === null) return

    let cancelled = false

    fetchBookingDetail(bookingId).then((result) => {
      // The sheet may have closed, or moved to another row, while this was
      // in flight — don't write a stale record into state.
      if (cancelled) return
      setLoaded(
        result.ok
          ? { id: bookingId, detail: result.data }
          : { id: bookingId, error: result.message }
      )
    })

    return () => {
      cancelled = true
    }
  }, [bookingId])

  const current = loaded?.id === bookingId ? loaded : null
  const detail = current?.detail ?? null
  const error = current?.error ?? null

  return (
    <Sheet open={bookingId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">
            {detail?.reference ?? reference ?? "Booking"}
          </SheetTitle>
          <SheetDescription>
            {detail
              ? `${detail.service.name} · ${formatDateTime(detail.scheduledAt)}`
              : "Loading booking details…"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !detail ? (
            <DetailSkeleton />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <BookingStatusBadge status={detail.status} />
                <span className="tabular text-lg font-semibold">
                  {formatPaise(detail.amountPaise, true)}
                </span>
              </div>

              <Separator />

              <Section title="Customer">
                <Row label="Name" value={detail.customer.name} />
                <Row label="Phone" value={detail.customer.phone} />
                <Row label="Email" value={detail.customer.email} />
                <Row label="City" value={detail.customer.city} />
              </Section>

              <Section title="Vehicle">
                <Row
                  label="Vehicle"
                  value={`${detail.vehicle.make} ${detail.vehicle.model} (${detail.vehicle.year})`}
                />
                <Row
                  label="Registration"
                  value={detail.vehicle.registration}
                  mono
                />
                <Row label="Fuel" value={detail.vehicle.fuelType} />
              </Section>

              <Section title="Service">
                <Row label="Service" value={detail.service.name} />
                <Row label="Category" value={detail.service.category} />
                <Row
                  label="Duration"
                  value={formatDuration(detail.service.durationMins)}
                />
                <Row
                  label="Mechanic"
                  value={detail.mechanic?.name ?? "Unassigned"}
                />
              </Section>

              <Section title="Schedule">
                <Row
                  label="Scheduled"
                  value={formatDateTime(detail.scheduledAt)}
                />
                <Row label="Booked on" value={formatDate(detail.createdAt)} />
                {detail.completedAt ? (
                  <Row
                    label="Completed"
                    value={formatDateTime(detail.completedAt)}
                  />
                ) : null}
              </Section>

              <Separator />

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Timeline</h3>
                <ol className="flex flex-col gap-3">
                  {/* The API returns events oldest-first; reversed here so the
                      most recent change is the first thing read. */}
                  {[...detail.events].reverse().map((event) => (
                    <li key={event.id} className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {event.fromStatus ? (
                          <>
                            <BookingStatusBadge status={event.fromStatus} />
                            <ArrowRightIcon
                              className="size-3 text-muted-foreground"
                              aria-hidden
                            />
                          </>
                        ) : null}
                        <BookingStatusBadge status={event.toStatus} />
                      </div>
                      <span className="tabular text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </span>
                      {event.note ? (
                        <span className="text-xs text-muted-foreground italic">
                          {event.note}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : "truncate"}>
        {value}
      </dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
      {Array.from({ length: 3 }, (_, section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }, (_, row) => (
            <Skeleton key={row} className="h-3.5 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
