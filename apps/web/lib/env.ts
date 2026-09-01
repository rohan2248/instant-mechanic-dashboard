import "server-only"

/**
 * Server-only configuration.
 *
 * `API_BASE_URL` is deliberately NOT prefixed with `NEXT_PUBLIC_`. In
 * production the web app is https on Vercel while the API is plain http on
 * EC2, so a browser fetch would be blocked as mixed content. Every API call is
 * made from a Server Component instead, which keeps the URL out of the client
 * bundle and sidesteps CORS entirely.
 */

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy apps/web/.env.example to ` +
        `apps/web/.env.local and set it (locally: http://localhost:4000/api).`
    )
  }
  return value
}

export const env = {
  /** No trailing slash, so `${API_BASE_URL}/bookings` is always well-formed. */
  API_BASE_URL: required("API_BASE_URL", process.env.API_BASE_URL).replace(
    /\/+$/,
    ""
  ),
  /** Guards against a hung upstream blocking the render indefinitely. */
  API_TIMEOUT_MS: Number(process.env.API_TIMEOUT_MS ?? 10_000),
}
