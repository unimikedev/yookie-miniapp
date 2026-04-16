/**
 * Russian pluralization helper.
 *
 * Usage: pluralize(5, ['услуга', 'услуги', 'услуг'])
 *  1 → "1 услуга"
 *  2 → "2 услуги"
 *  5 → "5 услуг"
 *  21 → "21 услуга"
 *  22 → "22 услуги"
 *  11 → "11 услуг"
 */
export function pluralize(
  count: number,
  forms: [one: string, few: string, many: string]
): string {
  const abs = Math.abs(count) % 100
  const lastDigit = abs % 10

  // 11-19 → many form
  if (abs > 10 && abs < 20) return `${count} ${forms[2]}`

  if (lastDigit === 1) return `${count} ${forms[0]}`
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} ${forms[1]}`
  return `${count} ${forms[2]}`
}
