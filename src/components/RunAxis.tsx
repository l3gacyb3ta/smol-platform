import type { Axis } from '@/lib/runwindow'

/**
 * The shared date scale, and one program's bar on it.
 *
 * These are ornament in the strict sense — every row states its own dates and
 * countdown as literal text, and the bars add nothing a reader couldn't get from
 * that text one row at a time. What they add is the comparison *across* rows:
 * which run is longest, which two overlap, where the gap before the next one is.
 * That is why they share one scale rather than each being drawn to fit.
 */

/** The scale itself, for a table head cell. */
export function AxisScale({ axis }: { axis: Axis }) {
  return (
    <div className="axis" aria-hidden="true">
      {axis.ticks.map(tick => (
        <span key={`${tick.label}-${tick.pct}`} className="axis-tick" style={{ left: `${tick.pct}%` }}>
          {tick.label}
        </span>
      ))}
    </div>
  )
}

/**
 * One run, plotted. Solid if it is running now, hatched if it hasn't started —
 * texture rather than a second hue, so the distinction survives a photocopy and
 * doesn't compete with the colours that mean "act on this".
 */
export function RunBar({
  axis,
  startDate,
  endDate,
}: {
  axis: Axis
  startDate: string
  endDate: string
}) {
  const { leftPct, widthPct, phase } = axis.plot(startDate, endDate)

  return (
    <div className="run" aria-hidden="true">
      <span
        className={`run-bar${phase === 'open' ? '' : ' run-bar-future'}`}
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
      {axis.todayPct !== null && (
        <span className="today-mark" style={{ left: `${axis.todayPct}%` }} />
      )}
    </div>
  )
}
