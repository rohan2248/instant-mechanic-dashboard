"use client"

import * as React from "react"
import { SearchXIcon } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { FacetedFilter } from "@/components/data-table/faceted-filter"
import { DataTablePagination } from "@/components/data-table/pagination"
import { ResetFilters } from "@/components/data-table/reset-filters"
import { SearchInput } from "@/components/data-table/search-input"
import { useTableParams } from "@/components/data-table/use-table-params"
import { createMechanicColumns } from "@/components/mechanics/columns"
import { MechanicDetailSheet } from "@/components/mechanics/mechanic-detail-sheet"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MECHANIC_STATUSES, MECHANIC_STATUS_PRESENTATION } from "@/lib/status"
import type { MechanicListItem, Paginated } from "@/types/api"

const STATUS_OPTIONS = MECHANIC_STATUSES.map((status) => ({
  value: status,
  label: MECHANIC_STATUS_PRESENTATION[status].label,
}))

export function MechanicsTable({
  result,
}: {
  result: Paginated<MechanicListItem>
}) {
  const { isPending } = useTableParams()

  const [selected, setSelected] = React.useState<MechanicListItem | null>(null)

  const columns = React.useMemo(
    () => createMechanicColumns({ onViewDetails: setSelected }),
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name, email or phone…" />
        <FacetedFilter param="status" title="Status" options={STATUS_OPTIONS} />
        <ResetFilters params={["q", "status"]} />
      </div>

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
              <EmptyTitle>No mechanics match these filters</EmptyTitle>
              <EmptyDescription>
                Try a different search term, or clear the filters to see the
                whole roster.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />

      <DataTablePagination meta={result.meta} />

      <MechanicDetailSheet
        mechanicId={selected?.id ?? null}
        name={selected?.name}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
