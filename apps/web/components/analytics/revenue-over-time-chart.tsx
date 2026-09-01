"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatDateShort, formatPaise, formatPaiseCompact } from "@/lib/format"
import type { TimeseriesPoint } from "@/types/api"

const config = {
  revenuePaise: {
    label: "Booked value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

/**
 * Booked value per day.
 *
 * Labelled "booked value", not "revenue": this endpoint sums every booking on
 * the day regardless of status, whereas the Overview tile and the category
 * chart count COMPLETED only. Calling both "revenue" would make two figures
 * that legitimately differ look like a bug.
 */
export function RevenueOverTimeChart({
  points,
}: {
  points: TimeseriesPoint[]
}) {
  const tickInterval = Math.max(0, Math.ceil(points.length / 8) - 1)

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-revenuePaise)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-revenuePaise)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={tickInterval}
          tickFormatter={formatDateShort}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value) => formatPaiseCompact(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0] ? formatDateShort(payload[0].payload.date) : ""
              }
              formatter={(value) => formatPaise(Number(value))}
            />
          }
        />
        <Area
          dataKey="revenuePaise"
          type="monotone"
          stroke="var(--color-revenuePaise)"
          strokeWidth={2}
          fill="url(#fill-revenue)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
