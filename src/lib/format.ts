/**
 * Formats a date for display. Accepts either a plain `YYYY-MM-DD` date (what
 * Airtable date fields return) or a full ISO timestamp.
 *
 * Plain dates are parsed as local time on purpose: `new Date('2026-03-01')`
 * parses as UTC midnight, which renders as Feb 28 for anyone west of GMT.
 */
export function formatDate(value: string): string {
  if (!value) return ''
  const [datePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return ''
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Renders a start/end pair as "Mar 1 – Apr 15, 2026", collapsing repeated parts. */
export function formatDateRange(start: string, end: string): string {
  const from = formatDate(start)
  const to = formatDate(end)
  if (!from) return to
  if (!to) return from
  // Drop the year from the start date when both fall in the same year.
  const [fromYear, toYear] = [from.slice(-4), to.slice(-4)]
  return fromYear === toYear ? `${from.slice(0, -6)} – ${to}` : `${from} – ${to}`
}
