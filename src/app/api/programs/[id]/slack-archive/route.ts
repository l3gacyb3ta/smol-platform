import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProgram } from '@/lib/airtable'
import { isAdmin } from '@/lib/permissions'
import { archiveChannel } from '@/lib/slack'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!isAdmin(session?.user?.slackId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const program = await getProgram(id)
  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const slackUrl = program.resources.slack
  if (!slackUrl) return NextResponse.json({ error: 'No Slack channel provisioned' }, { status: 400 })

  // Extract channel ID from https://hackclub.slack.com/archives/C12345678
  const channelId = slackUrl.split('/archives/')[1]?.split('/')[0]
  if (!channelId) return NextResponse.json({ error: 'Could not parse channel ID from URL' }, { status: 400 })

  await archiveChannel(channelId)
  return NextResponse.json({ ok: true })
}
