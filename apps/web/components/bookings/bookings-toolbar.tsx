"use client"

import { DateRangeFilter } from "@/components/data-table/date-range-filter"
import { FacetedFilter } from "@/components/data-table/faceted-filter"
import { ResetFilters } from "@/components/data-table/reset-filters"
import { SearchInput } from "@/components/data-table/search-input"
import { BOOKING_STATUSES, BOOKING_STATUS_PRESENTATION } from "@/lib/status"
import type { MechanicOption } from "@/types/api"

const STATUS_OPTIONS = BOOKING_STATUSES.map((status) => ({
  value: status,
  label: BOOKING_STATUS_PRESENTATION[status].label,
}))

export function BookingsToolbar({
  mechanics,
}: {
  mechanics: MechanicOption[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Placeholder names the three fields the API's `q` actually searches,
          so nobody wastes time typing a service name into it. */}
      <SearchInput placeholder="Search ID, customer or registration…" />
      <FacetedFilter param="status" title="Status" options={STATUS_OPTIONS} />
      <FacetedFilter
        param="mechanicId"
        title="Mechanic"
        single
        options={mechanics.map((mechanic) => ({
          value: String(mechanic.id),
          label: mechanic.name,
        }))}
      />
      <DateRangeFilter />
      <ResetFilters params={["q", "status", "mechanicId", "from", "to"]} />
    </div>
  )
}
