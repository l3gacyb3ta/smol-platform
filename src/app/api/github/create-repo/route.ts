import { NextRequest, NextResponse } from 'next/server'

// TODO: Replace with real GitHub API call.
// Use the GitHub REST API: POST /orgs/{org}/repos
// Requires env var: GITHUB_TOKEN with repo creation scope
// const org = 'hackclub'

export async function POST(req: NextRequest) {
  const { name, description } = await req.json()

  if (!name) {
    return NextResponse.json({ error: 'Missing repo name' }, { status: 400 })
  }

  // Stub response
  return NextResponse.json({
    url: `https://github.com/hackclub/${name}`,
    name,
    description,
    stubbed: true,
  })
}
