import { NextRequest, NextResponse } from 'next/server'
import {
  getPrograms,
  createProgram,
  isIdentifierTaken,
} from '@/lib/airtable'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/permissions'
import { SLACK_CHANNEL_RE, SUBDOMAIN_RE } from '@/lib/constants'
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

  if (!SLACK_CHANNEL_RE.test(body.slackChannel) || !SUBDOMAIN_RE.test(body.subdomain)) {
    return NextResponse.json(
      { error: 'Slack channel and subdomain may only contain a-z, 0-9 and dashes' },
      { status: 400 }
    )
  }

  // Both identify the program to other systems, and either one may be what
  // binds a submission to its program — so neither may be claimed twice, and
  // neither may collide with the *other* identifier of an existing program.
  if (await isIdentifierTaken(body.slackChannel)) {
    return NextResponse.json({ error: 'That Slack channel is already taken' }, { status: 409 })
  }
  if (await isIdentifierTaken(body.subdomain)) {
    return NextResponse.json({ error: 'That subdomain is already taken' }, { status: 409 })
  }

  const program = await createProgram({
    ...body,
    creatorSlackId: slackId,
    creatorName: session?.user?.name ?? undefined,
    creatorEmail: session?.user?.email ?? undefined,
  })
  return NextResponse.json(program, { status: 201 })
}
