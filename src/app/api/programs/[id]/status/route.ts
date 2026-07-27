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

// These values are interpolated into GitHub API paths, so they must be
// validated to prevent path traversal (e.g. `..`) from redirecting the
// request to arbitrary repos in the org. Values originate from user input.
const VALID_TEMPLATES = new Set(['smol-template-sw', 'smol-template-hw'])
const SUBDOMAIN_RE = /^[a-z0-9-]{1,63}$/
const GITHUB_USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/

// DNS and HCB are manual admin tasks (DNS after the Vercel deploy exists, HCB
// org created by hand). They're "done" once an admin records the resource URL
// on the program — see the Created Resources card on the program detail page.
const MANUAL_STEPS = [
  { id: 'dns', label: 'Setting up DNS',              resource: 'domain' as const },
  { id: 'hcb', label: 'Creating HCB organization',   resource: 'hcb' as const },
]

// Creating the channel hits the real workspace, so it stays off unless
// explicitly enabled. With it off the channel is made by hand and the step is
// labelled to say so, rather than reporting work nobody did.
const SLACK_CREATION_ENABLED = process.env.SLACK_CHANNEL_CREATION === 'enabled'
const SLACK_LABEL = SLACK_CREATION_ENABLED
  ? 'Creating Slack channel'
  : 'Slack channel (created by an admin)'

// Airtable (unified database) and Fillout aren't built yet — still simulated.
const STUB_STEPS = [
  { id: 'airtable', label: 'Adding to unified database' },
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
      { id: 'slack',  label: SLACK_LABEL,                    status: 'done' },
      { id: 'github', label: 'Creating GitHub repository',  status: 'done' },
      ...MANUAL_STEPS.map(s => ({ id: s.id, label: s.label, status: 'done' as const })),
      ...STUB_STEPS.map(s => ({ ...s, status: 'done' as const })),
    ]
    return NextResponse.json({ phase: 'done', steps })
  }

  // status === 'accepted' — work through steps

  const slackStep:  CreationStep = { id: 'slack',  label: SLACK_LABEL,                  status: 'pending' }
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
        ...MANUAL_STEPS.map(s => ({ id: s.id, label: s.label, status: 'pending' as const })),
        ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
      ],
    })
  }

  // Step 1: Slack
  if (!SLACK_CREATION_ENABLED || program.resources.slack) {
    slackStep.status = 'done'
  } else {
    slackStep.status = 'in_progress'
    try {
      const channel = await createChannel(program.slackChannel)
      await updateProgram(id, {
        resources: { ...program.resources, slack: channel.url },
        errorStep: null,
        errorMessage: null,
      })
      slackStep.status = 'done'
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Slack channel creation failed:', message)
      await updateProgram(id, { errorStep: 'slack', errorMessage: message })
      return NextResponse.json({
        phase: 'error',
        errorStep: 'slack',
        errorMessage: message,
        steps: [
          { ...slackStep, status: 'error' },
          githubStep,
          ...MANUAL_STEPS.map(s => ({ id: s.id, label: s.label, status: 'pending' as const })),
          ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
        ],
      })
    }
  }

  // Step 2: GitHub
  if (program.resources.github) {
    githubStep.status = 'done'
  } else {
    githubStep.status = 'in_progress'
    try {
      const template = program.template ?? 'smol-template-sw'
      if (!VALID_TEMPLATES.has(template)) throw new Error(`Invalid template: ${template}`)
      if (!SUBDOMAIN_RE.test(program.subdomain)) throw new Error(`Invalid subdomain: ${program.subdomain}`)
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
        if (GITHUB_USERNAME_RE.test(program.creatorGithubUsername)) {
          await fetch(`https://api.github.com/repos/hackclub-smol/${repoName}/collaborators/${program.creatorGithubUsername}`, {
            method: 'PUT',
            headers: GITHUB_HEADERS,
            body: JSON.stringify({ permission: 'admin' }),
          })
          // Non-fatal: if this fails the repo still exists, admin can invite manually
        } else {
          console.warn('Skipping collaborator invite: invalid GitHub username', program.creatorGithubUsername)
        }
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
          ...MANUAL_STEPS.map(s => ({ id: s.id, label: s.label, status: 'pending' as const })),
          ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
        ],
      })
    }
  }

  // DNS & HCB: manual admin steps — done once the admin records the resource URL.
  const manualSteps: CreationStep[] = MANUAL_STEPS.map(s => ({
    id: s.id,
    label: s.label,
    status: program.resources[s.resource] ? 'done' : 'pending',
  }))
  const manualDone = manualSteps.every(s => s.status === 'done')

  // Airtable & Fillout: simulated — only start timer once GitHub is done.
  if (!stubStartTimes.has(id)) stubStartTimes.set(id, Date.now())
  const elapsed = Date.now() - stubStartTimes.get(id)!
  const completedStubs = Math.min(Math.floor(elapsed / 2500), STUB_STEPS.length)
  const stubsDone = completedStubs >= STUB_STEPS.length

  const stubSteps: CreationStep[] = STUB_STEPS.map((s, i) => ({
    ...s,
    status: i < completedStubs ? 'done' : i === completedStubs && !stubsDone ? 'in_progress' : 'pending',
  }))

  const steps = [slackStep, githubStep, ...manualSteps, ...stubSteps]

  // Program is flipped to 'active' by an Airtable automation based on the
  // start/end dates, so we don't set status here — 'done' just means every
  // provisioning step (including the manual admin ones) is complete.
  if (manualDone && stubsDone) {
    return NextResponse.json({ phase: 'done', steps })
  }

  return NextResponse.json({ phase: 'spinning', steps })
}
