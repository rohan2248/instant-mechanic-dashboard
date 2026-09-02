# Instant Mechanic — Operations Dashboard

Live URL -- https://instant-mechanic-dashboard-web.vercel.app/

An internal operations dashboard for an on-demand vehicle service business. Customers book a
service, a mechanic is dispatched, and the job moves through a lifecycle until it is completed or
cancelled. This project is the back-office view of that business: the screen an ops team keeps open
all day to see what is happening right now and to act on it.

## Project Overview

The product problem is dispatch. At any moment there are bookings waiting for a mechanic, mechanics
sitting idle, and jobs mid-flight — and the cost of getting that wrong is a customer waiting on a
roadside. So the dashboard is built around four things:

- **Overview** — headline tiles (bookings today, open jobs, revenue, completion rate, mechanic
  utilisation), a status summary, and a live activity feed of every status change.
- **Bookings** — a filterable, sortable, paginated table over the full booking history, with a
  slide-over detail sheet showing the vehicle, the customer, and the full event timeline. Rows can
  be assigned, advanced through the lifecycle, or cancelled inline.
- **Mechanics** — roster with live status (available / on job / off duty), completed-job counts, and
  the job each mechanic is currently on.
- **Analytics** — bookings and revenue over time, revenue split by service category, top services,
  and a booking-status breakdown.

Two decisions shaped most of the code:

**The booking lifecycle is a real state machine, enforced server-side.** `PENDING → ASSIGNED →
ON_THE_WAY → IN_PROGRESS → COMPLETED`, with `CANCELLED` reachable from any non-terminal state and
`ASSIGNED → PENDING` as the un-assign path. The UI only offers legal transitions, but the API is the
authority — an illegal move returns `409` with the list of allowed transitions, so a stale browser
tab losing a race gets a correct, actionable error instead of corrupting the record. Every
transition writes a `BookingEvent` row, which is what makes the activity feed and the per-booking
timeline possible without a separate audit system.

**Money is stored as integer paise, never as a float.** Rupee amounts as floating point round wrong
the moment they are summed for revenue, and revenue is the number the business actually cares about.
Formatting to `₹` happens once, at the display layer.

## Tech Stack

| Layer      | Choice                                                                            |
| ---------- | --------------------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router, React Server Components), React 19, TypeScript            |
| UI         | Tailwind CSS v4, shadcn/ui on Base UI, Lucide icons, `next-themes` for light/dark |
| Tables     | TanStack Table v9, with all filter/sort/page state driven from the URL            |
| Charts     | Recharts 3                                                                        |
| Backend    | Node.js + Express 5, TypeScript (run via `tsx`)                                   |
| Validation | Zod 4 — at the HTTP boundary for requests, and for environment config at boot     |
| ORM        | Prisma 7 with the `@prisma/adapter-pg` driver adapter (`pg` pool)                 |
| Database   | PostgreSQL (Neon, serverless)                                                     |
| Monorepo   | pnpm workspaces (`apps/web`, `apps/api`)                                          |
| Hosting    | Vercel (web) + AWS EC2 with PM2 (API) + Neon (database)                           |

## Architecture

```
Browser
   │  HTML + RSC payload only — no API calls from the client
   ▼
Next.js server (Vercel)
   │  Server Components fetch; Server Actions mutate
   │  fetch(API_BASE_URL + path), cache: "no-store", 10s timeout
   ▼
Express API (AWS EC2, PM2)
   │  routes → controller (Zod parse) → service (business rules) → Prisma
   ▼
Prisma 7 + pg driver adapter
   │  single client per process, pooled connections
   ▼
PostgreSQL (Neon)
```

**Request path.** Every page is a Server Component. It reads its filters from the URL search params,
calls `lib/api/queries.ts`, which goes through the single `apiFetch` helper in
[client.ts](apps/web/lib/api/client.ts), and renders. The browser never talks to the Express API
directly.

That is deliberate. In production the web app is HTTPS on Vercel while the API is plain HTTP on EC2,
so a browser `fetch` would be blocked as mixed content. Fetching server-side sidesteps that, keeps
CORS out of the picture for normal reads, and keeps the API origin out of the client bundle —
`API_BASE_URL` is intentionally _not_ prefixed with `NEXT_PUBLIC_`, and both `lib/api/client.ts` and
`lib/env.ts` are marked `server-only` so importing them from a client component fails the build
rather than leaking the origin.

**Mutations** go through Server Actions in [actions.ts](apps/web/lib/api/actions.ts). Each action
calls the API, then `revalidatePath("/", "layout")` — a status change moves the Overview tiles and
the mechanic's current job, not just the row that was clicked, so the whole tree is revalidated
rather than one route.

**Liveness** is a polling contract. `LiveRefreshProvider` re-runs the server render on
an interval the user picks in the header (off / 10s / 30s / 60s, persisted to `localStorage`).
Widgets consume it through the `useLiveRefresh` hook and never touch the provider's internals, so
the interval can later be swapped for a subscription without changing a single page, table, or
chart.

**API layering.** Each domain is one folder under `apps/api/src/modules/` with the same four files:

- `*.routes.ts` — path → controller wiring only.
- `*.controller.ts` — parses `req.query` / `req.body` / `req.params` with Zod. Express 5 forwards
  rejected promises to the error handler on its own, so no handler carries a `try/catch`.
- `*.service.ts` — business rules and Prisma queries.
- `*.model.ts` — the API contract: request schemas plus the Prisma `select` shapes and the mappers
  that turn rows into responses. Response types are _derived_ from the selects via
  `Prisma.BookingGetPayload<…>`, so changing a select immediately fails the mapper that no longer
  matches it.

Errors converge on one middleware ([error-handler.ts](apps/api/src/middleware/error-handler.ts))
that maps `ZodError` → `400 VALIDATION_FAILED`, `AppError` subclasses → their own status, and Prisma
codes (`P2002`/`P2003`/`P2025`) → `409`/`400`/`404`. Every error response has the same shape:

```json
{ "error": { "code": "CONFLICT", "message": "…", "details": {} } }
```

## Local Setup

**Prerequisites:** Node.js 20+, pnpm 11 (`corepack enable`), and a PostgreSQL 15+ database. A free
[Neon](https://neon.tech) project is the fastest option; a local Postgres works too.

```bash
# 1. Clone and install (installs both apps from the workspace root)
git clone <repo-url>
cd instant-mechanic-dashboard
pnpm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env         # then fill in DATABASE_URL
cp apps/web/.env.example apps/web/.env.local   # defaults are correct for local dev

# 3. Set up the database
pnpm db:generate    # generate the Prisma client
pnpm db:migrate     # apply migrations
pnpm db:seed        # load demo data

# 4. Run both apps together
pnpm dev
```

- Web → http://localhost:3000
- API → http://localhost:4000/api
- Health check → http://localhost:4000/api/health

To run one side alone: `pnpm dev:web` or `pnpm dev:api`.

**The seed data.** `faker` is seeded with a fixed value, so every run produces the identical dataset:
60 customers with vehicles, 24 mechanics, a service catalogue across categories, and 600 bookings —
526 across 90 days of history, 14 scheduled for today, and 60 upcoming — with a plausible status
distribution and a full event trail per booking. Amounts and names are India-localised, and dates
are bucketed in IST so "today" on the dashboard means today for the ops team. Deterministic seeding
is what makes `pnpm --filter api db:reset && pnpm db:seed` a real recovery path rather than a
"hope the numbers look similar" one.

**Other scripts:** `pnpm build` (build both apps), `pnpm lint`, `pnpm db:studio` (Prisma Studio),
`pnpm --filter api db:verify` (cross-checks the dashboard aggregates against raw row counts),
`pnpm --filter api db:deploy` (apply migrations without prompting — this is the production one).

## Environment Variables

### `apps/api/.env`

| Variable       | Required | Default       | Description                                                                                                                          |
| -------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | yes      | —             | PostgreSQL connection string. Must be `postgres://` or `postgresql://`. For Neon, include `?sslmode=require`.                        |
| `PORT`         | no       | `4000`        | Port the Express server binds to.                                                                                                    |
| `CORS_ORIGIN`  | no       | `*`           | Comma-separated list of allowed origins. Set to the deployed Vercel URL in production; `*` is a local-development default only.      |
| `NODE_ENV`     | no       | `development` | `development` \| `test` \| `production`. Production suppresses request logging and strips internal error details from 500 responses. |

These are parsed once at import time by [config/env.ts](apps/api/src/config/env.ts). A misconfigured
deploy fails at boot with a readable message listing every bad field, instead of throwing on the
first request that happens to need a value. The `.env` is resolved relative to the source file, not
`process.cwd()`, so the API loads it whether it is started from the package directory, the workspace
root, or PM2.

### `apps/web/.env.local`

| Variable         | Required | Default | Description                                                                                                                                                                       |
| ---------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_BASE_URL`   | yes      | —       | Base URL of the Express API **including** the `/api` prefix, e.g. `http://localhost:4000/api`. Deliberately not `NEXT_PUBLIC_` — see Architecture. Trailing slashes are stripped. |
| `API_TIMEOUT_MS` | no       | `10000` | How long a single API call may block a server render before it fails as `TIMEOUT`.                                                                                                |

No `.env` file is committed; only the `.env.example` files are tracked.

## API Documentation

Base URL: `{API_BASE_URL}` → `http://localhost:4000/api` locally. All responses are JSON.

List endpoints share one envelope and one pagination contract — `page` (default `1`) and `pageSize`
(default `25`, hard ceiling `100`, which is the only thing stopping a caller from asking for all 600
bookings at once):

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 25, "total": 600, "totalPages": 24 }
}
```

Repeatable filters accept comma-separated values (`?status=PENDING,ASSIGNED`).

### Health

| Method | Path      | Description                                                                                                                                                      |
| ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/health` | Liveness plus a real `SELECT 1` round trip to the database. `200` when reachable, `503 { status: "degraded" }` when not. Used by the deploy check and by humans. |

### Dashboard — read-only aggregates

| Method | Path                             | Query                       | Description                                                                                                                                                                                                                                                                                                     |
| ------ | -------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/dashboard/overview`            | —                           | Headline tiles: total/today/open/completed/cancelled bookings, `revenuePaise`, active vs total mechanics, new customers this month and rolling 30 days, and `completionRate`. Cancellations are excluded from the completion-rate denominator — a job nobody asked us to finish is not one we failed to finish. |
| `GET`  | `/dashboard/bookings-by-status`  | —                           | Count, summed amount, and percentage share per status. Every status is always present so the chart legend never reshuffles.                                                                                                                                                                                     |
| `GET`  | `/dashboard/timeseries`          | `days` (1–365, default 30)  | Daily buckets of booking count and completed revenue, IST-aligned, with empty days filled in.                                                                                                                                                                                                                   |
| `GET`  | `/dashboard/top-services`        | `limit` (1–50, default 5)   | Most-booked services with volume and revenue.                                                                                                                                                                                                                                                                   |
| `GET`  | `/dashboard/revenue-by-category` | —                           | Completed revenue grouped by service category.                                                                                                                                                                                                                                                                  |
| `GET`  | `/dashboard/activity`            | `limit` (1–100, default 20) | Most recent booking status transitions, from the `BookingEvent` table — the live feed on the Overview page.                                                                                                                                                                                                     |

### Bookings

| Method  | Path                   | Description                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/bookings`            | Filter by `status` (CSV), `mechanicId`, `customerId`, `serviceId`, `from`/`to` (inclusive calendar-date window over the scheduled date), and `q` (free text over booking reference, customer name, and vehicle registration). Sort with `sortBy` = `scheduledAt` \| `createdAt` \| `amountPaise` \| `status` and `sortDir`. |
| `GET`   | `/bookings/:id`        | Full detail: customer, vehicle, service, mechanic, and the complete ordered event timeline.                                                                                                                                                                                                                                 |
| `POST`  | `/bookings`            | Create. Body: `customerId`, `vehicleId`, `serviceId`, optional `mechanicId` (a booking can be taken before anyone is free), `scheduledAt`, optional `amountPaise` (defaults to the service list price) and `note`. Returns `201`.                                                                                           |
| `PATCH` | `/bookings/:id/status` | Advance the lifecycle. Body: `{ status, note? }`. Validated against the state machine — an illegal move returns `409` with `{ from, to, allowed[] }`. Moving past `ASSIGNED` requires a mechanic.                                                                                                                           |
| `PATCH` | `/bookings/:id/assign` | Assign or reassign. Body: `{ mechanicId, note? }`; `mechanicId: null` un-assigns and returns the booking to the pending queue.                                                                                                                                                                                              |
| `POST`  | `/bookings/:id/cancel` | Cancel with an optional `reason`, recorded on the event.                                                                                                                                                                                                                                                                    |

Every write that changes status appends a `BookingEvent` with `fromStatus`, `toStatus`, and the
note, inside the same transaction as the update.

### Mechanics

| Method  | Path                    | Description                                                                                                                                                                 |
| ------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/mechanics`            | Filter by `status` (CSV) and `q`; sort by `name`, `hiredAt`, or `completedJobs`. Each row carries the completed-job count and the job the mechanic is on right now, if any. |
| `GET`   | `/mechanics/:id`        | Detail with recent job history.                                                                                                                                             |
| `PATCH` | `/mechanics/:id/status` | Set `AVAILABLE` \| `ON_JOB` \| `OFF_DUTY`. Going off duty while holding active jobs is refused with `409` and the offending `activeJobs` in `details`.                      |

`AVAILABLE` and `ON_JOB` are derived, not typed in: after any booking write the mechanic's status is
recomputed from whether they still hold an active job. `OFF_DUTY` is left alone — it is a human
decision about a shift, not a consequence of the board — and assigning work to an off-duty mechanic
is refused with a `409`.

### Customers, vehicles, catalogue

| Method | Path                      | Description                                                                                                                                                                                          |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/customers`              | Paginated. `q` searches name, email, and phone; also filterable by `city`; sort by `name` or `createdAt`.                                                                                            |
| `GET`  | `/customers/:id`          | Detail with booking summary.                                                                                                                                                                         |
| `GET`  | `/customers/:id/vehicles` | Vehicles belonging to one customer.                                                                                                                                                                  |
| `GET`  | `/vehicles`               | Paginated; filter by `customerId` and `fuelType` (CSV), with `q` over registration, make, and model.                                                                                                 |
| `GET`  | `/vehicles/:id`           | Detail with owner and service history.                                                                                                                                                               |
| `GET`  | `/services`               | Service catalogue with category, base price, and duration. Filter by `categoryId`, `categorySlug`, or `isActive`. Unpaginated — the catalogue is small and the UI wants all of it for its dropdowns. |
| `GET`  | `/service-categories`     | Categories, each with its service count.                                                                                                                                                             |
| `GET`  | `/meta/enums`             | Every enum the UI needs — booking statuses, mechanic statuses, fuel types — so filter dropdowns are never hard-coded against a copy of the schema.                                                   |

### Error codes

| Status | Code                | Meaning                                                                                                |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `400`  | `VALIDATION_FAILED` | Zod rejected the request; `details` holds per-field messages.                                          |
| `400`  | `INVALID_REFERENCE` | A referenced row does not exist (FK violation).                                                        |
| `404`  | `NOT_FOUND`         | No such record, or no route for that method and path.                                                  |
| `409`  | `CONFLICT`          | Legal request, illegal state — e.g. an invalid status transition. `details` carries what _is_ allowed. |
| `409`  | `DUPLICATE`         | Unique constraint violated.                                                                            |
| `500`  | `INTERNAL_ERROR`    | A bug. Logged in full server-side; the response never leaks query internals or the connection string.  |

## Deployment

Three pieces, deployed independently.

**Database — Neon (serverless Postgres).** Provisioned in the same AWS region as the EC2 instance to
keep query latency low. The connection string goes into `DATABASE_URL` with `sslmode=require`.
Schema is applied with `prisma migrate deploy` (never `migrate dev`) from the server.

**API — AWS EC2 + PM2.** A `t3.micro` Ubuntu instance with a security group allowing SSH (via EC2
Instance Connect) and the API port. Deployment is: clone the repo, `pnpm install`, write
`apps/api/.env` with the Neon URL and `CORS_ORIGIN` set to the Vercel domain, then
`pnpm --filter api db:generate && pnpm --filter api db:deploy && pnpm --filter api db:seed`, and
finally start the process under PM2 with `pm2 startup` + `pm2 save` so it survives reboots and
detached terminals. The server installs `SIGINT`/`SIGTERM` handlers that drain in-flight requests
and call `prisma.$disconnect()` before exit, so a PM2 restart never leaves sockets open against
Neon. `GET /api/health` is the smoke test after every deploy.

**Web — Vercel.** Imported from the repo with **root directory `apps/web`**, which is what makes
Vercel build only the Next.js app out of the pnpm workspace. `API_BASE_URL` is set as an environment
variable in the Vercel project (not `NEXT_PUBLIC_`). Because every fetch is server-side, the
browser never makes a cross-origin request in normal operation and the HTTPS-page/HTTP-API mixed
content problem never arises.

**The one ordering gotcha:** the API's `CORS_ORIGIN` can only be set after the Vercel domain exists,
so the sequence is deploy the API → deploy the web app → update `CORS_ORIGIN` on EC2 → `pm2 restart`.

## AI Usage

I used Claude throughout this build for code an design
discussion before writing code.

**What I used it for.** Mostly as an accelerator on the parts that are well-understood but tedious:
scaffolding the repetitive four-file module structure across the six API domains once I'd settled on
the pattern, generating the Prisma `select` shapes and their response mappers, writing the
deterministic seed script (600 bookings with a believable status distribution and event trail is a
lot of fiddly generation code), building out the shadcn/ui component layer and the chart components,
and drafting this README from the actual source. I also used it heavily as a debugging partner
during the EC2 deployment, where the failures were environmental — a missing `npm` on the PATH after
a Node install, pnpm aborting under a lifecycle-script check, an AWS security-group rule that
wouldn't accept a managed prefix list alongside an existing CIDR rule.

**What I decided and implemented myself.** The data model and the schema — the tables, the enums,
the index choices on `Booking`, storing money as integer paise, and the decision to model status
history as a separate `BookingEvent` table rather than a mutable field — are mine. So is the booking
state machine: which transitions are legal, that un-assigning drops a booking back to `PENDING`,
that a rejected transition is a `409` and not a `400`, and that the error should return the allowed
set so the UI can recover. The architectural call that the browser never talks to the API directly —
server-side fetch only, `server-only` guards on the API client, `API_BASE_URL` deliberately not
public — was mine, driven by the mixed-content constraint of an HTTPS Vercel frontend against an
HTTP EC2 backend, and it's the decision the whole frontend data layer is shaped around. The
polling-based live-refresh design behind a hook-shaped contract, the URL-as-state approach for the
tables, the IST date bucketing so "today" means today for the ops team, and the whole deployment
topology were also mine.

**How I worked with it.** I used plan mode before letting claude do any changes in my codebase. I reviewed every file, rewrote the parts that didn't match the conventions I'd set.
afterwards — spacing, chart colour tokens, the sidebar and header treatment, the empty and error
states. Both apps typecheck and lint clean and the production build passes, and I verified the
deployed stack end-to-end by watching real Neon data render through the EC2 API into the dashboard.
