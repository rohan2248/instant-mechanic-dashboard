/**
 * Every number, date and money value in the dashboard is formatted here.
 *
 * The API speaks integer paise and IST dates; the UI speaks rupees and local
 * strings. That conversion happens in exactly one place so a stray `/ 100`
 * cannot drift into a component.
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const INR_PRECISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const NUMBER = new Intl.NumberFormat("en-IN")

/** Paise -> "₹4,20,000". The only place paise become rupees. */
export function formatPaise(paise: number, precise = false) {
  const rupees = paise / 100
  return precise ? INR_PRECISE.format(rupees) : INR.format(rupees)
}

/**
 * Paise -> "₹4.2L" / "₹1.3Cr". Indian units, because the seed data is Indian
 * and "₹420K" reads as foreign to the intended user.
 */
export function formatPaiseCompact(paise: number) {
  const rupees = paise / 100
  if (rupees >= 1_00_00_000) return `₹${round(rupees / 1_00_00_000)}Cr`
  if (rupees >= 1_00_000) return `₹${round(rupees / 1_00_000)}L`
  if (rupees >= 1_000) return `₹${round(rupees / 1_000)}K`
  return INR.format(rupees)
}

function round(n: number) {
  // One decimal, but drop a trailing ".0" so tiles read "₹4L" not "₹4.0L".
  return Number(n.toFixed(1)).toString()
}

export function formatNumber(value: number) {
  return NUMBER.format(value)
}

/** 87.4 -> "87.4%" */
export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

/* -------------------------------------------------------------------------- */
/*  Dates                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Fixed to Asia/Kolkata. The API buckets "today" and `scheduledOn` in IST, so
 * rendering in the viewer's local zone would put bookings on the wrong day for
 * anyone outside India — and silently disagree with the Overview tiles.
 */
const IST = "Asia/Kolkata"

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: IST,
})

const DATE_SHORT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  timeZone: IST,
})

const TIME = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: IST,
})

export function formatDate(iso: string) {
  return DATE.format(new Date(iso))
}

/** "04 Sep" — for dense axes and table sub-lines. */
export function formatDateShort(iso: string) {
  return DATE_SHORT.format(new Date(iso))
}

export function formatTime(iso: string) {
  return TIME.format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return `${DATE.format(new Date(iso))}, ${TIME.format(new Date(iso))}`
}

/**
 * "just now" / "8s ago" / "4m ago" / "3h ago" / "2d ago".
 * Used by the activity feed and by the live-refresh pill.
 */
export function formatRelativeTime(input: string | number | Date) {
  const then = new Date(input).getTime()
  const seconds = Math.round((Date.now() - then) / 1000)

  if (!Number.isFinite(seconds)) return ""
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(new Date(then).toISOString())
}

/** Minutes -> "45m" / "1h 30m", for service durations. */
export function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/** Date -> "YYYY-MM-DD" in IST, matching the API's `from`/`to` params. */
export function toApiDate(date: Date) {
  // en-CA gives ISO-ordered parts, so this is a zone-correct YYYY-MM-DD
  // without pulling in a date library.
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: IST,
  }).format(date)
}

/** Initials for avatar fallbacks: "Arjun Mehta" -> "AM". */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
