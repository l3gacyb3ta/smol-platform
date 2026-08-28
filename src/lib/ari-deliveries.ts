import Airtable from 'airtable'
import type { FieldSet } from 'airtable'
import { escapeFormulaValue } from './airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
)
const table = () => base(process.env.AIRTABLE_ARI_DELIVERIES_TABLE ?? 'Ari Deliveries')

/** Returns true once a valid Ari delivery has been durably recorded. */
export async function hasAriDelivery(deliveryId: string): Promise<boolean> {
  const records = await table().select({
    filterByFormula: `{Delivery ID} = '${escapeFormulaValue(deliveryId)}'`,
    maxRecords: 1,
  }).firstPage()
  return records.length > 0
}

export async function recordAriDelivery({
  deliveryId,
  shipId,
  externalId,
  event,
  receivedAt,
}: {
  deliveryId: string
  shipId: string
  externalId: string
  event: string
  receivedAt: string
}): Promise<void> {
  await table().create({
    'Delivery ID': deliveryId,
    'Ship ID': shipId,
    'External ID': externalId,
    Event: event,
    'Received At': receivedAt,
  } as FieldSet)
}
