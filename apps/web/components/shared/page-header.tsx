/**
 * The title block that opens every route.
 *
 * The header bar repeats the section name at 14px as a location marker; this
 * is the one that should read as the page's title, so it is set several steps
 * larger with the display tracking from globals.css rather than competing at
 * the same weight.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-2xl font-semibold md:text-[1.75rem] md:leading-8">
          {title}
        </h2>
        {description ? (
          // Capped at a readable measure so the sentence doesn't run the full
          // width of an ultrawide monitor as a single thin line.
          <p className="measure text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
