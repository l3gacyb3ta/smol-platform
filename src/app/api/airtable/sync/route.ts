import { NextRequest, NextResponse } from 'next/server'

// TODO: Replace with real Airtable sync logic.
// This endpoint is called after all provisioning steps complete to write
// the final program record into Airtable with all resource URLs populated.
//
// Required env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
//
// Example implementation:
//   import Airtable from 'airtable'
//   const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!)
//   await base('Programs').update(programId, { fields: { ...resources } })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { programId, resources } = body

  if (!programId) {
    return NextResponse.json({ error: 'Missing programId' }, { status: 400 })
  }

  // Stub: log and return success
  console.log(`[airtable/sync] Syncing program ${programId}`, resources)

  return NextResponse.json({ ok: true, programId, synced: true, stubbed: true })
}
