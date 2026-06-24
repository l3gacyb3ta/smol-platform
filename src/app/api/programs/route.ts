import { NextRequest, NextResponse } from 'next/server'
import { getPrograms, createProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/permissions'
import type { CreateProgramInput } from '@/lib/types'

export async function GET() {
  const session = await auth()
  const slackId = session?.user?.slackId

  if (!slackId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const programs = await getPrograms()

  // Admins see everything; others see only their own
  const visible = isAdmin(slackId)
    ? programs
    : programs.filter(p => p.creatorSlackId === slackId)

  return NextResponse.json(visible)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const slackId = session?.user?.slackId

  if (!slackId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateProgramInput = await req.json()

  if (!body.name || !body.slackChannel || !body.subdomain) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const program = await createProgram({
    ...body,
    creatorSlackId: slackId,
    creatorName: session?.user?.name ?? undefined,
    creatorEmail: session?.user?.email ?? undefined,
  })
  return NextResponse.json(program, { status: 201 })
}
