"use client"

import * as React from "react"
import { EllipsisIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { setMechanicStatus } from "@/lib/api/actions"
import { MECHANIC_STATUSES, MECHANIC_STATUS_PRESENTATION } from "@/lib/status"
import type { MechanicListItem } from "@/types/api"

export function MechanicRowActions({
  mechanic,
  onViewDetails,
}: {
  mechanic: MechanicListItem
  onViewDetails: () => void
}) {
  const [isPending, startTransition] = React.useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            aria-label={`Actions for ${mechanic.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <EllipsisIcon />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-48"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onViewDetails}>
            View details
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Set status</DropdownMenuLabel>
          {MECHANIC_STATUSES.filter(
            (status) => status !== mechanic.status
          ).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() =>
                startTransition(async () => {
                  const result = await setMechanicStatus(mechanic.id, status)

                  if (result.ok) {
                    toast.add({
                      title: `${mechanic.name} is now ${MECHANIC_STATUS_PRESENTATION[status].label.toLowerCase()}`,
                    })
                    return
                  }

                  // The API refuses OFF_DUTY while a job is live and says how
                  // many — that count is the whole point of the error.
                  const activeJobs = (
                    result.details as { activeJobs?: number } | undefined
                  )?.activeJobs

                  toast.add({
                    title: `Couldn't update ${mechanic.name}`,
                    description: activeJobs
                      ? `They still have ${activeJobs} active job${
                          activeJobs === 1 ? "" : "s"
                        }. Reassign or complete those first.`
                      : result.message,
                  })
                })
              }
            >
              {MECHANIC_STATUS_PRESENTATION[status].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
