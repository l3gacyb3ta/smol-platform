import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProgramBySlackChannel } from '@/lib/airtable'
import { canAccessSubmissions } from '@/lib/permissions'
import { getSubmission, reviewSubmission } from '@/lib/airtable-submissions'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const submission = await getSubmission(id)
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const program = await getProgramBySlackChannel(submission.programSlackChannel)
  if (!program || !canAccessSubmissions(session.user.slackId, program)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as { action: 'accept' | 'reject'; adjustedHours?: number }
  const { action, adjustedHours } = body
  if (action !== 'accept' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be accept or reject' }, { status: 400 })
  }
  if (adjustedHours !== undefined && (typeof adjustedHours !== 'number' || !isFinite(adjustedHours) || adjustedHours < 0)) {
    return NextResponse.json({ error: 'adjustedHours must be a positive number' }, { status: 400 })
  }

  const updated = await reviewSubmission(id, action, adjustedHours)

  // Return only what the reviewer needs. The full record carries submitter PII
  // — email, birthday, phone, home address — which non-admins must never
  // receive, and a projection can't forget to strip a field added later.
  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    adjustedHours: updated.adjustedHours,
  })
}
