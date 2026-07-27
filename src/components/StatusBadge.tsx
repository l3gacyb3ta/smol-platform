import type { ProgramStatus } from '@/lib/types'
import type { SubmissionStatus } from '@/lib/airtable-submissions'

type Tone = 'green' | 'blue' | 'amber' | 'red' | 'gray'

const PROGRAM_STATUS: Record<ProgramStatus, { label: string; tone: Tone }> = {
  active: { label: 'Running', tone: 'green' },
  accepted: { label: 'Setting up', tone: 'blue' },
  pending: { label: 'In review', tone: 'amber' },
  archived: { label: 'Wrapped', tone: 'gray' },
  deleted: { label: 'Deleted', tone: 'gray' },
}

const SUBMISSION_STATUS: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  Accepted: { label: 'Approved', tone: 'green' },
  'Sent to Unified': { label: 'Approved · sent', tone: 'green' },
  Rejected: { label: 'Rejected', tone: 'red' },
  Pending: { label: 'Needs review', tone: 'amber' },
}

export function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  const { label, tone } = PROGRAM_STATUS[status] ?? PROGRAM_STATUS.pending
  return <span className={`badge badge-${tone}`}>{label}</span>
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, tone } = SUBMISSION_STATUS[status] ?? SUBMISSION_STATUS.Pending
  return <span className={`badge badge-${tone}`}>{label}</span>
}
