"use client"

import { Cell, Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatNumber, formatPercent } from "@/lib/format"
import { BOOKING_STATUS_CHART_COLOR, BOOKING_STATUS_PRESENTATION } from "@/lib/status"
import type { StatusBreakdownRow } from "@/types/api"

/**
 * Share of bookings by pipeline stage.
 *
 * Six near-greys sit next to each other, so every slice gets a 2px separator
 * painted in the page background — without it adjacent steps of the ramp merge
 * into one shape. The legend carries the numbers, since a monochrome donut
 * can't be read by colour matching alone.
 */
export function BookingStatusChart({ rows }: { rows: StatusBreakdownRow[] }) {
  const config = Object.fromEntries(
    rows.map((row) => [
      row.status,
      {
        label: BOOKING_STATUS_PRESENTATION[row.status].label,
        color: BOOKING_STATUS_CHART_COLOR[row.status],
      },
    ])
  ) satisfies ChartConfig

  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer
        config={config}
        className="mx-auto aspect-square h-[220px]"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="status"
                formatter={(value, name) => (
                  <div className="flex flex-1 justify-between gap-3">
                    <span>
                      {BOOKING_STATUS_PRESENTATION[
                        name as keyof typeof BOOKING_STATUS_PRESENTATION
                      ]?.label ?? name}
                    </span>
                    <span className="tabular font-medium">
                      {formatNumber(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={rows}
            dataKey="count"
            nameKey="status"
            innerRadius={62}
            outerRadius={95}
            paddingAngle={1}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {rows.map((row) => (
              <Cell
                key={row.status}
                fill={BOOKING_STATUS_CHART_COLOR[row.status]}
              />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="metric fill-foreground text-2xl font-semibold"
                    >
                      {formatNumber(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      bookings
                    </tspan>
                  </text>
                )
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex flex-1 flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.status}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-border"
                style={{ background: BOOKING_STATUS_CHART_COLOR[row.status] }}
              />
              <span className="truncate">
                {BOOKING_STATUS_PRESENTATION[row.status].label}
              </span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <span className="metric font-medium">
                {formatNumber(row.count)}
              </span>
              <span className="tabular w-12 text-right text-xs text-muted-foreground">
                {formatPercent(row.share)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
