import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Shared frame for the analytics charts, so all four share one header rhythm
 * and the charts themselves stay pure rendering.
 */
export function ChartCard({
  title,
  description,
  action,
  footnote,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  /** Where a chart's caveats live — e.g. which statuses a total counts. */
  footnote?: string
  children: React.ReactNode
}) {
  return (
    // `h-full` so two charts sharing a row end level regardless of whether one
    // of them carries a footnote — the footnote strip absorbs the difference
    // instead of leaving the shorter card floating.
    <Card className="flex h-full flex-col shadow-xs">
      <CardHeader>
        <CardTitle className="text-[0.9375rem]">{title}</CardTitle>
        {description ? (
          <CardDescription className="measure text-[0.8125rem]">
            {description}
          </CardDescription>
        ) : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      {/* Centred rather than top-aligned: `h-full` levels the cards in a row,
          which leaves a fixed-height chart (the donut) sitting in a taller
          card than it needs. Centring turns that slack into margin instead of
          a void hanging under the chart. */}
      <CardContent className="flex flex-1 flex-col justify-center">
        {children}
      </CardContent>
      {footnote ? (
        <CardFooter className="mt-auto">
          <p className="measure text-xs text-muted-foreground">{footnote}</p>
        </CardFooter>
      ) : null}
    </Card>
  )
}
