import { NextRequest, NextResponse } from 'next/server'
import { getProgram, updateProgram } from '@/lib/airtable'
import { createChannel } from '@/lib/slack'
import type { CreationStep } from '@/lib/types'

// Steps after Slack are still stubbed — replace with real calls as you add integrations
const STUB_STEPS = [
  { id: 'github',   label: 'Creating GitHub repository' },
  { id: 'dns',      label: 'Setting up DNS' },
  { id: 'hcb',      label: 'Creating HCB organization' },
  { id: 'airtable', label: 'Creating Airtable base' },
  { id: 'fillout',  label: 'Creating Fillout form' },
]

// Tracks when stub spin-up began per program (starts after Slack is done)
const stubStartTimes = new Map<string, number>()

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const program = await getProgram(id)
  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (program.status === 'pending') {
    return NextResponse.json({ phase: 'waiting' })
  }

  if (program.status === 'active') {
    const steps: CreationStep[] = [
      { id: 'slack', label: 'Creating Slack channel', status: 'done' },
      ...STUB_STEPS.map(s => ({ ...s, status: 'done' as const })),
    ]
    return NextResponse.json({ phase: 'done', steps })
  }

  // status === 'accepted' — work through steps

  // If a previous attempt left an error, surface it immediately
  if (program.errorStep) {
    return NextResponse.json({
      phase: 'error',
      errorStep: program.errorStep,
      errorMessage: program.errorMessage,
      steps: [
        { id: 'slack', label: 'Creating Slack channel', status: program.resources.slack ? 'done' : 'error' },
        ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
      ],
    })
  }

  const slackStep: CreationStep = { id: 'slack', label: 'Creating Slack channel', status: 'pending' }

  // Step 1: Slack — use real API
  if (program.resources.slack) {
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
          ...STUB_STEPS.map(s => ({ ...s, status: 'pending' as const })),
        ],
      })
    }
  }

  // Steps 2–6: simulated — only start timer once Slack is done
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
      steps: [slackStep, ...stubSteps],
    })
  }

  return NextResponse.json({
    phase: 'spinning',
    steps: [slackStep, ...stubSteps],
  })
}
