"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { useTableParams } from "@/components/data-table/use-table-params"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/lib/api/search-params"
import { formatNumber } from "@/lib/format"
import type { Paginated } from "@/types/api"

const SIZE_ITEMS = PAGE_SIZE_OPTIONS.map((size) => ({
  label: String(size),
  value: String(size),
}))

/**
 * Server-driven pagination: every number here comes from the API's `meta`
 * envelope, so the count is the real total rather than the length of the
 * current page.
 */
export function DataTablePagination({
  meta,
}: {
  meta: Paginated<unknown>["meta"]
}) {
  const { setParams } = useTableParams()
  const { page, pageSize, total, totalPages } = meta

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="tabular text-sm text-muted-foreground">
        {total === 0
          ? "No results"
          : `${formatNumber(first)}–${formatNumber(last)} of ${formatNumber(total)}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <Select
            items={SIZE_ITEMS}
            value={String(pageSize)}
            onValueChange={(value) =>
              // Reset to page 1: keeping the page number while changing the
              // window size lands the user somewhere arbitrary.
              setParams({ pageSize: String(value), page: null })
            }
          >
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SIZE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <span className="tabular text-sm text-muted-foreground">
          Page {formatNumber(page)} of {formatNumber(totalPages)}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="First page"
            disabled={page <= 1}
            onClick={() => setParams({ page: 1 })}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setParams({ page: page - 1 })}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => setParams({ page: page + 1 })}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Last page"
            disabled={page >= totalPages}
            onClick={() => setParams({ page: totalPages })}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
