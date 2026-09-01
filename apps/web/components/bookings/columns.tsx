"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { BookingRowActions } from "@/components/bookings/booking-row-actions"
import { ColumnHeader } from "@/components/data-table/column-header"
import { tableFeaturesConfig } from "@/components/data-table/data-table"
import { BookingStatusBadge } from "@/components/shared/booking-status-badge"
import { formatDate, formatDuration, formatPaise, formatTime } from "@/lib/format"
import type { BookingListItem, MechanicOption } from "@/types/api"

const helper = createColumnHelper<typeof tableFeaturesConfig, BookingListItem>()

/** The API's default ordering, so the sort arrow is right on first load. */
const DEFAULT_SORT = { by: "scheduledAt", dir: "desc" } as const

/**
 * Two-line cells throughout: the identifying value on top, its context
 * underneath in muted text. It keeps eight columns readable without a
 * horizontal scroll on a laptop, and means the secondary facts (city,
 * vehicle model, category) are present without extra columns.
 */
export function createBookingColumns({
  mechanics,
  onViewDetails,
}: {
  mechanics: MechanicOption[]
  onViewDetails: (booking: BookingListItem) => void
}) {
  return [
  helper.accessor("reference", {
    header: () => (
      <ColumnHeader title="Booking ID" sortKey="createdAt" defaultSort={DEFAULT_SORT} />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs whitespace-nowrap">
        {row.original.reference}
      </span>
    ),
  }),

  helper.accessor((row) => row.customer.name, {
    id: "customer",
    header: () => <ColumnHeader title="Customer" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="truncate font-medium">{row.original.customer.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.customer.city}
        </span>
      </div>
    ),
  }),

  helper.accessor((row) => row.vehicle.registration, {
    id: "vehicle",
    header: () => <ColumnHeader title="Vehicle" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-mono text-xs whitespace-nowrap">
          {row.original.vehicle.registration}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.vehicle.label}
        </span>
      </div>
    ),
  }),

  helper.accessor((row) => row.service.name, {
    id: "service",
    header: () => <ColumnHeader title="Service" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="truncate">{row.original.service.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {row.original.service.category} ·{" "}
          {formatDuration(row.original.service.durationMins)}
        </span>
      </div>
    ),
  }),

  helper.accessor((row) => row.mechanic?.name ?? null, {
    id: "mechanic",
    header: () => <ColumnHeader title="Mechanic" />,
    cell: ({ row }) => {
      const mechanic = row.original.mechanic
      if (!mechanic) {
        return (
          <span className="text-sm text-muted-foreground italic">
            Unassigned
          </span>
        )
      }
      return (
        <div className="flex flex-col">
          <span className="truncate">{mechanic.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {mechanic.phone}
          </span>
        </div>
      )
    },
  }),

  helper.accessor("status", {
    header: () => (
      <ColumnHeader title="Status" sortKey="status" defaultSort={DEFAULT_SORT} />
    ),
    cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
  }),

  helper.accessor("amountPaise", {
    header: () => (
      <ColumnHeader
        title="Amount"
        sortKey="amountPaise"
        align="right"
        defaultSort={DEFAULT_SORT}
      />
    ),
    cell: ({ row }) => (
      <div className="tabular text-right whitespace-nowrap">
        {formatPaise(row.original.amountPaise)}
      </div>
    ),
  }),

  helper.accessor("scheduledAt", {
    header: () => (
      <ColumnHeader
        title="Scheduled"
        sortKey="scheduledAt"
        defaultSort={DEFAULT_SORT}
      />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col whitespace-nowrap">
        <span className="tabular">{formatDate(row.original.scheduledAt)}</span>
        <span className="tabular text-xs text-muted-foreground">
          {formatTime(row.original.scheduledAt)}
        </span>
      </div>
    ),
  }),

  helper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <BookingRowActions
          booking={row.original}
          mechanics={mechanics}
          onViewDetails={() => onViewDetails(row.original)}
        />
      </div>
    ),
  }),
  ]
}
