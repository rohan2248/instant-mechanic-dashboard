import { Suspense } from "react"

import { MechanicStatusStrip } from "@/components/mechanics/mechanic-status-strip"
import { MechanicsTable } from "@/components/mechanics/mechanics-table"
import { PageHeader } from "@/components/shared/page-header"
import { StatGridSkeleton, TableSkeleton } from "@/components/shared/skeletons"
import { getMechanicStatusCounts, getMechanics } from "@/lib/api/queries"
import {
  parseMechanicParams,
  type RawSearchParams,
} from "@/lib/api/search-params"

export default async function MechanicsPage({
  searchParams,
}: PageProps<"/mechanics">) {
  const params = (await searchParams) as RawSearchParams

  return (
    <>
      <PageHeader
        title="Mechanics"
        description="Roster availability and current workload."
      />

      {/* The strip counts the whole roster, so it is independent of the
          table's filters and does not need to re-suspend when they change. */}
      <Suspense fallback={<StatGridSkeleton count={3} />}>
        <StatusStripSection />
      </Suspense>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<TableSkeleton columns={5} />}
      >
        <MechanicsSection params={params} />
      </Suspense>
    </>
  )
}

async function StatusStripSection() {
  return <MechanicStatusStrip counts={await getMechanicStatusCounts()} />
}

async function MechanicsSection({ params }: { params: RawSearchParams }) {
  const result = await getMechanics(parseMechanicParams(params))
  return <MechanicsTable result={result} />
}
