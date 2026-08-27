import { NextRequest, NextResponse } from 'next/server'
import { isIdentifierTaken } from '@/lib/airtable'
import { auth } from '@/auth'

// Subdomain availability check for the New Program form. The subdomain becomes
// the repo name (`smol-{subdomain}`) and the DNS record, so it must be unique —
// and unique against Slack channels too, since a submission may name a program
// by either identifier. Asks the same question POST /api/programs does, so the
// form can't call a value available that creation then rejects.
const SUBDOMAIN_RE = /^[a-z0-9-]{1,63}$/

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.slackId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subdomain = req.nextUrl.searchParams.get('subdomain') ?? ''
  // Reject malformed input rather than interpolate it into the Airtable
  // formula — also surfaces as "unavailable" in the UI, which is correct.
  if (!SUBDOMAIN_RE.test(subdomain)) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  return NextResponse.json({ available: !(await isIdentifierTaken(subdomain)) })
}
