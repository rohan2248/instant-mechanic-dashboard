"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { ColumnHeader } from "@/components/data-table/column-header"
import { tableFeaturesConfig } from "@/components/data-table/data-table"
import { MechanicRowActions } from "@/components/mechanics/mechanic-row-actions"
import { MechanicStatusBadge } from "@/components/shared/mechanic-status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate, formatNumber, formatTime, initials } from "@/lib/format"
import type { MechanicListItem } from "@/types/api"

const helper = createColumnHelper<typeof tableFeaturesConfig, MechanicListItem>()

const DEFAULT_SORT = { by: "name", dir: "asc" } as const

export function createMechanicColumns({
  onViewDetails,
}: {
  onViewDetails: (mechanic: MechanicListItem) => void
}) {
  return [
  helper.accessor("name", {
    header: () => (
      <ColumnHeader title="Mechanic" sortKey="name" defaultSort={DEFAULT_SORT} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          {/* No image source in the API, so the fallback is the only state. */}
          <AvatarFallback className="text-xs">
            {initials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      </div>
    ),
  }),

  helper.accessor("status", {
    header: () => <ColumnHeader title="Status" />,
    cell: ({ row }) => <MechanicStatusBadge status={row.original.status} />,
  }),

  helper.accessor("completedJobs", {
    header: () => (
      <ColumnHeader
        title="Jobs completed"
        sortKey="completedJobs"
        align="right"
        defaultSort={DEFAULT_SORT}
      />
    ),
    cell: ({ row }) => (
      <div className="tabular text-right">
        {formatNumber(row.original.completedJobs)}
      </div>
    ),
  }),

  helper.accessor((row) => row.currentBooking?.reference ?? null, {
    id: "currentBooking",
    header: () => <ColumnHeader title="Current job" />,
    cell: ({ row }) => {
      const current = row.original.currentBooking
      // The API only populates this for ON_THE_WAY / IN_PROGRESS, so an
      // ASSIGNED mechanic legitimately reads as idle here. Open the detail
      // sheet for their booking history.
      if (!current) {
        return (
          <span className="text-sm text-muted-foreground italic">Idle</span>
        )
      }
      return (
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-xs whitespace-nowrap">
            {current.reference}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {current.service} · {current.customer} · {formatTime(current.scheduledAt)}
          </span>
        </div>
      )
    },
  }),

  helper.accessor("hiredAt", {
    header: () => (
      <ColumnHeader title="Hired" sortKey="hiredAt" defaultSort={DEFAULT_SORT} />
    ),
    cell: ({ row }) => (
      <span className="tabular whitespace-nowrap">
        {formatDate(row.original.hiredAt)}
      </span>
    ),
  }),

  helper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <MechanicRowActions
          mechanic={row.original}
          onViewDetails={() => onViewDetails(row.original)}
        />
      </div>
    ),
  }),
  ]
}
