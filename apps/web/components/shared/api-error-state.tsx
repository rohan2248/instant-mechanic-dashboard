"use client"

import * as React from "react"
import { PlugZapIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const MAX_BACKOFF_MS = 5 * 60_000

/**
 * The route-level failure surface.
 *
 * Retries back off exponentially (10s, 20s, 40s … capped at 5 minutes) rather
 * than at the header's polling cadence: a downed API should not be hammered
 * every ten seconds by every open tab.
 */
export function ApiErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Server Components strip error details in production, so we detect the
  // unreachable case from the message and fall back to a generic message.
  const unreachable = /reach the API|did not respond|fetch failed|ECONNREFUSED/i.test(
    error.message
  )

  const [attempt, setAttempt] = React.useState(0)
  const delayMs = Math.min(10_000 * 2 ** attempt, MAX_BACKOFF_MS)

  const onElapsed = React.useCallback(() => {
    setAttempt((n) => n + 1)
    reset()
  }, [reset])

  return (
    <Alert className="mx-auto max-w-2xl">
      {unreachable ? <PlugZapIcon /> : <TriangleAlertIcon />}
      <AlertTitle>
        {unreachable ? "Can't reach the API" : "Something went wrong"}
      </AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-3">
          <p>
            {unreachable
              ? "The dashboard reached out to the service API and got no answer. If you're running locally, check that `pnpm dev:api` is up on port 4000."
              : error.message}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAttempt((n) => n + 1)
                reset()
              }}
            >
              <RotateCwIcon data-icon="inline-start" />
              Try again
            </Button>
            {/* Keyed on `attempt` so each backoff window is a fresh mount —
                the start time comes from mount, with no state to reset. */}
            <RetryCountdown
              key={attempt}
              delayMs={delayMs}
              attempt={attempt}
              onElapsed={onElapsed}
            />
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Counts down to the next automatic retry.
 *
 * Mounted fresh per attempt (via `key`), so `startedAt` is captured at mount
 * and the remaining time is derived from it — no countdown state to reset,
 * and no ref read during render.
 */
function RetryCountdown({
  delayMs,
  attempt,
  onElapsed,
}: {
  delayMs: number
  attempt: number
  onElapsed: () => void
}) {
  const [startedAt] = React.useState(() => Date.now())
  const [now, setNow] = React.useState(startedAt)

  React.useEffect(() => {
    const countdown = window.setInterval(() => setNow(Date.now()), 1000)
    const timer = window.setTimeout(onElapsed, delayMs)
    return () => {
      window.clearInterval(countdown)
      window.clearTimeout(timer)
    }
  }, [delayMs, onElapsed])

  const retryIn = Math.max(0, Math.ceil((startedAt + delayMs - now) / 1000))

  return (
    <span className="tabular text-xs text-muted-foreground">
      Retrying automatically in {retryIn}s
      {attempt > 0 ? ` · attempt ${attempt + 1}` : null}
    </span>
  )
}
