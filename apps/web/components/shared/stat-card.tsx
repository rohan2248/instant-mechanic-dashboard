import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * One metric tile.
 *
 * `value` is pre-formatted by the caller (via lib/format) so this component
 * never has to know whether it is showing paise, a count or a percentage.
 *
 * Two tiers, because a grid of identically-weighted tiles gives the reader no
 * entry point — everything shouts at the same volume and nothing is found
 * first. `lead` tiles carry the figures someone opens the dashboard to check;
 * everything else is set at `support` and read second.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tier = "support",
}: {
  label: string
  value: string
  /** A supporting fact — never a restatement of the label. */
  hint?: string
  icon: LucideIcon
  tier?: "lead" | "support"
}) {
  const lead = tier === "lead"

  return (
    <Card
      className={cn(
        "gap-0 shadow-xs transition-[box-shadow,transform,background-color] duration-200",
        // Lifting by a single pixel is enough to register as a response; more
        // than that and a grid of eight tiles turns into a trampoline.
        "hover:-translate-y-px hover:shadow-md",
        lead ? "py-5" : "py-4"
      )}
    >
      <CardHeader className={cn("pb-1", lead ? "px-5" : "px-4")}>
        <CardDescription className="label-xs text-muted-foreground">
          {label}
        </CardDescription>
        <CardAction>
          <Icon
            className={cn(
              "text-muted-foreground/70 transition-colors group-hover/card:text-foreground",
              lead ? "size-4.5" : "size-4"
            )}
            aria-hidden
          />
        </CardAction>
      </CardHeader>
      <CardContent className={lead ? "px-5" : "px-4"}>
        <CardTitle
          className={cn(
            "metric leading-none font-semibold",
            lead ? "text-4xl" : "text-2xl"
          )}
        >
          {value}
        </CardTitle>
        {hint ? (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              lead ? "mt-2.5" : "mt-1.5"
            )}
          >
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
