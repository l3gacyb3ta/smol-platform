import { NextRequest, NextResponse } from 'next/server'
import { getProgram, updateProgram } from '@/lib/airtable'
import { createChannel } from '@/lib/slack'
import { auth } from '@/auth'
import { canAccessProgram } from '@/lib/permissions'
import type { CreationStep } from '@/lib/types'

const GITHUB_HEADERS = {
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
}

// Steps after GitHub are still stubbed — replace with real calls as you add integrations
const STUB_STEPS = [
  { id: 'dns',      label: 'Setting up DNS' },
  { id: 'hcb',      label: 'Creating HCB organization' },
  { id: 'airtable', label: 'Creating Airtable base' },
  { id: 'fillout',  label: 'Creating Fillout form' },
]

// Tracks when stub spin-up began per program (starts after GitHub is done)
const stubStartTimes = new Map<string, number>()

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const [session, program] = await Promise.all([auth(), getProgram(id)])
  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessProgram(session?.user?.slackId, program)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (program.status === 'pending') {
    return NextResponse.json({ phase: 'waiting' })
  }

  if (program.status === 'active') {
    const steps: CreationStep[] = [
      { id: 'slack',  label: 'Creating Slack channel',      status: 'done' },
      { id: 'github', label: 'Creating GitHub repository',  status: 'done' },
      ...STUB_STEPS.map(s => ({ ...s, status: 'done' as const })),
    ]
    return NextResponse.json({ phase: 'done', steps })
  }

  // status === 'accepted' — work through steps

  const slackStep:  CreationStep = { id: 'slack',  label: 'Creating Slack channel',     status: 'pending' }
  const githubStep: CreationStep = { id: 'github', label: 'Creating GitHub repository', status: 'pending' }

  // If a previous attempt left an error, surface it immediately
  if (program.errorStep) {
    return NextResponse.json({
      phase: 'error',
      errorStep: program.errorStep,
      errorMessage: program.errorMessage,
      steps: [
        { ...slackStep,  status: program.resources.slack   ? 'done' : program.errorStep === 'slack'  ? 'error' : 'pending' },
        { ...githubStep, status: program.resources.github  ? 'done' : program.errorStep === 'github' ? 'error' : 'pending' },
        ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
      ],
    })
  }

  // Step 1: Slack
  if (false) {
    if (program!.resources.slack) {
      slackStep.status = 'done'
    } else {
      slackStep.status = 'in_progress'
      try {
        const channel = await createChannel(program!.slackChannel)
        await updateProgram(id, {
          resources: { ...program!.resources, slack: channel.url },
          errorStep: null,
          errorMessage: null,
        })
        slackStep.status = 'done'
      } catch (err) {
        const message = String(err)
        console.error('Slack channel creation failed:', message)
        await updateProgram(id, { errorStep: 'slack', errorMessage: message })
        return NextResponse.json({
          phase: 'error',
          errorStep: 'slack',
          errorMessage: message,
          steps: [
            { ...slackStep, status: 'error' },
            githubStep,
            ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
          ],
        })
      }
    }
  } else {
    slackStep.status = 'done'
  }

  // Step 2: GitHub
  if (program.resources.github) {
    githubStep.status = 'done'
  } else {
    githubStep.status = 'in_progress'
    try {
      const template = program.template ?? 'smol-template-sw'
      const repoName = `smol-${program.subdomain}`

      const createRes = await fetch(`https://api.github.com/repos/hackclub/${template}/generate`, {
        method: 'POST',
        headers: GITHUB_HEADERS,
        body: JSON.stringify({ owner: 'hackclub-smol', name: repoName, private: false }),
      })

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}))
        throw new Error((errBody as { message?: string }).message ?? `GitHub API error ${createRes.status}`)
      }

      const repo = await createRes.json() as { html_url: string }

      // Wait for GitHub to finish copying template files before writing smol.json.
      // The generate endpoint returns immediately but the initial commit is async.
      let templateReady = false
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const commitsRes = await fetch(`https://api.github.com/repos/hackclub-smol/${repoName}/commits`, {
          headers: GITHUB_HEADERS,
        })
        if (commitsRes.ok) {
          const commits = await commitsRes.json() as unknown[]
          if (Array.isArray(commits) && commits.length > 0) { templateReady = true; break }
        }
      }
      if (!templateReady) throw new Error('Timed out waiting for template initialization')

      // Write smol.json on top of the initialized template
      const configContent = JSON.stringify({ project: program.slackChannel }, null, 2)
      const contentRes = await fetch(`https://api.github.com/repos/hackclub-smol/${repoName}/contents/smol.json`, {
        method: 'PUT',
        headers: GITHUB_HEADERS,
        body: JSON.stringify({
          message: 'init: set project config',
          content: Buffer.from(configContent).toString('base64'),
        }),
      })
      if (!contentRes.ok) {
        const errBody = await contentRes.json().catch(() => ({}))
        throw new Error(`Failed to write smol.json: ${(errBody as { message?: string }).message ?? contentRes.status}`)
      }

      // Add submitter as admin collaborator
      if (program.creatorGithubUsername) {
        await fetch(`https://api.github.com/repos/hackclub-smol/${repoName}/collaborators/${program.creatorGithubUsername}`, {
          method: 'PUT',
          headers: GITHUB_HEADERS,
          body: JSON.stringify({ permission: 'admin' }),
        })
        // Non-fatal: if this fails the repo still exists, admin can invite manually
      }

      await updateProgram(id, {
        resources: { ...program.resources, github: repo.html_url },
        errorStep: null,
        errorMessage: null,
      })
      githubStep.status = 'done'
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('GitHub repo creation failed:', message)
      await updateProgram(id, { errorStep: 'github', errorMessage: message })
      return NextResponse.json({
        phase: 'error',
        errorStep: 'github',
        errorMessage: message,
        steps: [
          slackStep,
          { ...githubStep, status: 'error' },
          ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
        ],
      })
    }
  }

  // Steps 3–6: simulated — only start timer once GitHub is done
  if (!stubStartTimes.has(id)) stubStartTimes.set(id, Date.now())
  const elapsed = Date.now() - stubStartTimes.get(id)!
  const completedStubs = Math.min(Math.floor(elapsed / 2500), STUB_STEPS.length)
  const allDone = completedStubs >= STUB_STEPS.length

  const stubSteps: CreationStep[] = STUB_STEPS.map((s, i) => ({
    ...s,
    status: i < completedStubs ? 'done' : i === completedStubs && !allDone ? 'in_progress' : 'pending',
  }))

  if (allDone) {
    stubSteps.forEach(s => { s.status = 'done' })
    // TODO: mark program active once all real steps are implemented
    // await updateProgram(id, { status: 'active' })
    return NextResponse.json({
      phase: 'done',
      steps: [slackStep, githubStep, ...stubSteps],
    })
  }

  return NextResponse.json({
    phase: 'spinning',
    steps: [slackStep, githubStep, ...stubSteps],
  })
}
