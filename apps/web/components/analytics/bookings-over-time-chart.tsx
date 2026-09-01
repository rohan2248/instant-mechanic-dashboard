"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatDateShort, formatNumber } from "@/lib/format"
import type { TimeseriesPoint } from "@/types/api"

const config = {
  bookings: {
    label: "Bookings",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

/**
 * Booking volume per day.
 *
 * A single series in a monochrome theme, so the fill can be a solid gradient
 * of the foreground without competing against anything.
 */
export function BookingsOverTimeChart({
  points,
}: {
  points: TimeseriesPoint[]
}) {
  // Dense windows get fewer ticks so labels never collide at 90 days.
  const tickInterval = Math.max(0, Math.ceil(points.length / 8) - 1)

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-bookings" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-bookings)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-bookings)"
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
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0] ? formatDateShort(payload[0].payload.date) : ""
              }
              formatter={(value) => formatNumber(Number(value))}
            />
          }
        />
        <Area
          dataKey="bookings"
          type="monotone"
          stroke="var(--color-bookings)"
          strokeWidth={2}
          fill="url(#fill-bookings)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
