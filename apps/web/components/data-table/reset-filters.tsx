"use client"

import { XIcon } from "lucide-react"

import { useTableParams } from "@/components/data-table/use-table-params"
import { Button } from "@/components/ui/button"

/**
 * Clears filters but deliberately keeps sort: resetting a search shouldn't
 * silently reorder the table the user has already arranged.
 */
export function ResetFilters({ params }: { params: string[] }) {
  const { searchParams, setParams } = useTableParams()

  const hasAny = params.some((param) => searchParams.get(param))
  if (!hasAny) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        setParams(Object.fromEntries(params.map((param) => [param, null])))
      }
    >
      Reset
      <XIcon data-icon="inline-end" />
    </Button>
  )
}
