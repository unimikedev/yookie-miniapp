/**
 * Date utilities for the booking flow.
 * All dates in the booking API are LOCAL (Tashkent) YYYY-MM-DD strings,
 * never UTC-derived. Using toISOString().split('T')[0] is a bug because
 * it shifts the date for any client not in UTC.
 */

/**
 * Format a Date as YYYY-MM-DD in the user's LOCAL timezone.
 * Use this for date pickers, URL params, and anywhere a "calendar date"
 * is needed.
 */
export function toLocalYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Get today's date as YYYY-MM-DD (local).
 */
export function todayLocalYMD(): string {
  return toLocalYMD(new Date())
}

/**
 * Add N days to a YYYY-MM-DD date string and return a new YYYY-MM-DD string.
 */
export function addDaysLocal(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return toLocalYMD(dt)
}
