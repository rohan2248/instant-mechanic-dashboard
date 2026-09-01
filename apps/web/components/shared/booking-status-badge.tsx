import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUS_PRESENTATION } from "@/lib/status"
import { cn } from "@/lib/utils"
import type { BookingStatus } from "@/types/api"

/**
 * Status in a monochrome theme.
 *
 * Badge weight gives the urgency tier (solid = happening now, tinted = in
 * flight, outlined = waiting or settled) and the dot disambiguates within a
 * tier: hollow means nothing has started, pulsing means work is underway.
 */
export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus
  className?: string
}) {
  const { label, variant, dot } = BOOKING_STATUS_PRESENTATION[status]

  return (
    <Badge variant={variant} className={cn("gap-1.5 font-normal", className)}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          dot === "hollow"
            ? "border border-current bg-transparent"
            : "bg-current",
          dot === "pulse" && "animate-pulse"
        )}
      />
      {label}
    </Badge>
  )
}
