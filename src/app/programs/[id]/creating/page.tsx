'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Blank from '@/components/Blank'
import { OWNER_LABEL, ownerOfStep } from '@/lib/provisioning'
import type { CreationStep, StepStatus } from '@/lib/types'

/* ---------------------------------------------------------------------------
   The spin-up log. Mode: instrument.

   This is a log, so it is set as one: monospace, one line per step, states in a
   fixed column so the eye runs down it. It used to be a stack of rounded rows
   with a coloured circle and a pill each.

   The column that matters most is `owner`. Two of these steps are done by a
   person, and two of them are not really done at all — they advance on a timer
   while nothing gets created (see the README). A log that reports all six the
   same way is lying by omission, so each row says who or what it is waiting on.
   --------------------------------------------------------------------------- */

const STATE_LABEL: Record<StepStatus, { text: string; tone: string }> = {
  done: { text: 'done', tone: 'state-clear' },
  in_progress: { text: 'working…', tone: 'state-hold' },
  pending: { text: 'waiting', tone: '' },
  error: { text: 'failed', tone: 'state-attention' },
}

/**
 * What each step is still waiting on.
 *
 * This column used to be headed "Done by" and answered a question nobody had —
 * it named the actor even for steps that had already finished. "Waiting on" is
 * the useful reading: it says which unfinished rows will clear themselves and
 * which are sitting on a person, so you know whether to wait or go chase someone.
 *
 * The ownership itself comes from lib/provisioning.ts, which the program page's
 * provisioning table also reads. That shared list is the point: these two screens
 * describe the same six things and had drifted, with this one calling the Airtable
 * and Fillout steps simulated while the other showed them as unrecorded in red.
 */
function waitingOn(step: CreationStep): string {
  if (step.status === 'done') return '—'
  if (step.status === 'error') return 'a human — see below'
  return OWNER_LABEL[ownerOfStep(step.id)]
}

function StepRows({ steps }: { steps: CreationStep[] }) {
  const doneCount = steps.filter(s => s.status === 'done').length

  return (
    <div className="ledger-scroll" tabIndex={0} role="region" aria-label="Spin-up log">
      <table className="spinup-log">
        <colgroup>
          <col style={{ width: '38%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '44%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">State</th>
            <th scope="col">Waiting on</th>
          </tr>
        </thead>
        <tbody>
          {steps.map(step => {
            const state = STATE_LABEL[step.status] ?? STATE_LABEL.pending
            return (
              <tr key={step.id}>
                <td className="spinup-step">{step.label}</td>
                <td>
                  <span
                    className={`state ${state.tone}${
                      step.status === 'in_progress' ? ' working' : ''
                    }`}
                  >
                    {state.text}
                  </span>
                </td>
                <td className="tally">{waitingOn(step)}</td>
              </tr>
            )
          })}
        </tbody>
        {/* The total belongs to the log, below its own rule — not floating under
            the table as a loose bar. */}
        <tfoot>
          <tr>
            <th scope="row">
              {doneCount} of {steps.length} done
            </th>
            <td colSpan={2}>
              <span className="spinup-total">
                <span
                  className="tally-bar"
                  role="progressbar"
                  aria-label="Spin-up progress"
                  aria-valuenow={doneCount}
                  aria-valuemin={0}
                  aria-valuemax={steps.length}
                >
                  <span
                    className="tally-fill"
                    style={{ width: `${(doneCount / steps.length) * 100}%` }}
                  />
                </span>
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * The handover. Shown the moment a repo exists, which is four steps before
 * spin-up reports done.
 *
 * Nothing left in the queue blocks writing the site — DNS only decides when it
 * goes public — so a page that just said "hang tight" for all six steps was
 * withholding the one thing the creator could actually get on with.
 */
function HeadStart({ repoUrl, dnsPending }: { repoUrl: string; dnsPending: boolean }) {
  const [copied, setCopied] = useState(false)

  async function copyClone() {
    try {
      await navigator.clipboard.writeText(`git clone ${repoUrl}.git`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked or unavailable. The command is right there to select.
    }
  }

  return (
    <div className="headstart">
      <h2>Your repo is ready — start building</h2>
      <p>
        The site template is generated and you have admin on it. You don&apos;t have to wait for the
        rest of this page: clone it and start writing.
      </p>

      <div className="command">
        <code>git clone {repoUrl}.git</code>
        <button onClick={copyClone} className="action">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="action-row">
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="action action-strong">
          Open the repo ↗
        </a>
        <span className="tally">
          {dnsPending
            ? 'Pushing works now. The site goes public once an admin points DNS at it.'
            : 'Pushing to the default branch deploys the site.'}
        </span>
      </div>
    </div>
  )
}

type Phase = 'loading' | 'waiting' | 'spinning' | 'done' | 'error'

export default function CreatingPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [steps, setSteps] = useState<CreationStep[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [errorStep, setErrorStep] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fixValue, setFixValue] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  // Comes back on every poll, non-null from the moment the repo exists.
  const [repoUrl, setRepoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/programs/${params.id}/status`)
      const data = await res.json()

      // Set before the early return: a repo that already exists is still worth
      // handing over on a page that is otherwise reporting a failure further down.
      if (typeof data.repoUrl === 'string') setRepoUrl(data.repoUrl)

      if (data.phase === 'error') {
        setPhase('error')
        setErrorStep(data.errorStep ?? '')
        setErrorMessage(data.errorMessage ?? '')
        if (data.steps) setSteps(data.steps)
        clearInterval(interval)
        return
      }

      setPhase(data.phase === 'waiting' ? 'waiting' : data.phase === 'done' ? 'done' : 'spinning')
      if (data.steps) setSteps(data.steps)

      if (data.phase === 'done') {
        clearInterval(interval)
        setTimeout(() => router.push(`/programs/${params.id}`), 1500)
      }
    }

    const interval = setInterval(poll, 2000)
    poll()
    return () => clearInterval(interval)
  }, [params.id, router, retryCount])

  async function handleRetry(e: React.FormEvent) {
    e.preventDefault()
    setRetrying(true)
    const patch: Record<string, string | null> = { errorStep: null, errorMessage: null }
    if (errorStep === 'slack') patch.slackChannel = fixValue
    if (errorStep === 'github') patch.subdomain = fixValue
    await fetch(`/api/programs/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setFixValue('')
    setRetrying(false)
    setRetryCount(c => c + 1) // restarts the polling effect
  }

  const doneCount = steps.filter(s => s.status === 'done').length
  const total = steps.length
  const waitingOnAdmin = steps.some(
    s => (s.id === 'dns' || s.id === 'hcb') && s.status === 'pending'
  )
  const dnsPending = steps.some(s => s.id === 'dns' && s.status !== 'done')

  const isSlackError = errorStep === 'slack'
  const isGithubError = errorStep === 'github'
  const isNameTaken =
    errorMessage.includes('name_taken') || errorMessage.includes('already exists')

  // Both recoverable errors are fixed by changing a slug and retrying.
  const fixField = isSlackError
    ? { label: 'New Slack channel name', placeholder: 'new-channel-name' }
    : isGithubError
      ? { label: 'New website address', placeholder: 'new-subdomain' }
      : null

  return (
    <>
      <SiteHeader />

      <main className="sheet instrument">
        <Link href={`/programs/${params.id}`} className="crumb">
          ← Program page
        </Link>

        <div className="section-head">
          <h1>
            {phase === 'waiting'
              ? 'Waiting on review'
              : phase === 'error'
                ? 'Spin-up stopped'
                : phase === 'done'
                  ? 'Spin-up complete'
                  : 'Spin-up log'}
          </h1>
          <span className="tally">
            {total > 0 ? `${doneCount} of ${total} steps done · polling every 2s` : 'polling'}
          </span>
        </div>

        {phase === 'waiting' && (
          <div className="empty">
            <p>
              A Hack Club admin is looking at this pitch. The moment they accept it, spin-up starts
              and this page picks it up on its own.
            </p>
            <p className="tally">
              Safe to close — nothing is lost. Come back to the{' '}
              <Link href={`/programs/${params.id}`}>program page</Link> any time.
            </p>
          </div>
        )}

        {phase === 'loading' && (
          <p className="empty" role="status">
            <span className="working">Checking progress…</span>
          </p>
        )}

        {phase === 'error' && (
          <div className="notice notice-attention">
            <span>
              {isSlackError && isNameTaken
                ? 'That Slack channel name is already in use. Pick a different one and spin-up picks up where it left off.'
                : isGithubError && isNameTaken
                  ? 'A repo with that name already exists on GitHub. Choose a different website address and spin-up retries with a fresh repo.'
                  : `Spin-up stopped with: ${errorMessage}`}
            </span>
          </div>
        )}

        {/* Above the log, not below it: once there is a repo this is the most
            actionable thing on the page, and the log becomes reference. */}
        {repoUrl && <HeadStart repoUrl={repoUrl} dnsPending={dnsPending} />}

        {steps.length > 0 && (
          <>
            <StepRows steps={steps} />
            {waitingOnAdmin && (
              <p className="edition">
                Two steps are done by a smol admin by hand and can take a while.
              </p>
            )}
          </>
        )}

        {phase === 'error' && (
          <form onSubmit={handleRetry} className="form-actions">
            {fixField && (
              <span>
                {fixField.label}:{' '}
                <Blank
                  label={fixField.label}
                  size="slug"
                  value={fixValue}
                  onChange={e => setFixValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder={fixField.placeholder}
                  required
                />
              </span>
            )}
            <button
              type="submit"
              disabled={retrying || (!!fixField && !fixValue)}
              className="action action-strong"
            >
              {retrying ? 'Retrying…' : 'Retry spin-up'}
            </button>
          </form>
        )}

        {(phase === 'spinning' || phase === 'done') && (
          <p className="tally">
            {phase === 'done'
              ? 'Everything recorded — taking you to the program now.'
              : 'Safe to close.'}{' '}
            Reopen the <Link href={`/programs/${params.id}`}>program page</Link> any time to check
            progress.
          </p>
        )}
      </main>

      <SiteFooter />
    </>
  )
}
