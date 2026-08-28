import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  AriPayloadError,
  buildAriShipPayload,
  ingestAriShip,
  isFreshAriTimestamp,
  parseAriEvent,
  verifyAriWebhookSignature,
} from '../src/lib/ari.ts'

const submission = {
  id: 'recSubmission', status: 'Pending', programSlackChannel: 'smol',
  firstName: 'Mira', lastName: 'Okonkwo', projectTitle: 'Tide Clock',
  slackId: 'U0123ABCD', email: 'mira@hackclub.com', description: 'A tiny tide clock.',
  codeUrl: 'https://github.com/mira/tide', playableUrl: 'https://tide.example.com',
  hackatimeProject: 'https://hackatime.com/@mira/project/tide',
  screenshot: [{ url: 'https://example.com/tide.png', filename: 'tide.png' }],
}
const program = { slackChannel: 'smol' }

test('maps existing submission evidence into Ari payload', () => {
  const payload = buildAriShipPayload(submission as never, program as never)
  assert.equal(payload.external_id, 'recSubmission')
  assert.deepEqual(payload.hackatime_projects, ['tide'])
  assert.equal(payload.maker.slack_id, 'U0123ABCD')
  assert.equal(payload.repo_url, 'https://github.com/mira/tide')
})

test('rejects missing canonical Slack IDs instead of guessing from usernames', () => {
  assert.throws(
    () => buildAriShipPayload({ ...submission, slackId: undefined } as never, program as never),
    AriPayloadError
  )
})

test('signs the exact JSON bytes sent to Ari', async () => {
  process.env.ARI_PROGRAM_ID = 'smol'
  process.env.ARI_INGEST_SECRET = 'ingest-secret'
  process.env.ARI_BASE_URL = 'https://ari.test'
  const payload = buildAriShipPayload(submission as never, program as never)
  const originalFetch = globalThis.fetch
  let request: Request | undefined
  globalThis.fetch = async (_input, init) => {
    request = new Request('https://ari.test', init)
    return new Response(JSON.stringify({ id: 'AR-1', version: 1, phase: 'processing' }), { status: 202 })
  }
  try {
    const result = await ingestAriShip(payload)
    const raw = JSON.stringify(payload)
    assert.equal(result.id, 'AR-1')
    assert.equal(await request?.text(), raw)
    assert.equal(request?.headers.get('x-ari-signature'), createHmac('sha256', 'ingest-secret').update(raw).digest('hex'))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('verifies fresh webhook signatures over timestamp, delivery ID, and raw bytes', () => {
  process.env.ARI_WEBHOOK_SECRET = 'webhook-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const deliveryId = 'delivery-1'
  const body = Buffer.from('{"event":"review.approved"}')
  const signature = createHmac('sha256', 'webhook-secret').update(Buffer.concat([Buffer.from(`${timestamp}.${deliveryId}.`), body])).digest('hex')
  assert.equal(verifyAriWebhookSignature({ timestamp, deliveryId, rawBody: body, signature }), true)
  assert.equal(verifyAriWebhookSignature({ timestamp, deliveryId, rawBody: Buffer.from('{}'), signature }), false)
  assert.equal(isFreshAriTimestamp(timestamp), true)
  assert.equal(isFreshAriTimestamp(String(Math.floor(Date.now() / 1000) - 301)), false)
})

test('accepts only supported Ari event shapes', () => {
  assert.deepEqual(parseAriEvent({ event: 'review.approved', id: 'AR-1', external_id: 'recSubmission', decision: 'approved' }), {
    event: 'review.approved', id: 'AR-1', external_id: 'recSubmission', decision: 'approved',
  })
  assert.equal(parseAriEvent({ event: 'not.real', id: 'AR-1', external_id: 'recSubmission' }), null)
})
