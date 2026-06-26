import Airtable from 'airtable'
import type { FieldSet } from 'airtable'
import type { Program, CreateProgramInput, ProgramStatus } from './types'

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
    slackChannel: (f['Slack Channel'] as string) ?? '',
    subdomain: (f['Subdomain'] as string) ?? '',
    startDate: (f['Start Date'] as string) ?? '',
    endDate: (f['End Date'] as string) ?? '',
    keyColor: (f['Key Color'] as string) ?? '#ec3750',
    status: ((f['Status'] as string) ?? 'pending') as ProgramStatus,
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
    errorStep: (f['Error Step'] as string) || null,
    errorMessage: (f['Error Message'] as string) || null,
    createdAt: (f['Created At'] as string) ?? new Date().toISOString(),
  }
}

type ProgramUpdate = Partial<CreateProgramInput> & {
  status?: ProgramStatus
  resources?: Partial<Program['resources']>
  errorStep?: string | null
  errorMessage?: string | null
}

function mapInput(data: ProgramUpdate): FieldSet {
  const fields: FieldSet = {}
  if (data.name !== undefined)           fields['Name'] = data.name
  if (data.description !== undefined)    fields['Description'] = data.description
  if (data.slackChannel !== undefined)   fields['Slack Channel'] = data.slackChannel
  if (data.subdomain !== undefined)      fields['Subdomain'] = data.subdomain
  if (data.startDate !== undefined)      fields['Start Date'] = data.startDate
  if (data.endDate !== undefined)        fields['End Date'] = data.endDate
  if (data.keyColor !== undefined)       fields['Key Color'] = data.keyColor
  if (data.status !== undefined)         fields['Status'] = data.status
  if (data.creatorSlackId !== undefined) fields['Creator Slack ID'] = data.creatorSlackId
  if (data.creatorName !== undefined)    fields['Creator Name'] = data.creatorName
  if (data.creatorEmail !== undefined)   fields['Creator Email'] = data.creatorEmail
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

export async function getProgramBySlackChannel(channel: string): Promise<Program | null> {
  const records = await table()
    .select({ filterByFormula: `{Slack Channel} = '${channel}'` })
    .firstPage()
  return records[0] ? mapRecord(records[0]) : null
}
