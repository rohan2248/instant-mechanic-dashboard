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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import {
  assignMechanic,
  cancelBooking,
  updateBookingStatus,
  type ActionResult,
} from "@/lib/api/actions"
import { BOOKING_STATUS_PRESENTATION, LEGAL_TRANSITIONS } from "@/lib/status"
import type { BookingListItem, BookingStatus, MechanicOption } from "@/types/api"

/**
 * Per-row lifecycle actions.
 *
 * Only transitions the API will accept are offered, mirrored from
 * `booking.state.ts`. That is a courtesy, not a guarantee: another operator
 * can move the same booking between this page rendering and the click
 * landing, so a rejection is still handled properly below.
 */
export function BookingRowActions({
  booking,
  mechanics,
  onViewDetails,
}: {
  booking: BookingListItem
  mechanics: MechanicOption[]
  onViewDetails: () => void
}) {
  const [isPending, startTransition] = React.useTransition()

  const allowed = LEGAL_TRANSITIONS[booking.status]
  const isTerminal = allowed.length === 0

  /**
   * The status graph is not the whole story: the API also refuses ASSIGNED
   * on a booking with no mechanic ("Assign a mechanic before moving this
   * booking to ASSIGNED"), and assigning one *itself* moves the booking to
   * ASSIGNED. So offering it as a bare status move would be a button that
   * can only fail — the assign submenu is the real path.
   */
  const statusMoves = allowed.filter(
    (status) =>
      status !== "CANCELLED" && !(status === "ASSIGNED" && !booking.mechanic)
  )

  // Off-duty mechanics are rejected by the API, so they aren't offered here.
  // The mechanics page is where duty status gets changed.
  const assignable = mechanics.filter(
    (mechanic) =>
      mechanic.status !== "OFF_DUTY" && mechanic.id !== booking.mechanic?.id
  )

  function apply(label: string, fn: () => Promise<ActionResult<unknown>>) {
    startTransition(async () => {
      const result = await fn()

      if (result.ok) {
        toast.add({ title: label })
        return
      }

      // A 409 carries the only information that makes the failure actionable
      // — which moves were legal, or how many jobs are blocking. Surface it
      // instead of collapsing everything into "something went wrong".
      const details = result.details as
        | { allowed?: BookingStatus[]; activeJobs?: number }
        | undefined

      const description = details?.allowed?.length
        ? `Now allowed: ${details.allowed
            .map((status) => BOOKING_STATUS_PRESENTATION[status].label)
            .join(", ")}. Refresh to see the current state.`
        : result.message

      toast.add({ title: `Couldn't ${label.toLowerCase()}`, description })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            aria-label={`Actions for ${booking.reference}`}
            // The row itself opens the sheet; the menu must not also do that.
            onClick={(event) => event.stopPropagation()}
          >
            <EllipsisIcon />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onViewDetails}>
            View details
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {isTerminal ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              {BOOKING_STATUS_PRESENTATION[booking.status].label} is final — no
              further changes.
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        ) : (
          <>
            {statusMoves.length > 0 ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                  {statusMoves.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() =>
                        apply(
                          `Moved ${booking.reference} to ${BOOKING_STATUS_PRESENTATION[status].label}`,
                          () => updateBookingStatus(booking.id, status)
                        )
                      }
                    >
                      {BOOKING_STATUS_PRESENTATION[status].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
              </>
            ) : null}

            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {booking.mechanic ? "Reassign mechanic" : "Assign mechanic"}
                  {!booking.mechanic && booking.status === "PENDING"
                    ? " → Assigned"
                    : null}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                  <DropdownMenuGroup>
                    {booking.mechanic ? (
                      <DropdownMenuItem
                        onClick={() =>
                          apply(`Unassigned ${booking.reference}`, () =>
                            assignMechanic(booking.id, null)
                          )
                        }
                      >
                        Unassign
                      </DropdownMenuItem>
                    ) : null}
                    {assignable.map((mechanic) => (
                      <DropdownMenuItem
                        key={mechanic.id}
                        onClick={() =>
                          apply(
                            `Assigned ${booking.reference} to ${mechanic.name}`,
                            () => assignMechanic(booking.id, mechanic.id)
                          )
                        }
                      >
                        {mechanic.name}
                      </DropdownMenuItem>
                    ))}
                    {assignable.length === 0 ? (
                      <DropdownMenuLabel className="font-normal text-muted-foreground">
                        No on-duty mechanics available.
                      </DropdownMenuLabel>
                    ) : null}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  apply(`Cancelled ${booking.reference}`, () =>
                    cancelBooking(booking.id, "Cancelled from dashboard")
                  )
                }
              >
                Cancel booking
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
