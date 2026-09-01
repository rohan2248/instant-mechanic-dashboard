"use client"

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatNumber, formatPaise, formatPaiseCompact } from "@/lib/format"
import { rampColor } from "@/lib/status"
import type { CategoryRevenueRow } from "@/types/api"

const config = {
  revenuePaise: { label: "Revenue" },
} satisfies ChartConfig

/**
 * Revenue per service category.
 *
 * Horizontal because category names are long, and sorted by the API already.
 * Bars descend through the grey ramp, which reinforces the ranking rather
 * than just decorating it.
 */
export function CategoryBreakdownChart({
  rows,
}: {
  rows: CategoryRevenueRow[]
}) {
  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: Math.max(200, rows.length * 42) }}
    >
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 4, right: 56, top: 4, bottom: 4 }}
      >
        <XAxis type="number" dataKey="revenuePaise" hide />
        {/* Wide enough for the longest seeded category ("Battery &
            Electricals", "Roadside Assistance") to sit on one line — at 132px
            they wrapped and collided with the row above. */}
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={150}
          tickMargin={6}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="name"
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="tabular font-medium">
                    {formatPaise(Number(value))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(item?.payload?.bookings ?? 0)} completed
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="revenuePaise" radius={4} barSize={22}>
          {rows.map((row, index) => (
            <Cell key={row.id} fill={rampColor(index)} />
          ))}
          <LabelList
            dataKey="revenuePaise"
            position="right"
            offset={8}
            className="fill-muted-foreground"
            fontSize={11}
            formatter={(value) => formatPaiseCompact(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
