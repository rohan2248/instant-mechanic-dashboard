import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * One metric tile.
 *
 * `value` is pre-formatted by the caller (via lib/format) so this component
 * never has to know whether it is showing paise, a count or a percentage.
 * The value uses tabular figures so digits don't jitter as the page polls.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  /** A supporting fact — never a restatement of the label. */
  hint?: string
  icon: LucideIcon
}) {
  return (
    <Card className="gap-0 py-4">
      <CardHeader className="px-4 pb-1">
        <CardDescription className="text-xs font-medium">
          {label}
        </CardDescription>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </CardAction>
      </CardHeader>
      <CardContent className="px-4">
        <CardTitle className="tabular text-2xl leading-tight font-semibold">
          {value}
        </CardTitle>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
