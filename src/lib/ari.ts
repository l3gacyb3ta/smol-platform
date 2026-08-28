import { createHmac, timingSafeEqual } from 'crypto'
import type { Program } from './types'
import type { Submission } from './airtable-submissions'

const DEFAULT_BASE_URL = 'https://webhooks.ari.hackclub.com'

export type AriDecision = 'approved' | 'changes' | 'rejected'
export type AriEventName =
  | 'ship.updated'
  | 'review.approved'
  | 'review.changes'
  | 'review.rejected'
  | 'review.reverted'
  | 'review.requeued'
  | 'review.fraud'

export interface AriShipPayload {
  external_id: string
  title: string
  description: string
  maker: { email: string; name: string; slack_id: string }
  repo_url: string
  demo_url: string
  thumbnail_url: string
  hackatime_projects: string[]
  evidence: Array<'commits' | 'elapsed' | 'devlog'>
  meta: Record<string, string>
}

export interface AriEvent {
  event: AriEventName
  id: string
  external_id: string
  decision?: AriDecision | null
  review?: {
    approved_minutes?: number
    note_to_maker?: string
  }
}

export class AriConfigurationError extends Error {}
export class AriPayloadError extends Error {}

function requiredEnvironment(name: 'ARI_PROGRAM_ID' | 'ARI_INGEST_SECRET' | 'ARI_WEBHOOK_SECRET'): string {
  const value = process.env[name]?.trim()
  if (!value) throw new AriConfigurationError(`${name} is not configured`)
  return value
}

function httpUrl(value: string | undefined, field: string): string {
  if (!value) throw new AriPayloadError(`${field} is required before sending this submission to Ari`)
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
    return url.toString()
  } catch {
    throw new AriPayloadError(`${field} must be an http or https URL before sending this submission to Ari`)
  }
}

function githubRepository(value: string | undefined): string {
  const repository = httpUrl(value, 'Code URL')
  const url = new URL(repository)
  const parts = url.pathname.split('/').filter(Boolean)
  if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase()) || parts.length < 2) {
    throw new AriPayloadError('Code URL must be a public GitHub repository URL before sending this submission to Ari')
  }
  return repository
}

function projectKey(value: string | undefined): string {
  const raw = value?.trim()
  if (!raw) throw new AriPayloadError('Hackatime project is required before sending this submission to Ari')
  if (raw === '<<LAST_PROJECT>>') {
    throw new AriPayloadError('Choose a specific Hackatime project before sending this submission to Ari')
  }

  // Existing submissions store Hackatime project links. Ari expects the project
  // key, so preserve direct keys and extract the key from that legacy URL shape.
  try {
    const url = new URL(raw)
    const match = url.pathname.match(/\/project\/([^/]+)\/?$/)
    if (!match) throw new Error()
    return decodeURIComponent(match[1])
  } catch {
    if (/^[^\s/]{1,200}$/.test(raw)) return raw
    throw new AriPayloadError('Hackatime project must be a project key or Hackatime project URL')
  }
}

export function buildAriShipPayload(submission: Submission, program: Program): AriShipPayload {
  const title = submission.projectTitle?.trim()
  if (!title) throw new AriPayloadError('Project Title is required before sending this submission to Ari')
  const email = submission.email?.trim()
  if (!email) throw new AriPayloadError('Email is required before sending this submission to Ari')
  const slackId = submission.slackId?.trim()
  if (!slackId) throw new AriPayloadError('Slack ID is required before sending this submission to Ari')
  const name = `${submission.firstName} ${submission.lastName}`.trim()
  if (!name) throw new AriPayloadError('Maker name is required before sending this submission to Ari')
  const description = submission.description?.trim()
  if (!description) throw new AriPayloadError('Description is required before sending this submission to Ari')
  const thumbnail = submission.screenshot?.[0]?.url

  return {
    external_id: submission.id,
    title,
    description,
    maker: { email, name, slack_id: slackId },
    repo_url: githubRepository(submission.codeUrl),
    demo_url: httpUrl(submission.playableUrl, 'Playable URL'),
    thumbnail_url: httpUrl(thumbnail, 'Screenshot'),
    hackatime_projects: [projectKey(submission.hackatimeProject)],
    evidence: ['commits', 'elapsed', 'devlog'],
    meta: {
      'Platform submission': submission.id,
      'Platform program': program.slackChannel,
    },
  }
}

function hmacHex(secret: string, data: string | Buffer): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export interface AriIngestResult {
  id: string
  version?: number
  phase?: string
  duplicate: boolean
}

export async function ingestAriShip(payload: AriShipPayload): Promise<AriIngestResult> {
  const programId = requiredEnvironment('ARI_PROGRAM_ID')
  const secret = requiredEnvironment('ARI_INGEST_SECRET')
  const raw = JSON.stringify(payload)
  const response = await fetch(`${(process.env.ARI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')}/api/ingest/${encodeURIComponent(programId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ari-Signature': hmacHex(secret, raw),
    },
    body: raw,
  })

  let body: Record<string, unknown> = {}
  try {
    body = await response.json() as Record<string, unknown>
  } catch {
    // Ari errors are handled from their HTTP status without exposing a raw body.
  }

  const id = typeof body.id === 'string' ? body.id : undefined
  if ((response.status === 202 || response.status === 200 || response.status === 409) && id) {
    return {
      id,
      version: typeof body.version === 'number' ? body.version : undefined,
      phase: typeof body.phase === 'string' ? body.phase : undefined,
      duplicate: response.status === 200 || response.status === 409,
    }
  }

  if (response.status === 422 && typeof body.field === 'string') {
    throw new AriPayloadError(`Ari could not accept this submission (${body.field})`)
  }
  if (response.status === 401) throw new AriConfigurationError('Ari rejected the ingest signature')
  if (response.status === 404) throw new AriConfigurationError('Ari program ID was not found')
  throw new Error('Ari could not accept this submission. Try again shortly.')
}

export function verifyAriWebhookSignature({
  timestamp,
  deliveryId,
  rawBody,
  signature,
}: {
  timestamp: string
  deliveryId: string
  rawBody: Buffer
  signature: string
}): boolean {
  const secret = requiredEnvironment('ARI_WEBHOOK_SECRET')
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false
  const signed = Buffer.concat([Buffer.from(`${timestamp}.${deliveryId}.`, 'utf8'), rawBody])
  const expected = Buffer.from(hmacHex(secret, signed), 'hex')
  const received = Buffer.from(signature, 'hex')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function isFreshAriTimestamp(timestamp: string, now = Date.now()): boolean {
  if (!/^\d+$/.test(timestamp)) return false
  const seconds = Number(timestamp)
  return Number.isSafeInteger(seconds) && Math.abs(now - seconds * 1000) <= 5 * 60 * 1000
}

export function parseAriEvent(value: unknown): AriEvent | null {
  if (!value || typeof value !== 'object') return null
  const event = value as Record<string, unknown>
  const names: AriEventName[] = [
    'ship.updated', 'review.approved', 'review.changes', 'review.rejected',
    'review.reverted', 'review.requeued', 'review.fraud',
  ]
  if (!names.includes(event.event as AriEventName) || typeof event.id !== 'string' || typeof event.external_id !== 'string') return null
  if (event.decision !== undefined && event.decision !== null && !['approved', 'changes', 'rejected'].includes(event.decision as string)) return null
  const review = event.review
  if (review !== undefined && (!review || typeof review !== 'object')) return null
  return event as unknown as AriEvent
}
