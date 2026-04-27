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

/**
 * Human-relative past date label (Russian).
 *
 * сегодня / вчера / N дней назад (up to 29)
 * месяц назад / 2 месяца назад (30–89 days)
 * full date "27 апр. 2026 г." (90+ days)
 *
 * Future dates are returned as a full date string unchanged.
 * Do NOT use in calendar/scheduling UI — use toLocalDateString directly there.
 */
export function formatRelativeDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return ''

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86_400_000)

  if (diffDays < 0) return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  if (diffDays === 0) return 'сегодня'
  if (diffDays === 1) return 'вчера'
  if (diffDays < 30) return `${diffDays} ${pluralDays(diffDays)} назад`

  const months = Math.floor(diffDays / 30)
  if (months < 3) return `${months} ${pluralMonths(months)} назад`

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function pluralDays(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'дней'
  if (m10 === 1) return 'день'
  if (m10 >= 2 && m10 <= 4) return 'дня'
  return 'дней'
}

function pluralMonths(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 14) return 'месяцев'
  if (m10 === 1) return 'месяц'
  if (m10 >= 2 && m10 <= 4) return 'месяца'
  return 'месяцев'
}
