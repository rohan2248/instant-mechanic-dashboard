"use client";

import {
  columnVisibilityFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * The shared table shell for Bookings and Mechanics.
 *
 * Only `columnVisibilityFeature` is registered: sorting, filtering and
 * pagination are all done by the API and driven through the URL, so
 * registering those features would give the table a second, conflicting copy
 * of that state. TanStack here is doing column definition, header/cell
 * rendering and visibility — nothing more.
 *
 * TanStack v9: `useTable({ features, columns, data })` and `table.FlexRender`,
 * not v8's `useReactTable` + `getCoreRowModel()`.
 */
export const tableFeaturesConfig = tableFeatures({ columnVisibilityFeature });

/** Module scope: a fresh fallback array would invalidate models every render. */
const EMPTY: never[] = [];

export function DataTable<TData extends RowData>({
  columns,
  data,
  isPending = false,
  emptyState,
  onRowClick,
}: {
  /**
   * TValue is `any` because a column set is genuinely heterogeneous — each
   * accessor returns a different type, and TValue is invariant, so neither
   * `unknown` nor a union will accept the array.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<typeof tableFeaturesConfig, TData, any>[];
  data: TData[] | undefined;
  /** Dims the body while a URL-driven refetch is in flight. */
  isPending?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
}) {
  const table = useTable({
    features: tableFeaturesConfig,
    columns,
    data: data ?? EMPTY,
  });

  const rows = table.getRowModel().rows;

  // `Table` already renders its own `overflow-x-auto` container, so the
  // horizontal scroll is scoped to the table without a second wrapper here —
  // nesting one would create a scroll box that can never scroll, and push the
  // overflow up to the page instead.
  return (
    <div className="relative overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody
          className={cn(
            "transition-opacity",
            isPending && "pointer-events-none opacity-50",
          )}
        >
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={table.getAllLeafColumns().length}
                className="h-64 p-0"
              >
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
                className={cn(onRowClick && "cursor-pointer")}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
