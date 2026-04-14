/**
 * Format a master's name to show only the first letter of the last name.
 * "Иван Иванов" → "Иван И."
 * "Иван" → "Иван"
 */
export function formatMasterName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed

  const parts = trimmed.split(/\s+/)
  if (parts.length <= 1) return trimmed

  const firstName = parts[0]
  const lastNameInitial = parts[1].charAt(0).toUpperCase()
  return `${firstName} ${lastNameInitial}.`
}
