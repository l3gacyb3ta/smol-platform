import Airtable from 'airtable'
import type { FieldSet } from 'airtable'
import type { Program } from './types'
import { programIdentifiers } from './constants'
import { escapeFormulaValue } from './airtable'
import type { AriDecision } from './ari'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
)
const table = () => base(process.env.AIRTABLE_SUBMISSIONS_TABLE ?? 'Submissions')

export type SubmissionStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Sent to Unified' | 'Sent to Ari'

export interface Submission {
  id: string
  status: SubmissionStatus
  programSlackChannel: string
  firstName: string
  lastName: string
  projectTitle?: string
  slackUsername?: string
  slackId?: string
  githubUsername?: string
  description?: string
  playableUrl?: string
  codeUrl?: string
  hackatimeProject?: string
  adjustedHours?: number
  screenshot?: Array<{ url: string; filename: string }>
  ariShipId?: string
  ariVersion?: number
  ariPhase?: string
  ariDecision?: AriDecision
  ariSubmittedAt?: string
  ariLastEventAt?: string
  ariReviewMinutes?: number
  ariReviewNote?: string
  // PII — stripped for non-admins
  email?: string
  birthday?: string
  phoneNumber?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  zip?: string
  state?: string
  country?: string
}

const PII_KEYS: Array<keyof Submission> = [
  'email', 'birthday', 'phoneNumber', 'slackId', 'ariReviewNote',
  'addressLine1', 'addressLine2', 'city', 'zip', 'state', 'country',
]

export function stripPII(sub: Submission): Submission {
  const out = { ...sub }
  for (const k of PII_KEYS) delete out[k]
  return out
}

type AttachmentField = Array<{ url: string; filename: string }>

function mapRecord(record: Airtable.Record<FieldSet>): Submission {
  const f = record.fields
  const decision = f['Ari Decision'] as string | undefined
  return {
    id: record.id,
    status: ((f['Status'] as string) ?? 'Pending') as SubmissionStatus,
    // Lowercase on purpose: the Airtable field really is named "program slack
    // channel". Reading fields is case-sensitive.
    programSlackChannel: (f['program slack channel'] as string) ?? '',
    firstName: (f['First Name'] as string) ?? '',
    lastName: (f['Last Name'] as string) ?? '',
    projectTitle: (f['Project Title'] as string) || undefined,
    slackUsername: (f['Slack Username'] as string) || undefined,
    slackId: (f['Slack ID'] as string) || undefined,
    githubUsername: (f['Github Username'] as string) || undefined,
    description: (f['Description'] as string) || undefined,
    playableUrl: (f['Playable URL'] as string) || undefined,
    codeUrl: (f['Code URL'] as string) || undefined,
    hackatimeProject: (f['Hackatime project'] as string) || undefined,
    adjustedHours: (f['Adjusted Hours'] as number) ?? undefined,
    screenshot: ((f['Screenshot'] as unknown as AttachmentField) || []).map(a => ({
      url: a.url,
      filename: a.filename,
    })),
    ariShipId: (f['Ari Ship ID'] as string) || undefined,
    ariVersion: (f['Ari Version'] as number) ?? undefined,
    ariPhase: (f['Ari Phase'] as string) || undefined,
    ariDecision: decision === 'approved' || decision === 'changes' || decision === 'rejected'
      ? decision
      : undefined,
    ariSubmittedAt: (f['Ari Submitted At'] as string) || undefined,
    ariLastEventAt: (f['Ari Last Event At'] as string) || undefined,
    ariReviewMinutes: (f['Ari Review Minutes'] as number) ?? undefined,
    ariReviewNote: (f['Ari Review Note'] as string) || undefined,
    // PII
    email: (f['Email'] as string) || undefined,
    birthday: (f['Birthday'] as string) || undefined,
    phoneNumber: (f['Phone Number'] as string) || undefined,
    addressLine1: (f['Address (Line 1)'] as string) || undefined,
    addressLine2: (f['Address (Line 2)'] as string) || undefined,
    city: (f['City'] as string) || undefined,
    zip: (f['ZIP'] as string) || undefined,
    state: (f['State'] as string) || undefined,
    country: (f['Country'] as string) || undefined,
  }
}

export async function getSubmissions(program: Program): Promise<Submission[]> {
  const identifiers = programIdentifiers(program)
  if (identifiers.length === 0) return []
  const clauses = identifiers.map(
    id => `LOWER(TRIM(SUBSTITUTE({program slack channel}, '#', ''))) = '${escapeFormulaValue(id)}'`
  )
  const records = await table().select({ filterByFormula: `OR(${clauses.join(', ')})` }).all()
  return records.map(mapRecord)
}

export async function getSubmission(id: string): Promise<Submission | null> {
  try {
    return mapRecord(await table().find(id))
  } catch {
    return null
  }
}

export interface AriSubmissionUpdate {
  status?: SubmissionStatus
  shipId?: string
  version?: number
  phase?: string
  decision?: AriDecision | null
  submittedAt?: string
  lastEventAt?: string
  reviewMinutes?: number | null
  reviewNote?: string | null
}

/** Updates only the local projection of Ari's review state. */
export async function updateAriSubmission(id: string, update: AriSubmissionUpdate): Promise<Submission> {
  const fields: FieldSet = {}
  if (update.status !== undefined) fields['Status'] = update.status
  if (update.shipId !== undefined) fields['Ari Ship ID'] = update.shipId
  if (update.version !== undefined) fields['Ari Version'] = update.version
  if (update.phase !== undefined) fields['Ari Phase'] = update.phase
  if ('decision' in update) fields['Ari Decision'] = update.decision ?? ''
  if (update.submittedAt !== undefined) fields['Ari Submitted At'] = update.submittedAt
  if (update.lastEventAt !== undefined) fields['Ari Last Event At'] = update.lastEventAt
  if ('reviewMinutes' in update) fields['Ari Review Minutes'] = update.reviewMinutes ?? (null as never)
  if ('reviewNote' in update) fields['Ari Review Note'] = update.reviewNote ?? ''
  return mapRecord(await table().update(id, fields))
}
