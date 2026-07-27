'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CheckIcon, CloseIcon, SpinnerIcon } from '@/components/Icons'
import type { CreationStep } from '@/lib/types'

function StepRow({ step }: { step: CreationStep }) {
  const { status } = step
  const isDone = status === 'done'
  const isInProgress = status === 'in_progress'
  const isError = status === 'error'

  const rowTone = isInProgress
    ? 'bg-rose-50/70 border-rose-100'
    : isError
      ? 'bg-rose-50 border-rose-200'
      : 'border-transparent'

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${rowTone}`}>
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isDone
            ? 'bg-emerald-100 text-emerald-700'
            : isInProgress
              ? 'bg-hc-red text-white'
              : isError
                ? 'bg-rose-200 text-rose-800'
                : 'bg-gray-100 text-gray-400'
        }`}
      >
        {isDone && <CheckIcon size={12} />}
        {isInProgress && <SpinnerIcon size={12} />}
        {isError && <CloseIcon size={12} />}
        {status === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
      </div>

      <span className="flex-1 text-sm font-medium text-hc-dark">{step.label}</span>

      {isDone && <span className="badge badge-green">Done</span>}
      {isInProgress && (
        <span className="badge border-transparent bg-hc-red text-white">Working…</span>
      )}
      {isError && <span className="badge badge-red">Failed</span>}
      {status === 'pending' && <span className="badge badge-gray">Waiting</span>}
    </div>
  )
}

function Shell({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'error'
}) {
  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Navbar variant="admin" />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div
          className={`panel w-full max-w-xl px-6 py-10 sm:px-12 ${
            tone === 'error' ? 'border-rose-200' : ''
          }`}
        >
          {children}
        </div>
      </main>
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

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/programs/${params.id}/status`)
      const data = await res.json()

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

  const programLink = (
    <Link
      href={`/programs/${params.id}`}
      className="font-semibold text-gray-500 underline hover:text-hc-red"
    >
      program page
    </Link>
  )

  if (phase === 'waiting') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">⏳</span>
          <h1 className="font-display text-2xl font-extrabold text-hc-dark">
            Waiting on review
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-gray-500">
            A Hack Club admin is looking at your pitch. The moment they accept it,
            spin-up starts and this page updates itself.
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-gray-400">
            Safe to close — nothing is lost. Come back to your {programLink} any time.
          </p>
        </div>
      </Shell>
    )
  }

  if (phase === 'error') {
    const isSlackError = errorStep === 'slack'
    const isGithubError = errorStep === 'github'
    const isNameTaken =
      errorMessage.includes('name_taken') || errorMessage.includes('already exists')

    const errorHint =
      isSlackError && isNameTaken
        ? 'That Slack channel name is already in use. Pick a different one and we’ll pick up where we left off.'
        : isGithubError && isNameTaken
          ? 'A repo with that name already exists on GitHub. Choose a different website address and we’ll retry with a fresh repo.'
          : `Spin-up stopped with: ${errorMessage}`

    // Both recoverable errors are fixed by changing a slug and retrying.
    const fixField = isSlackError
      ? { label: 'New Slack channel name', placeholder: 'new-channel-name' }
      : isGithubError
        ? { label: 'New website address', placeholder: 'new-subdomain' }
        : null

    return (
      <Shell tone="error">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">⚠️</span>
            <h1 className="font-display text-2xl font-extrabold text-hc-dark">
              Spin-up hit a snag
            </h1>
            <p className="text-sm leading-relaxed text-gray-500">{errorHint}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            {steps.map(step => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>

          <form onSubmit={handleRetry} className="flex flex-col gap-3 border-t border-gray-100 pt-5">
            {fixField && (
              <>
                <label htmlFor="fix" className="field-label">
                  {fixField.label}
                </label>
                <input
                  id="fix"
                  type="text"
                  className="input"
                  placeholder={fixField.placeholder}
                  value={fixValue}
                  onChange={e =>
                    setFixValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  required
                />
              </>
            )}
            <button
              type="submit"
              disabled={retrying || (!!fixField && !fixValue)}
              className="btn btn-primary"
            >
              {retrying ? 'Retrying…' : 'Retry spin-up'}
            </button>
          </form>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-2xl font-extrabold text-hc-dark">
            {phase === 'done' ? 'Your smol is ready' : 'Setting up your smol'}
          </h1>
          <p className="text-sm text-gray-500">
            {phase === 'done'
              ? 'Everything is provisioned — taking you to the program now.'
              : 'Creating everything your program needs. Hang tight.'}
          </p>
        </div>

        <hr className="border-gray-100" />

        {phase === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
            <SpinnerIcon size={14} />
            Checking progress
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              {steps.map(step => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>

            {total > 0 && (
              <div className="flex flex-col gap-2">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-valuenow={doneCount}
                  aria-valuemin={0}
                  aria-valuemax={total}
                >
                  <div
                    className="h-full rounded-full bg-hc-red transition-all duration-500"
                    style={{ width: `${(doneCount / total) * 100}%` }}
                  />
                </div>
                <p className="text-center text-xs font-semibold text-gray-400">
                  {doneCount} of {total} steps done
                </p>
              </div>
            )}

            {waitingOnAdmin && (
              <p className="text-center text-xs text-amber-600">
                A couple of steps are handled by a smol admin by hand — those can take a
                while.
              </p>
            )}

            <p className="text-center text-xs text-gray-400">
              Safe to close — reopen your {programLink} any time to check progress.
            </p>
          </>
        )}
      </div>
    </Shell>
  )
}
