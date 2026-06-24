import { NextRequest, NextResponse } from 'next/server'
import { checkChannelExists } from '@/lib/slack'

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get('channel')?.toLowerCase().trim()

  if (!channel || channel.length < 2) {
    return NextResponse.json({ error: 'Missing or too-short channel name' }, { status: 400 })
  }

  const exists = await checkChannelExists(channel)
  return NextResponse.json({ available: !exists, channel })
}
