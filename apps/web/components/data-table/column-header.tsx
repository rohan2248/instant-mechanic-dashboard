"use client"

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"

import { useTableParams } from "@/components/data-table/use-table-params"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Sortable header.
 *
 * Sorting is the API's job, so the header writes `sortBy`/`sortDir` to the URL
 * rather than touching table state. The arrow reflects the URL, which means a
 * shared link arrives showing the correct sort indicator.
 */
export function ColumnHeader({
  title,
  sortKey,
  align = "left",
  defaultSort,
}: {
  title: string
  /** Omit to render a plain, non-sortable label. */
  sortKey?: string
  align?: "left" | "right"
  /** The API's default sort, so the arrow shows on first load. */
  defaultSort?: { by: string; dir: "asc" | "desc" }
}) {
  const { searchParams, setParams } = useTableParams()

  if (!sortKey) {
    return (
      <span className={cn("text-xs", align === "right" && "block text-right")}>
        {title}
      </span>
    )
  }

  const activeBy = searchParams.get("sortBy") ?? defaultSort?.by
  const activeDir = searchParams.get("sortDir") ?? defaultSort?.dir ?? "desc"
  const isActive = activeBy === sortKey

  const Icon = !isActive
    ? ChevronsUpDownIcon
    : activeDir === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon

  return (
    <Button
      variant="ghost"
      size="xs"
      className={cn("-mx-2", align === "right" && "ml-auto")}
      onClick={() =>
        setParams({
          sortBy: sortKey,
          // Re-clicking the active column flips direction; a new column
          // starts descending, which is what "most recent / largest first"
          // means for every sortable column here except name.
          sortDir: isActive && activeDir === "desc" ? "asc" : "desc",
        })
      }
      aria-label={`Sort by ${title}`}
    >
      {title}
      <Icon
        data-icon="inline-end"
        className={cn(!isActive && "text-muted-foreground")}
      />
    </Button>
  )
}
