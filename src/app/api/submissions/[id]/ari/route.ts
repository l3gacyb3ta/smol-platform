import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProgramByIdentifier } from '@/lib/airtable'
import { getSubmission, updateAriSubmission } from '@/lib/airtable-submissions'
import { buildAriShipPayload, ingestAriShip, AriConfigurationError, AriPayloadError } from '@/lib/ari'
import { canAccessSubmissions } from '@/lib/permissions'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const submission = await getSubmission(id)
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const program = await getProgramByIdentifier(submission.programSlackChannel)
  if (!program || !canAccessSubmissions(session.user.slackId, program)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (submission.ariShipId) {
    return NextResponse.json({
      id: submission.id,
      status: submission.status,
      ariShipId: submission.ariShipId,
      ariPhase: submission.ariPhase,
      message: 'This submission has already been sent to Ari.',
    })
  }

  try {
    const result = await ingestAriShip(buildAriShipPayload(submission, program))
    const updated = await updateAriSubmission(submission.id, {
      status: 'Sent to Ari',
      shipId: result.id,
      version: result.version,
      phase: result.phase ?? 'submitted',
      submittedAt: new Date().toISOString(),
    })
    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      ariShipId: updated.ariShipId,
      ariPhase: updated.ariPhase,
      duplicate: result.duplicate,
    })
  } catch (error) {
    if (error instanceof AriPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    if (error instanceof AriConfigurationError) {
      console.error('Ari ingestion configuration error')
      return NextResponse.json({ error: 'Ari is not configured correctly. Contact an administrator.' }, { status: 503 })
    }
    console.error('Ari ingestion failed')
    return NextResponse.json({ error: 'Ari could not accept this submission. Try again shortly.' }, { status: 502 })
  }
}
