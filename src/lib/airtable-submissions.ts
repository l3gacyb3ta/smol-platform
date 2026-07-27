import Airtable from 'airtable'
import type { FieldSet } from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
)
const table = () => base(process.env.AIRTABLE_SUBMISSIONS_TABLE ?? 'Submissions')

export type SubmissionStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Sent to Unified'

export interface Submission {
  id: string
  status: SubmissionStatus
  programSlackChannel: string
  firstName: string
  lastName: string
  slackUsername?: string
  githubUsername?: string
  description?: string
  playableUrl?: string
  codeUrl?: string
  hackatimeProject?: string
  adjustedHours?: number
  screenshot?: Array<{ url: string; filename: string }>
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
  'email', 'birthday', 'phoneNumber',
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
  return {
    id: record.id,
    status: ((f['Status'] as string) ?? 'Pending') as SubmissionStatus,
    // Lowercase on purpose: the Airtable field really is named "program slack
    // channel". Reading fields is a plain property access, so it's
    // case-sensitive — title-casing this silently yields '' and every review
    // then 403s, because the program lookup in the review route finds nothing.
    programSlackChannel: (f['program slack channel'] as string) ?? '',
    firstName: (f['First Name'] as string) ?? '',
    lastName: (f['Last Name'] as string) ?? '',
    slackUsername: (f['Slack Username'] as string) || undefined,
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

export async function getSubmissions(programSlackChannel: string): Promise<Submission[]> {
  // Channel names are [a-z0-9-] so no escaping needed. Formula field
  // references are case-insensitive, unlike the property reads above, but this
  // matches the real field name to keep the two in step.
  const records = await table()
    .select({ filterByFormula: `{program slack channel} = '${programSlackChannel}'` })
    .all()
  return records.map(mapRecord)
}

export async function getSubmission(id: string): Promise<Submission | null> {
  try {
    const record = await table().find(id)
    return mapRecord(record)
  } catch {
    return null
  }
}

export async function reviewSubmission(
  id: string,
  action: 'accept' | 'reject',
  adjustedHours?: number,
): Promise<Submission> {
  const status: SubmissionStatus = action === 'accept' ? 'Accepted' : 'Rejected'
  const fields: FieldSet = { Status: status }
  if (adjustedHours !== undefined) fields['Adjusted Hours'] = adjustedHours
  const record = await table().update(id, fields)
  return mapRecord(record)
}
