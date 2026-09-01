import { Suspense } from "react"

import { BookingsTable } from "@/components/bookings/bookings-table"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { getBookings, getMechanicOptions } from "@/lib/api/queries"
import { parseBookingParams, type RawSearchParams } from "@/lib/api/search-params"

export default async function BookingsPage({
  searchParams,
}: PageProps<"/bookings">) {
  const params = (await searchParams) as RawSearchParams

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every job across the fleet. Search, filter and sort are handled by the API."
      />

      {/* Keyed on the query so changing filters shows the skeleton rather than
          holding a stale table. */}
      <Suspense
        key={JSON.stringify(params)}
        fallback={<TableSkeleton columns={8} />}
      >
        <BookingsSection params={params} />
      </Suspense>
    </>
  )
}

async function BookingsSection({ params }: { params: RawSearchParams }) {
  const query = parseBookingParams(params)

  // The mechanic list only feeds the filter dropdown, so it is fetched
  // alongside rather than after the rows.
  const [result, mechanics] = await Promise.all([
    getBookings(query),
    getMechanicOptions(),
  ])

  return <BookingsTable result={result} mechanics={mechanics} />
}
