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

export async function archiveChannel(channelId: string): Promise<void> {
  const data = await slackPost('conversations.archive', { channel: channelId })
  if (!data.ok && data.error !== 'already_archived') {
    throw new Error(`Slack error: ${data.error}`)
  }
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
  return {
    id: channel.id,
    name: channel.name,
    url: `https://hackclub.slack.com/archives/${channel.id}`,
  }
}

