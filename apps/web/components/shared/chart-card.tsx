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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
      {footnote ? (
        <CardFooter>
          <p className="text-xs text-muted-foreground">{footnote}</p>
        </CardFooter>
      ) : null}
    </Card>
  )
}
