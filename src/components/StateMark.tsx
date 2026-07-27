import type { ProgramStatus } from '@/lib/types'
import type { SubmissionStatus } from '@/lib/airtable-submissions'
import { ageInDays } from '@/lib/runwindow'

/**
 * A record's state, said as a word first.
 *
 * A status is a threshold applied to a continuous signal, with the signal thrown
 * away — and here the signal is usually the more useful fact. "In review" is
 * true of something submitted an hour ago and something submitted three weeks
 * ago, and only one of those is a problem. So where an age is available, it
 * rides alongside: `in review · 3 days`.
 *
 * Colour and the left rule are redundant encodings on top of the word. The word
 * alone is enough, which is what makes this legible in monochrome and to a
 * screen reader.
 */

type Tone = 'clear' | 'attention' | 'hold' | 'void'

const PROGRAM_STATE: Record<ProgramStatus, { label: string; tone: Tone }> = {
  active: { label: 'live', tone: 'clear' },
  accepted: { label: 'setting up', tone: 'hold' },
  pending: { label: 'in review', tone: 'attention' },
  archived: { label: 'wrapped', tone: 'void' },
  deleted: { label: 'deleted', tone: 'void' },
}

const SUBMISSION_STATE: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  Accepted: { label: 'approved', tone: 'clear' },
  'Sent to Unified': { label: 'approved · sent', tone: 'clear' },
  Rejected: { label: 'rejected', tone: 'void' },
  Pending: { label: 'needs review', tone: 'attention' },
}

export function ProgramState({
  status,
  /** Days this program has been sitting in its current state, when it matters. */
  waitingDays,
}: {
  status: ProgramStatus
  waitingDays?: number
}) {
  const { label, tone } = PROGRAM_STATE[status] ?? PROGRAM_STATE.pending
  // Only worth saying for the states where a human is the bottleneck.
  const showAge = waitingDays !== undefined && (status === 'pending' || status === 'accepted')

  return (
    <span className={`state state-${tone}`}>
      {label}
      {showAge && ` · ${ageInDays(waitingDays)}`}
    </span>
  )
}

export function SubmissionState({
  status,
  /** Hours actually credited, when a reviewer changed them. */
  adjustedHours,
}: {
  status: SubmissionStatus
  adjustedHours?: number
}) {
  const { label, tone } = SUBMISSION_STATE[status] ?? SUBMISSION_STATE.Pending
  const approved = status === 'Accepted' || status === 'Sent to Unified'

  return (
    <span className={`state state-${tone}`}>
      {label}
      {approved && adjustedHours !== undefined && ` · ${adjustedHours}h`}
    </span>
  )
}

export function toneForProgram(status: ProgramStatus): Tone {
  return (PROGRAM_STATE[status] ?? PROGRAM_STATE.pending).tone
}
