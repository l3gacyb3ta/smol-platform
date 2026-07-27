import { NextRequest, NextResponse } from 'next/server'
import { getProgramBySubdomain } from '@/lib/airtable'
import { auth } from '@/auth'

// Subdomain availability check for the New Program form. The subdomain becomes
// the repo name (`smol-{subdomain}`) and the DNS record, so it must be unique.
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

  const existing = await getProgramBySubdomain(subdomain)
  return NextResponse.json({ available: !existing })
}
