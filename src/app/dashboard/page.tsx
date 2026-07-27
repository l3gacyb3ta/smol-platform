'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import LoginButton from '@/components/LoginButton'
import Ledger from '@/components/Ledger'
import { ProgramState } from '@/components/StateMark'
import { AxisScale, RunBar } from '@/components/RunAxis'
import { formatDateRange } from '@/lib/format'
import { buildAxis, countdown, dayNumber, daysSince } from '@/lib/runwindow'
import type { Program, ProgramStatus } from '@/lib/types'

/* ---------------------------------------------------------------------------
   Every program you can see. Mode: instrument.

   The question this page answers first is "which of these is waiting on me, and
   how long has it been waiting" — so the table is *ordered* by that rather than
   filtered by it, and the wait length is shown rather than flattened into a
   badge. Nothing is hidden: a wrapped program is still on the page, hatched, so
   you can see the shape of everything at once.

   What used to be here: a three-column grid of cards with a status pill each,
   which meant reading twelve badges to find the one that needed you.
   --------------------------------------------------------------------------- */

type FetchState = 'loading' | 'ready' | 'unauthorized' | 'failed'

/** Needs-you-first. Within a state, longest-waiting first. */
const STATE_ORDER: Record<ProgramStatus, number> = {
  pending: 0,
  accepted: 1,
  active: 2,
  archived: 3,
  deleted: 4,
}

function byUrgency(a: Program, b: Program): number {
  const state = STATE_ORDER[a.status] - STATE_ORDER[b.status]
  if (state !== 0) return state
  // Live programs sort by which closes soonest; everything else by how long it
  // has been sitting there.
  if (a.status === 'active') return dayNumber(a.endDate) - dayNumber(b.endDate)
  return dayNumber(a.createdAt) - dayNumber(b.createdAt)
}

function ProgramRow({ program, axis }: { program: Program; axis: ReturnType<typeof buildAxis> }) {
  const when = countdown(program.startDate, program.endDate)
  const closed = program.status === 'archived' || program.status === 'deleted'

  return (
    <tr className={closed ? 'row-void' : undefined}>
      <td className="program-key" style={{ backgroundColor: program.keyColor }} aria-hidden="true" />

      <td className="program-name">
        <Link href={`/programs/${program.id}`}>{program.name}</Link>
      </td>

      <td>
        <ProgramState status={program.status} waitingDays={daysSince(program.createdAt)} />
      </td>

      <td>
        <RunBar axis={axis} startDate={program.startDate} endDate={program.endDate} />
      </td>

      <td className="ledger-numeric">
        {formatDateRange(program.startDate, program.endDate) || '\u2014'}
        <span className={`countdown${when.imminent ? ' countdown-soon' : ''}`}>{when.label}</span>
      </td>

      {/* The channel only — the full host was the widest cell in the table for
          something derivable from the name, and the program page carries the
          whole resource list with an owner against each row. Whether the channel
          is a link is itself the signal: unlinked means not provisioned yet. */}
      <td className="program-links">
        {program.resources.slack ? (
          <a href={program.resources.slack} target="_blank" rel="noopener noreferrer">
            #{program.slackChannel}
          </a>
        ) : (
          <span className="tally">#{program.slackChannel}</span>
        )}
      </td>

      <td>{program.creatorName || <span className="tally">unknown</span>}</td>

      {/* Chrome on approach: absent while reading the table, present on hover and
          on keyboard focus anywhere in the row. Deleting lives on the program
          page, not behind a hover on a list — too easy to hit by accident. */}
      <td>
        <Link href={`/programs/${program.id}/edit`} className="action on-approach">
          Edit
        </Link>
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const { status: authStatus } = useSession()
  const [programs, setPrograms] = useState<Program[]>([])
  const [fetchState, setFetchState] = useState<FetchState>('loading')

  useEffect(() => {
    if (authStatus !== 'authenticated') return

    let cancelled = false
    fetch('/api/programs')
      .then(async res => {
        if (cancelled) return
        if (res.status === 401) return setFetchState('unauthorized')
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data: unknown = await res.json()
        if (cancelled) return
        setPrograms(Array.isArray(data) ? data : [])
        setFetchState('ready')
      })
      .catch(() => {
        if (!cancelled) setFetchState('failed')
      })

    return () => {
      cancelled = true
    }
  }, [authStatus])

  // Derived rather than stored, so signing out never leaves stale UI behind.
  const state: FetchState =
    authStatus === 'unauthenticated'
      ? 'unauthorized'
      : authStatus === 'loading'
        ? 'loading'
        : fetchState

  const ordered = [...programs].sort(byUrgency)
  const axis = buildAxis(ordered)

  const waiting = programs.filter(p => p.status === 'pending').length
  const settingUp = programs.filter(p => p.status === 'accepted').length
  const live = programs.filter(p => p.status === 'active').length

  return (
    <>
      <SiteHeader />

      <main className="sheet instrument">
        <div className="section-head">
          <h1>Programs</h1>
          <span className="tally">
            {state === 'ready'
              ? `${programs.length} total · ${waiting} waiting on review · ${settingUp} setting up · ${live} live`
              : 'every smol you can see'}
          </span>
        </div>

        <div className="action-row">
          <Link href="/programs/new" className="action action-strong">
            Pitch a smol
          </Link>
        </div>

        {state === 'loading' && (
          <p className="empty" role="status">
            <span className="working">Loading programs…</span>
          </p>
        )}

        {state === 'unauthorized' && (
          <div className="empty">
            <h2>Log in to see your programs</h2>
            <p>smol uses your Hack Club account — the same one you use for the Slack.</p>
            <LoginButton callbackUrl="/dashboard">Log in with Hack Club</LoginButton>
          </div>
        )}

        {state === 'failed' && (
          <div className="empty">
            <h2>Couldn&apos;t load your programs</h2>
            <p>Something went wrong between here and Airtable.</p>
            <button onClick={() => window.location.reload()} className="action">
              Try again
            </button>
          </div>
        )}

        {state === 'ready' && programs.length === 0 && (
          <div className="empty">
            <h2>No programs yet</h2>
            <p>
              Pitch your first smol and we&apos;ll set up the Slack channel, the site, the repo, and
              the submission form for you.
            </p>
            <Link href="/programs/new" className="action action-strong">
              Pitch a smol
            </Link>
          </div>
        )}

        {state === 'ready' && ordered.length > 0 && (
          <>
            <Ledger label="Every program you can see" width="wide">
              <colgroup>
                <col style={{ width: '4px' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '21%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="program-key" aria-hidden="true" />
                  <th scope="col">Program</th>
                  <th scope="col">State</th>
                  <th scope="col" aria-label="Run window, on a shared date scale">
                    <AxisScale axis={axis} />
                  </th>
                  <th scope="col">Runs</th>
                  <th scope="col">Talk in</th>
                  <th scope="col">Pitched by</th>
                  <th scope="col">
                    <span className="tally">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordered.map(program => (
                  <ProgramRow key={program.id} program={program} axis={axis} />
                ))}
              </tbody>
            </Ledger>

            {/* The legend, stated. A reader should be able to infer it from the
                table, but saying it costs one line. */}
            <p className="edition" style={{ marginTop: '12px' }}>
              Sorted by who is waiting · dashed rule marks today · hatched bars have not started ·
              hatched rows are closed
            </p>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  )
}
