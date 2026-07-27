import type { ReactNode } from 'react'

/**
 * A table of records, in the box that keeps it from dragging the page sideways.
 *
 * Every ledger in the app goes through here, for three reasons:
 *
 *  - a table too wide for the sheet scrolls inside its own container, so the page
 *    body never scrolls horizontally;
 *  - the container shows a hatched edge on whichever side has content off-screen,
 *    so it's visible that there is more to see — see `.ledger-scroll`, which does
 *    it with four background layers and no script;
 *  - a scrollable region needs a keyboard path, so it is focusable and named.
 *
 * `width` picks the minimum the columns need before scrolling starts. It has to
 * match what the table's own `<colgroup>` is dividing up — a ledger with eight
 * columns cannot be read at 420px however hard it tries.
 */
export default function Ledger({
  label,
  width = 'default',
  stacked = false,
  children,
}: {
  /** Names the region for anyone arriving by keyboard or screen reader. */
  label: string
  width?: 'narrow' | 'default' | 'wide'
  /**
   * Below 860px this ledger becomes one stacked record per row rather than
   * scrolling. Only the public program table does this — an instrument pans.
   */
  stacked?: boolean
  children: ReactNode
}) {
  const classes = ['ledger']
  if (width !== 'default') classes.push(`ledger-${width}`)
  if (stacked) classes.push('ledger-stacked')

  return (
    <div className="ledger-scroll" tabIndex={0} role="region" aria-label={label}>
      <table className={classes.join(' ')}>{children}</table>
    </div>
  )
}
