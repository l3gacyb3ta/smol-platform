import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProgram } from '@/lib/airtable'
import { isAdmin, canAccessProgram } from '@/lib/permissions'
import { getSubmissions, stripPII } from '@/lib/airtable-submissions'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const programId = req.nextUrl.searchParams.get('programId')
  if (!programId) return NextResponse.json({ error: 'programId required' }, { status: 400 })

  const program = await getProgram(programId)
  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!canAccessProgram(session.user.slackId, program)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const submissions = await getSubmissions(program.slackChannel)
  const admin = isAdmin(session.user.slackId)
  const filtered = admin ? submissions : submissions.map(stripPII)

  return NextResponse.json(filtered)
}
