/**
 * A program's run window, and the shared date axis several of them are plotted
 * against.
 *
 * The homepage and the dashboard both used to answer "when does this run?" with
 * two dates per card, which makes duration, overlap and "what's next" a
 * subtraction the reader has to do in their head. Plotting every program on one
 * scale with today marked makes all three preattentive instead.
 *
 * Everything here is pure arithmetic on `YYYY-MM-DD` strings so it can run at
 * render time on the server, with no client-side date library.
 */

const MS_PER_DAY = 86_400_000

/**
 * Days since the epoch for a date. Accepts a plain `YYYY-MM-DD` (what Airtable
 * date fields return) or a full ISO timestamp, and reads both in UTC — these are
 * calendar dates, not instants, so parsing them in the viewer's zone is what
 * makes a start date render as the day before for anyone west of GMT.
 */
export function dayNumber(value: string): number {
  if (!value) return NaN
  const [year, month, day] = value.split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return NaN
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

/** Today as a day number, in UTC, to match `dayNumber`. */
export function todayNumber(now: Date = new Date()): number {
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / MS_PER_DAY
  )
}

/** Whole days between two `YYYY-MM-DD` values. Negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from)
}

/** Whole days since a timestamp, for "waiting on review for 3 days". */
export function daysSince(value: string, now: Date = new Date()): number {
  const then = dayNumber(value)
  return Number.isNaN(then) ? 0 : todayNumber(now) - then
}

/** "3 days", "1 day", "today" — the age half of a wait, without the verb. */
export function ageInDays(days: number): string {
  if (days <= 0) return 'today'
  return days === 1 ? '1 day' : `${days} days`
}

/** A day number back to `YYYY-MM-DD`, which is what a date input wants. */
export function isoDate(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10)
}

/** `YYYY-MM-DD` shifted by whole days. */
export function addDays(value: string, days: number): string {
  const day = dayNumber(value)
  return Number.isNaN(day) ? '' : isoDate(day + days)
}

/**
 * The next Monday, as the default start for a new program.
 *
 * Every smol so far has started on a Monday, because a run that starts midweek
 * spends its first weekend already half over. This is a prediction the pitch form
 * fills in rather than a rule — it's a date input, so typing over it costs
 * nothing, and correcting a guess is much cheaper than specifying from nothing.
 */
export function nextMonday(now: Date = new Date()): string {
  const today = todayNumber(now)
  // Day number 0 was Thursday 1 Jan 1970, so `(n + 3) % 7` is 0 on Mondays.
  const daysPastMonday = (today + 3) % 7
  return isoDate(today + (7 - daysPastMonday))
}

export type RunPhase = 'future' | 'open' | 'past'

export interface Countdown {
  phase: RunPhase
  /** Days until the next boundary — the open date, or the close date. */
  days: number
  /** The whole thing as a sentence: "closes in 18 days". */
  label: string
  /** True inside the last week of an open run, or the week before one opens. */
  imminent: boolean
}

/**
 * Where a run sits relative to today, said in words. This is the text that
 * carries the meaning; the bar on the axis is the redundant encoding.
 */
export function countdown(startDate: string, endDate: string, now: Date = new Date()): Countdown {
  const today = todayNumber(now)
  const start = dayNumber(startDate)
  const end = dayNumber(endDate)

  if (!Number.isNaN(start) && today < start) {
    const days = start - today
    return {
      phase: 'future',
      days,
      label: days === 1 ? 'opens tomorrow' : `opens in ${days} days`,
      imminent: days <= 7,
    }
  }

  if (Number.isNaN(end)) {
    return { phase: 'open', days: Infinity, label: 'open-ended', imminent: false }
  }

  if (today > end) {
    const days = today - end
    return {
      phase: 'past',
      days,
      label: days === 1 ? 'closed yesterday' : `closed ${days} days ago`,
      imminent: false,
    }
  }

  const days = end - today
  return {
    phase: 'open',
    days,
    label: days === 0 ? 'closes today' : days === 1 ? 'closes tomorrow' : `closes in ${days} days`,
    imminent: days <= 7,
  }
}

export interface AxisTick {
  label: string
  /** Position along the axis, 0–100. */
  pct: number
}

export interface RunPlot {
  /** Left edge of the bar, 0–100. */
  leftPct: number
  /** Bar width, 0–100. Never zero, so a one-day run is still visible. */
  widthPct: number
  phase: RunPhase
}

export interface Axis {
  ticks: AxisTick[]
  /** Where today falls on the axis, 0–100, or null if it is off-scale. */
  todayPct: number | null
  /** Plot one program's run against this axis. */
  plot: (startDate: string, endDate: string) => RunPlot
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Builds one date scale wide enough to hold every run passed in, plus today.
 *
 * The domain is padded by a couple of days at each end so a bar never sits flush
 * against the edge of its column, where it would read as continuing off-screen.
 */
export function buildAxis(
  runs: Array<{ startDate: string; endDate: string }>,
  now: Date = new Date()
): Axis {
  const today = todayNumber(now)
  const bounds = runs
    .flatMap(r => [dayNumber(r.startDate), dayNumber(r.endDate)])
    .filter(n => !Number.isNaN(n))

  const rawStart = Math.min(today, ...bounds)
  const rawEnd = Math.max(today, ...bounds)
  // A degenerate domain (one program, one day) would divide by zero.
  const pad = Math.max(2, Math.round((rawEnd - rawStart) * 0.04))
  const start = rawStart - pad
  const span = Math.max(1, rawEnd + pad - start)

  const pctOf = (day: number) => ((day - start) / span) * 100

  // Ticks on month boundaries. Anything narrower would need week numbers, which
  // nobody reads; anything wider stops being a scale.
  const ticks: AxisTick[] = []
  const firstDate = new Date(start * MS_PER_DAY)
  const cursor = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1))
  while (Math.floor(cursor.getTime() / MS_PER_DAY) <= start + span) {
    const day = Math.floor(cursor.getTime() / MS_PER_DAY)
    if (day >= start) {
      ticks.push({ label: MONTHS[cursor.getUTCMonth()], pct: pctOf(day) })
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return {
    ticks,
    todayPct: pctOf(today),
    plot(startDate, endDate) {
      const from = dayNumber(startDate)
      const to = dayNumber(endDate)
      const phase: RunPhase =
        !Number.isNaN(from) && today < from ? 'future' : !Number.isNaN(to) && today > to ? 'past' : 'open'

      const left = Number.isNaN(from) ? today : from
      const right = Number.isNaN(to) ? Math.max(left + 1, today) : Math.max(to, left + 1)

      return { leftPct: pctOf(left), widthPct: pctOf(right) - pctOf(left), phase }
    },
  }
}
