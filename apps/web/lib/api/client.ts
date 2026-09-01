import "server-only"

import { env } from "@/lib/env"
import type { ApiErrorBody } from "@/types/api"

/**
 * The one place the web app talks HTTP.
 *
 * Server-only by construction: importing this from a client component fails
 * the build rather than leaking the API origin into the bundle.
 */

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(opts: {
    status: number
    code: string
    message: string
    details?: unknown
  }) {
    super(opts.message)
    this.name = "ApiError"
    this.status = opts.status
    this.code = opts.code
    this.details = opts.details
  }

  /** True when the API never answered — process down, wrong host, timeout. */
  get isUnreachable() {
    return this.code === "UNREACHABLE" || this.code === "TIMEOUT"
  }
}

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly number[]

/**
 * Arrays are joined with commas because the API accepts CSV for its repeatable
 * params (`status`, `fuelType`). Empty and nullish values are dropped so an
 * untouched filter never narrows the query.
 */
function buildQuery(params: Record<string, QueryValue> | undefined) {
  if (!params) return ""
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      search.set(key, value.join(","))
    } else {
      search.set(key, String(value))
    }
  }

  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Next communicates dynamic bailout, `redirect()` and `notFound()` by throwing
 * tagged errors. They all carry a `digest`, and React's postpone signal is
 * tagged separately. Catch-all error handling around a `fetch` has to let
 * these through or it silently breaks rendering.
 */
function isFrameworkSignal(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false
  const candidate = error as { digest?: unknown; $$typeof?: unknown }
  return (
    typeof candidate.digest === "string" ||
    candidate.$$typeof === Symbol.for("react.postpone")
  )
}

type FetchOptions = {
  searchParams?: Record<string, QueryValue>
  method?: "GET" | "POST" | "PATCH"
  body?: unknown
}

export async function apiFetch<T>(
  path: string,
  { searchParams, method = "GET", body }: FetchOptions = {}
): Promise<T> {
  const url = `${env.API_BASE_URL}${path}${buildQuery(searchParams)}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      // Next 16 does not cache fetch by default, but an ops dashboard must
      // never serve a stale figure — so the intent is stated explicitly.
      cache: "no-store",
      signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
    })
  } catch (cause) {
    // Next signals control flow (dynamic bailout, redirect, notFound) by
    // throwing. Those must propagate untouched — wrapping one would both
    // break the framework and surface a misleading "can't reach the API".
    if (isFrameworkSignal(cause)) throw cause

    const timedOut = cause instanceof Error && cause.name === "TimeoutError"
    throw new ApiError({
      status: 0,
      code: timedOut ? "TIMEOUT" : "UNREACHABLE",
      message: timedOut
        ? `The API did not respond within ${env.API_TIMEOUT_MS}ms.`
        : "Could not reach the API.",
      details: { url, cause: (cause as Error)?.message },
    })
  }

  if (!response.ok) {
    // The API always answers with { error: { code, message, details } }, but a
    // proxy or crash can return something else — don't let parsing hide the
    // real status.
    let parsed: ApiErrorBody | undefined
    try {
      parsed = (await response.json()) as ApiErrorBody
    } catch {
      parsed = undefined
    }

    throw new ApiError({
      status: response.status,
      code: parsed?.error?.code ?? "UNKNOWN",
      message:
        parsed?.error?.message ??
        `Request failed with ${response.status} ${response.statusText}.`,
      details: parsed?.error?.details,
    })
  }

  return (await response.json()) as T
}
