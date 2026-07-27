'use client'

import { useState, useEffect } from 'react'
import Blank from '@/components/Blank'
import Ledger from '@/components/Ledger'
import { SubmissionState } from '@/components/StateMark'
import type { Submission } from '@/lib/airtable-submissions'

/* ---------------------------------------------------------------------------
   The review queue. Mode: instrument.

   This looks like a tool for flipping approval flags. It is a tool for
   understanding what got submitted; the flag flip is one click at the end of a
   long look. So the design question is not "where do the buttons go" but "what
   does a reviewer need on screen to answer 'is this real'".

   Their questions, and where each one is answered in a row:

     is this real, or a template with the name changed   the screenshot, and the
                                                         description in full
     did they put the hours in                           the hour bar, scaled
                                                         against every other row
     did they give me enough to check                    the evidence column,
                                                         which states what is
                                                         *missing* as well as
                                                         what is there
     how does this compare to the last five             it is a table, so: by eye

   What used to be here: a two-column grid of cards, each with a truncated
   two-line description, an hour count as bare text, and the screenshot behind a
   click. Comparing two submissions meant scrolling between two cards and holding
   the first one in your head.
   --------------------------------------------------------------------------- */

type Filter = 'all' | 'Pending' | 'Accepted' | 'Rejected'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'Pending', label: 'Needs review' },
  { key: 'Accepted', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'all', label: 'Everything' },
]

const EMPTY_COPY: Record<Filter, string> = {
  Pending: 'Nothing waiting on you. Enjoy it.',
  Accepted: 'Nothing approved yet.',
  Rejected: 'Nothing rejected — nice.',
  all: 'No submissions yet. They land here the moment someone ships.',
}

function hackatimeApiUrl(projectUrl: string): string | null {
  try {
    const { pathname } = new URL(projectUrl)
    // format: /@username/project/project-name
    const m = pathname.match(/\/@([^/]+)\/project\/([^/]+)/)
    if (!m) return null
    return `https://hackatime.smol.hackclub.com/api/v1/users/${m[1]}/project/${m[2]}`
  } catch {
    return null
  }
}

/**
 * Hackatime totals for every visible submission, fetched once and held here
 * rather than in each row.
 *
 * That's not tidiness — the bars are scaled against the largest total in the set,
 * so the scale has to be known in one place or every bar means something
 * different from its neighbour.
 */
function useHackatimeHours(submissions: Submission[]) {
  const [hours, setHours] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false

    for (const sub of submissions) {
      const api = sub.hackatimeProject ? hackatimeApiUrl(sub.hackatimeProject) : null
      if (!api) continue
      fetch(api)
        .then(r => r.json())
        .then((d: { total_seconds?: unknown }) => {
          const seconds = d.total_seconds
          if (cancelled || typeof seconds !== 'number') return
          setHours(prev => ({ ...prev, [sub.id]: seconds / 3600 }))
        })
        .catch(() => {
          // A missing Hackatime project is itself a finding; the row says so.
        })
    }

    return () => {
      cancelled = true
    }
    // Keyed on the initial list: the projects a submission points at never change,
    // and re-running this on every approval would refetch the whole queue.
  }, [submissions])

  return hours
}

function Evidence({ href, label }: { href?: string; label: string }) {
  if (!href) {
    // Absence is stated, not omitted. "No code" is exactly what a reviewer is
    // looking for, and a gap where a link should be doesn't say it.
    return <span className="evidence-missing">no {label}</span>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label} ↗
    </a>
  )
}

function ShippingDetails({ submission }: { submission: Submission }) {
  const address = [
    submission.addressLine1,
    submission.addressLine2,
    submission.city,
    submission.state,
    submission.zip,
    submission.country,
  ]
    .filter(Boolean)
    .join(', ')

  const rows: Array<[string, string | undefined]> = [
    ['Email', submission.email],
    ['Phone', submission.phoneNumber],
    ['Birthday', submission.birthday],
    ['Address', address || undefined],
  ]

  if (!rows.some(([, value]) => value)) return null

  // A real <details>: works with scripting off, and never opens by accident
  // while someone is scanning the queue.
  return (
    <details className="shipping-details">
      <summary>shipping details</summary>
      <table>
        <tbody>
          {rows.map(([label, value]) =>
            value ? (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ) : null
          )}
        </tbody>
      </table>
    </details>
  )
}

function SubmissionRow({
  submission,
  isAdmin,
  loggedHours,
  maxHours,
  onReview,
  reviewing,
}: {
  submission: Submission
  isAdmin: boolean
  loggedHours?: number
  maxHours: number
  onReview: (id: string, action: 'accept' | 'reject', adjustedHours?: number) => void
  reviewing: boolean
}) {
  const [adjusting, setAdjusting] = useState(false)
  const [adjusted, setAdjusted] = useState('')

  const thumb = submission.screenshot?.[0]
  const isPending = submission.status === 'Pending'
  const rejected = submission.status === 'Rejected'
  const pct = (h: number) => Math.min(100, (h / maxHours) * 100)

  return (
    <tr className={rejected ? 'row-void' : undefined}>
      <td>
        {thumb ? (
          <a href={thumb.url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb.url}
              alt={`Screenshot of ${submission.firstName}'s project`}
              className="shot"
            />
          </a>
        ) : (
          <span className="shot-missing" role="img" aria-label="No screenshot submitted" />
        )}
      </td>

      <td>
        <span className="shipper">
          {submission.firstName} {submission.lastName}
        </span>
        <span className="shipper-handles">
          {submission.slackUsername ? `@${submission.slackUsername}` : 'no slack handle'}
          {submission.githubUsername && ` · gh:${submission.githubUsername}`}
        </span>
        {isAdmin && <ShippingDetails submission={submission} />}
      </td>

      {/* The description in full. Truncating it to two lines removed the single
          best signal for "did they actually build this" — so it gets the widest
          column in the table and is allowed to be as tall as it needs. */}
      <td>{submission.description || <span className="tally">no description</span>}</td>

      <td>
        {loggedHours === undefined ? (
          <span className="tally">—</span>
        ) : (
          <>
            <span className="hours-bar" aria-hidden="true">
              <span className="hours-logged" style={{ width: `${pct(loggedHours)}%` }} />
              {submission.adjustedHours !== undefined && (
                <span className="hours-counted" style={{ width: `${pct(submission.adjustedHours)}%` }} />
              )}
            </span>
            <span className="ledger-numeric">
              {loggedHours.toFixed(1)}h logged
              {submission.adjustedHours !== undefined && ` · ${submission.adjustedHours}h counted`}
            </span>
          </>
        )}
      </td>

      <td className="evidence">
        <Evidence href={submission.playableUrl} label="live" />
        <Evidence href={submission.codeUrl} label="code" />
        <Evidence href={submission.hackatimeProject} label="hackatime" />
      </td>

      <td>
        <SubmissionState status={submission.status} adjustedHours={submission.adjustedHours} />
      </td>

      <td>
        <span className="review-actions">
        {!isPending ? null : adjusting ? (
          <>
            <Blank
              label="Hours to count instead"
              size="count"
              type="number"
              min="0"
              step="0.5"
              value={adjusted}
              onChange={e => setAdjusted(e.target.value)}
              placeholder="hours"
              autoFocus
            />
            <button
              onClick={() => {
                const hrs = parseFloat(adjusted)
                if (!Number.isNaN(hrs)) onReview(submission.id, 'accept', hrs)
              }}
              disabled={reviewing || !adjusted}
              className="action action-clear"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setAdjusting(false)
                setAdjusted('')
              }}
              className="action action-quiet"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onReview(submission.id, 'accept')}
              disabled={reviewing}
              className="action action-clear"
            >
              Approve
            </button>
            <button
              onClick={() => setAdjusting(true)}
              disabled={reviewing}
              className="action"
              title="Approve, but count fewer hours than Hackatime logged"
            >
              Adjust
            </button>
            <button
              onClick={() => onReview(submission.id, 'reject')}
              disabled={reviewing}
              className="action action-danger"
            >
              Reject
            </button>
          </>
        )}
        </span>
      </td>
    </tr>
  )
}

type Nudge = { action: 'accept' | 'reject'; slackUsername?: string; firstName: string }

export default function SubmissionsList({
  initialSubmissions,
  isAdmin,
}: {
  initialSubmissions: Submission[]
  isAdmin: boolean
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  // Opens on the pending queue: a prediction, not a preference. One click moves it.
  const [filter, setFilter] = useState<Filter>('Pending')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [nudge, setNudge] = useState<Nudge | null>(null)
  const [error, setError] = useState('')

  const hours = useHackatimeHours(initialSubmissions)

  async function handleReview(id: string, action: 'accept' | 'reject', adjustedHours?: number) {
    setReviewingId(id)
    setError('')
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(adjustedHours !== undefined && { adjustedHours }) }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      const sub = submissions.find(s => s.id === id)
      setSubmissions(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, status: updated.status, ...(adjustedHours !== undefined && { adjustedHours }) }
            : s
        )
      )
      setNudge({
        action,
        slackUsername: sub?.slackUsername,
        firstName: sub?.firstName ?? 'them',
      })
    } catch {
      setError('That review didn’t save. Try it again.')
    } finally {
      setReviewingId(null)
    }
  }

  const counts: Record<Filter, number> = {
    all: submissions.length,
    Pending: submissions.filter(s => s.status === 'Pending').length,
    Accepted: submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified')
      .length,
    Rejected: submissions.filter(s => s.status === 'Rejected').length,
  }

  const visible =
    filter === 'all'
      ? submissions
      : filter === 'Accepted'
        ? submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified')
        : submissions.filter(s => s.status === filter)

  // The scale every hour bar is drawn against: the biggest total on screen, so
  // bar lengths are comparable to each other and not to an arbitrary ceiling.
  const maxHours = Math.max(1, ...visible.map(s => hours[s.id] ?? 0))

  return (
    <>
      <ul className="queue-tabs">
        {FILTERS.map(({ key, label }) => (
          <li key={key}>
            <button onClick={() => setFilter(key)} aria-pressed={filter === key}>
              {label} ({counts[key]})
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="error-note">
          {error}
        </p>
      )}

      {nudge && (
        <div className={`notice ${nudge.action === 'accept' ? 'notice-clear' : 'notice-attention'}`}>
          <span>
            {nudge.action === 'accept' ? 'Approved. ' : 'Rejected. '}
            {nudge.slackUsername ? (
              <>
                Give{' '}
                <a
                  href={`https://hackclub.slack.com/team/${nudge.slackUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{nudge.slackUsername}
                </a>{' '}
                a heads-up in Slack.
              </>
            ) : (
              <>Let {nudge.firstName} know.</>
            )}
          </span>
          <button onClick={() => setNudge(null)} className="action action-quiet">
            Dismiss
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="empty">{EMPTY_COPY[filter]}</p>
      ) : (
        <>
          <Ledger label={`${visible.length} submissions`} width="wide">
            {/* The description gets the most room because it is the strongest
                signal for "is this real"; the shot column is fixed at the
                thumbnail's own size. */}
            <colgroup>
              <col style={{ width: '76px' }} />
              {/* Wide enough that the collapsed shipping-details table inside it
                  can hold a wrapped postal address without looking punished. */}
              <col style={{ width: '19%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Shot</th>
                <th scope="col">Shipper</th>
                <th scope="col">What they made</th>
                <th scope="col">Hours</th>
                <th scope="col">Evidence</th>
                <th scope="col">State</th>
                <th scope="col">
                  <span className="tally">Review</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(sub => (
                <SubmissionRow
                  key={sub.id}
                  submission={sub}
                  isAdmin={isAdmin}
                  loggedHours={hours[sub.id]}
                  maxHours={maxHours}
                  onReview={handleReview}
                  reviewing={reviewingId === sub.id}
                />
              ))}
            </tbody>
          </Ledger>

          <p className="edition">
            Hour bars are scaled to {maxHours.toFixed(1)}h, the longest on screen · green marks hours
            counted after an adjustment · hatched rows are rejected
          </p>
        </>
      )}
    </>
  )
}
