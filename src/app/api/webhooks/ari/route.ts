import { NextResponse } from 'next/server'
import { isFreshAriTimestamp, parseAriEvent, verifyAriWebhookSignature, type AriEvent } from '@/lib/ari'
import { hasAriDelivery, recordAriDelivery } from '@/lib/ari-deliveries'
import { getSubmission, updateAriSubmission, type AriSubmissionUpdate } from '@/lib/airtable-submissions'

export const runtime = 'nodejs'

const MAX_WEBHOOK_BYTES = 512 * 1024

function eventUpdate(event: AriEvent, at: string): AriSubmissionUpdate | null {
  const note = typeof event.review?.note_to_maker === 'string' ? event.review.note_to_maker : null
  const minutes = typeof event.review?.approved_minutes === 'number' ? event.review.approved_minutes : null
  switch (event.event) {
    case 'review.approved':
      return { status: 'Accepted', phase: 'reviewed', decision: 'approved', reviewMinutes: minutes, reviewNote: note, lastEventAt: at }
    case 'review.changes':
      return { status: 'Pending', phase: 'reviewed', decision: 'changes', reviewMinutes: minutes, reviewNote: note, lastEventAt: at }
    case 'review.rejected':
      return { status: 'Rejected', phase: 'reviewed', decision: 'rejected', reviewMinutes: minutes, reviewNote: note, lastEventAt: at }
    case 'review.reverted':
    case 'review.requeued':
      return { status: 'Pending', phase: event.event === 'review.requeued' ? 'review' : 'reverted', decision: null, reviewMinutes: null, reviewNote: null, lastEventAt: at }
    case 'ship.updated':
      return { phase: 'updated', lastEventAt: at }
    case 'review.fraud':
      // Fraud relay is informational, but advancing the event watermark keeps an
      // earlier delayed decision from overwriting the current local projection.
      return { lastEventAt: at }
  }
}

export async function POST(req: Request) {
  const contentLength = req.headers.get('content-length')
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_WEBHOOK_BYTES)) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const timestamp = req.headers.get('x-ari-timestamp')
  const deliveryId = req.headers.get('x-ari-delivery-id')
  const signature = req.headers.get('x-ari-signature')
  if (!timestamp || !deliveryId || !signature || !isFreshAriTimestamp(timestamp)) {
    return NextResponse.json({ error: 'Invalid Ari delivery' }, { status: 401 })
  }

  let raw: Buffer
  try {
    raw = Buffer.from(await req.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (raw.length > MAX_WEBHOOK_BYTES) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })

  try {
    if (!verifyAriWebhookSignature({ timestamp, deliveryId, rawBody: raw, signature })) {
      return NextResponse.json({ error: 'Invalid Ari signature' }, { status: 401 })
    }
  } catch {
    console.error('Ari webhook configuration error')
    return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 })
  }

  let event: AriEvent | null
  try {
    event = parseAriEvent(JSON.parse(raw.toString('utf8')))
  } catch {
    return NextResponse.json({ error: 'Invalid Ari payload' }, { status: 400 })
  }
  if (!event) return NextResponse.json({ error: 'Unsupported Ari event' }, { status: 400 })

  try {
    if (await hasAriDelivery(deliveryId)) return NextResponse.json({ ok: true, duplicate: true })

    const submission = await getSubmission(event.external_id)
    const receivedAt = new Date(Number(timestamp) * 1000).toISOString()
    const isCurrentShip = submission && (!submission.ariShipId || submission.ariShipId === event.id)
    const isNewer = !submission?.ariLastEventAt || new Date(submission.ariLastEventAt).getTime() <= Number(timestamp) * 1000
    const update = eventUpdate(event, receivedAt)
    if (submission && isCurrentShip && isNewer && update) {
      await updateAriSubmission(submission.id, update)
    }

    await recordAriDelivery({
      deliveryId,
      shipId: event.id,
      externalId: event.external_id,
      event: event.event,
      receivedAt,
    })
    return NextResponse.json({ ok: true })
  } catch {
    // A non-2xx response asks Ari to retry transient Airtable failures.
    console.error('Ari webhook processing failed')
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
