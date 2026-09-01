import { Badge } from "@/components/ui/badge"
import { MECHANIC_STATUS_PRESENTATION } from "@/lib/status"
import { cn } from "@/lib/utils"
import type { MechanicStatus } from "@/types/api"

export function MechanicStatusBadge({
  status,
  className,
}: {
  status: MechanicStatus
  className?: string
}) {
  const { label, variant, dot } = MECHANIC_STATUS_PRESENTATION[status]

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
