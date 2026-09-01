"use client"

import * as React from "react"
import { SearchXIcon } from "lucide-react"

import { BookingDetailSheet } from "@/components/bookings/booking-detail-sheet"
import { BookingsToolbar } from "@/components/bookings/bookings-toolbar"
import { createBookingColumns } from "@/components/bookings/columns"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/pagination"
import { useTableParams } from "@/components/data-table/use-table-params"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { BookingListItem, MechanicOption, Paginated } from "@/types/api"

export function BookingsTable({
  result,
  mechanics,
}: {
  result: Paginated<BookingListItem>
  mechanics: MechanicOption[]
}) {
  // The transition is shared with every control through the URL, so the body
  // dims during a refetch instead of collapsing to a skeleton — the previous
  // page stays readable while the next one loads.
  const { isPending } = useTableParams()

  const [selected, setSelected] = React.useState<BookingListItem | null>(null)

  const columns = React.useMemo(
    () =>
      createBookingColumns({
        mechanics,
        onViewDetails: setSelected,
      }),
    [mechanics]
  )

  return (
    <div className="flex flex-col gap-4">
      <BookingsToolbar mechanics={mechanics} />

      <DataTable
        columns={columns}
        data={result.data}
        isPending={isPending}
        onRowClick={setSelected}
        emptyState={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>No bookings match these filters</EmptyTitle>
              <EmptyDescription>
                Try a different search term, or clear the filters to see the
                full list.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />

      <DataTablePagination meta={result.meta} />

      <BookingDetailSheet
        bookingId={selected?.id ?? null}
        reference={selected?.reference}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
