import { NextResponse } from 'next/server'

/**
 * Local approval was retired in favour of Ari. Keeping this explicit response
 * prevents older clients from silently changing Airtable review decisions.
 */
export async function PATCH() {
  return NextResponse.json(
    { error: 'Local reviews are retired. Send the submission to Ari instead.' },
    { status: 410 }
  )
}
