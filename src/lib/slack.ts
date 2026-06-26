const SLACK_API = 'https://slack.com/api'

function log(...args: unknown[]) {
  console.log('[slack]', ...args)
}

// Respects Retry-After on 429s, retries up to maxRetries times
async function slackFetch(url: URL | string, init: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, { ...init, cache: 'no-store' })
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '10', 10)
      log(`rate limited — waiting ${retryAfter}s (attempt ${attempt}/${maxRetries})`)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      continue
    }
    return res
  }
  throw new Error('Slack rate limit: max retries exceeded')
}

async function slackGet(method: string, params: Record<string, string> = {}) {
  const url = new URL(`${SLACK_API}/${method}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  log(`GET ${method}`, params)
  const res = await slackFetch(url, {
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
  })
  const json = await res.json()
  if (!json.ok) log(`GET ${method} error:`, json.error)
  return json
}

async function slackPost(method: string, body: Record<string, unknown>) {
  log(`POST ${method}`, body)
  const res = await slackFetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.ok) log(`POST ${method} error:`, json.error)
  return json
}

// Cache the full channel name set — one paginated fetch serves all lookups until TTL expires
const CHANNEL_LIST_TTL = 30 * 60_000 // 30 minutes
let channelNames: Set<string> | null = null
let channelListFetchedAt = 0
let channelListInflight: Promise<Set<string>> | null = null

async function fetchAllChannelNames(): Promise<Set<string>> {
  // Deduplicate concurrent calls (e.g. two fields checking at the same time)
  if (channelListInflight) {
    log('cache fetch already in flight — awaiting existing promise')
    return channelListInflight
  }

  channelListInflight = (async () => {
    log('starting full channel list fetch')
    const names = new Set<string>()
    let cursor: string | undefined
    let page = 0
    do {
      const params: Record<string, string> = {
        types: 'public_channel',
        exclude_archived: 'false',
        limit: '200',
      }
      if (cursor) params.cursor = cursor
      const data = await slackGet('conversations.list', params)
      if (!data.ok) throw new Error(`Slack error: ${data.error}`)
      page++
      const count = (data.channels as Array<{ name: string }>).length
      log(`fetched page ${page} — ${count} channels (${names.size + count} total so far)`)
      for (const c of data.channels as Array<{ name: string }>) names.add(c.name)
      cursor = data.response_metadata?.next_cursor || undefined
    } while (cursor)
    log(`channel list cache warmed — ${names.size} channels across ${page} pages`)
    return names
  })()

  try {
    const names = await channelListInflight
    channelNames = names
    channelListFetchedAt = Date.now()
    return names
  } finally {
    channelListInflight = null
  }
}

async function getChannelNames(): Promise<Set<string>> {
  if (channelNames && Date.now() - channelListFetchedAt < CHANNEL_LIST_TTL) {
    const age = Math.round((Date.now() - channelListFetchedAt) / 1000)
    log(`cache hit — ${channelNames.size} channels, age ${age}s`)
    return channelNames
  }
  log(`cache miss or expired — fetching fresh list`)
  return fetchAllChannelNames()
}

export async function archiveChannel(channelId: string): Promise<void> {
  const data = await slackPost('conversations.archive', { channel: channelId })
  if (!data.ok && data.error !== 'already_archived') {
    throw new Error(`Slack error: ${data.error}`)
  }
}

export async function checkChannelExists(name: string): Promise<boolean> {
  const names = await getChannelNames()
  const exists = names.has(name)
  log(`checkChannelExists("${name}") → ${exists ? 'exists' : 'available'}`)
  return exists
}

export async function createChannel(name: string): Promise<{ id: string; name: string; url: string }> {
  const data = await slackPost('conversations.create', {
    name,
    is_private: false,
  })

  if (!data.ok) {
    throw new Error(`Slack error: ${data.error}`)
  }

  const channel = data.channel as { id: string; name: string }
  // Update the name cache so subsequent availability checks reflect reality immediately
  channelNames?.add(channel.name)
  return {
    id: channel.id,
    name: channel.name,
    url: `https://hackclub.slack.com/archives/${channel.id}`,
  }
}

