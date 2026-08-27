import Airtable from 'airtable'
import type { FieldSet } from 'airtable'
import type { Program, CreateProgramInput, ProgramStatus } from './types'
import { normalizeIdentifier } from './constants'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
)
const table = () => base(process.env.AIRTABLE_TABLE_NAME ?? 'Programs')

function mapRecord(record: Airtable.Record<FieldSet>): Program {
  const f = record.fields
  return {
    id: record.id,
    name: (f['Name'] as string) ?? '',
    description: (f['Description'] as string) ?? '',
    weShip: (f['We Ship'] as string) || undefined,
    slackChannel: (f['Slack Channel'] as string) ?? '',
    subdomain: (f['Subdomain'] as string) ?? '',
    startDate: (f['Start Date'] as string) ?? '',
    endDate: (f['End Date'] as string) ?? '',
    keyColor: (f['Key Color'] as string) ?? '#ec3750',
    status: ((f['Status'] as string) ?? 'pending') as ProgramStatus,
    template: (f['Template'] as string) || undefined,
    resources: {
      slack: (f['Slack URL'] as string) || undefined,
      github: (f['GitHub URL'] as string) || undefined,
      domain: (f['Domain URL'] as string) || undefined,
      hcb: (f['HCB URL'] as string) || undefined,
      airtable: (f['Airtable URL'] as string) || undefined,
      fillout: (f['Fillout URL'] as string) || undefined,
    },
    creatorSlackId: (f['Creator Slack ID'] as string) || undefined,
    creatorName: (f['Creator Name'] as string) || undefined,
    creatorEmail: (f['Creator Email'] as string) || undefined,
    creatorGithubUsername: (f['Creator GitHub Username'] as string) || undefined,
    errorStep: (f['Error Step'] as string) || null,
    errorMessage: (f['Error Message'] as string) || null,
    createdAt: (f['Created At'] as string) ?? new Date().toISOString(),
  }
}

type ProgramUpdate = Partial<CreateProgramInput> & {
  status?: ProgramStatus
  template?: string
  resources?: Partial<Program['resources']>
  errorStep?: string | null
  errorMessage?: string | null
}

function mapInput(data: ProgramUpdate): FieldSet {
  const fields: FieldSet = {}
  if (data.name !== undefined)           fields['Name'] = data.name
  if (data.description !== undefined)    fields['Description'] = data.description
  if (data.weShip !== undefined)         fields['We Ship'] = data.weShip
  if (data.slackChannel !== undefined)   fields['Slack Channel'] = data.slackChannel
  if (data.subdomain !== undefined)      fields['Subdomain'] = data.subdomain
  if (data.startDate !== undefined)      fields['Start Date'] = data.startDate
  if (data.endDate !== undefined)        fields['End Date'] = data.endDate
  if (data.keyColor !== undefined)       fields['Key Color'] = data.keyColor
  if (data.status !== undefined)         fields['Status'] = data.status
  if (data.template !== undefined)       fields['Template'] = data.template
  if (data.creatorSlackId !== undefined)         fields['Creator Slack ID'] = data.creatorSlackId
  if (data.creatorName !== undefined)            fields['Creator Name'] = data.creatorName
  if (data.creatorEmail !== undefined)           fields['Creator Email'] = data.creatorEmail
  if (data.creatorGithubUsername !== undefined)  fields['Creator GitHub Username'] = data.creatorGithubUsername
  if (data.resources?.slack !== undefined)    fields['Slack URL'] = data.resources.slack ?? ''
  if (data.resources?.github !== undefined)   fields['GitHub URL'] = data.resources.github ?? ''
  if (data.resources?.domain !== undefined)   fields['Domain URL'] = data.resources.domain ?? ''
  if (data.resources?.hcb !== undefined)      fields['HCB URL'] = data.resources.hcb ?? ''
  if (data.resources?.airtable !== undefined) fields['Airtable URL'] = data.resources.airtable ?? ''
  if (data.resources?.fillout !== undefined)  fields['Fillout URL'] = data.resources.fillout ?? ''
  // null explicitly clears the field in Airtable
  if ('errorStep' in data)    fields['Error Step'] = data.errorStep ?? ''
  if ('errorMessage' in data) fields['Error Message'] = data.errorMessage ?? ''
  return fields
}

export async function getPrograms(): Promise<Program[]> {
  const records = await table()
    .select({ view: 'Grid view', filterByFormula: "NOT({Status} = 'deleted')" })
    .all()
  return records.map(mapRecord)
}

export async function getProgram(id: string): Promise<Program | null> {
  try {
    const record = await table().find(id)
    return mapRecord(record)
  } catch {
    return null
  }
}

export async function createProgram(data: CreateProgramInput): Promise<Program> {
  const record = await table().create({
    ...mapInput(data),
    Status: 'pending',
    'Created At': new Date().toISOString(),
  } as FieldSet)
  return mapRecord(record)
}

export async function updateProgram(
  id: string,
  data: ProgramUpdate
): Promise<Program> {
  const record = await table().update(id, mapInput(data) as FieldSet)
  return mapRecord(record)
}

export async function deleteProgram(id: string): Promise<void> {
  await table().update(id, { Status: 'deleted' } as FieldSet)
}

/**
 * Escapes a value for interpolation into an Airtable formula string literal.
 * Callers should still validate the charset where they can — this is the
 * backstop for values that arrive from outside (submission form fields), and it
 * also stops a legitimate apostrophe from breaking the query.
 */
export function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/**
 * Formula matching `value` against either program identifier.
 *
 * Compares against `LOWER(TRIM(...))` rather than the raw column so the
 * comparison means the same thing as `normalizeIdentifier` does on the other
 * side of the join. Airtable's `=` is case-insensitive for text today, but that
 * is not something worth relying on for an authorization boundary.
 */
function identifierMatch(value: string): string {
  const v = escapeFormulaValue(normalizeIdentifier(value))
  return `OR(LOWER(TRIM({Slack Channel})) = '${v}', LOWER(TRIM({Subdomain})) = '${v}')`
}

/**
 * Resolves the program a submission's identifier refers to — its Slack channel
 * or its subdomain, since a submission may name either. See
 * `programIdentifiers`.
 *
 * Refuses to answer when the identifier is ambiguous. Airtable enforces no
 * uniqueness of its own, and this lookup decides who may review a submission —
 * handing back an arbitrary `records[0]` would let whoever happened to sort
 * first authorize against someone else's submissions. `isIdentifierTaken` keeps
 * the two columns to one namespace so a legitimate identifier resolves to
 * exactly one program; the check here is the backstop for rows that predate it
 * or were edited in Airtable directly.
 */
export async function getProgramByIdentifier(identifier: string): Promise<Program | null> {
  if (!normalizeIdentifier(identifier)) return null
  const records = await table()
    .select({
      filterByFormula: `AND(${identifierMatch(identifier)}, NOT({Status} = 'deleted'))`,
      maxRecords: 2,
    })
    .firstPage()
  if (records.length !== 1) {
    if (records.length > 1) {
      console.error(
        `Ambiguous program identifier "${identifier}" — ${records.length} programs claim it`
      )
    }
    return null
  }
  return mapRecord(records[0])
}

/**
 * Whether a non-deleted program other than `exceptId` already claims `value` as
 * either its Slack channel or its subdomain.
 *
 * One namespace for both columns, which Airtable itself will not enforce.
 * Deliberately stricter than checking each column against itself: a submission
 * may name a program by either identifier, so letting one program's subdomain
 * equal another's channel would make submission ownership — an authorization
 * boundary — ambiguous.
 */
export async function isIdentifierTaken(value: string, exceptId?: string): Promise<boolean> {
  if (!normalizeIdentifier(value)) return false
  const records = await table()
    .select({
      filterByFormula: `AND(${identifierMatch(value)}, NOT({Status} = 'deleted'))`,
    })
    .firstPage()
  return records.some(r => r.id !== exceptId)
}
