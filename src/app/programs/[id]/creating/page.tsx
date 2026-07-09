'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import type { CreationStep } from '@/lib/types'

function StepRow({ step }: { step: CreationStep }) {
  const isDone = step.status === 'done'
  const isInProgress = step.status === 'in_progress'
  const isPending = step.status === 'pending'
  const isError = step.status === 'error'

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${isInProgress ? 'bg-red-50 border border-red-100' : isError ? 'bg-red-50 border border-red-200' : ''}`}
    >
      {/* Status icon */}
      <div
        className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: isDone ? '#d1fae5' : isInProgress ? '#ec3750' : isError ? '#fecdd3' : '#f3f4f6',
        }}
      >
        {isDone && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        {isInProgress && (
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
            className="animate-spin-slow"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )}
        {isError && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        )}
        {isPending && (
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Label */}
      <span className="flex-1 text-sm text-hc-dark">{step.label}</span>

      {/* Status pill */}
      {isDone && (
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
        >
          Done
        </span>
      )}
      {isInProgress && (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#ec3750' }}>
          In progress...
        </span>
      )}
      {isError && (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          Failed
        </span>
      )}
      {isPending && (
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full text-gray-500"
          style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}
        >
          Pending
        </span>
      )}
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
    let interval: ReturnType<typeof setInterval>

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

    poll()
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [params.id, router, retryCount])

  async function handleRetry(e: React.FormEvent) {
    e.preventDefault()
    setRetrying(true)
    const patch: Record<string, string | null> = { errorStep: null, errorMessage: null }
    if (errorStep === 'slack') patch.slackChannel = fixValue
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

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col grid-bg">
        <Navbar variant="admin" />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div
            className="bg-white rounded-3xl w-full max-w-xl px-14 pt-12 pb-14 flex flex-col items-center gap-4 text-center"
            style={{ border: '1px solid #e5e7eb', boxShadow: '0 16px 24px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <div className="text-4xl">⏳</div>
            <h1
              className="text-hc-dark text-2xl font-extrabold"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              Waiting for approval
            </h1>
            <p className="text-gray-500 text-sm max-w-sm">
              Your program is under review. Once a Hack Club admin accepts it, spin-up will begin automatically and this page will update.
            </p>
            <p className="text-gray-400 text-xs mt-2">This page checks for updates every few seconds.</p>
          </div>
        </main>
      </div>
    )
  }

  if (phase === 'error') {
    const label = errorStep === 'slack' ? 'Slack channel name' : 'value'
    const isNameTaken = errorMessage.includes('name_taken') || errorMessage.includes('already exists')
    return (
      <div className="min-h-screen flex flex-col grid-bg">
        <Navbar variant="admin" />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div
            className="bg-white rounded-3xl w-full max-w-xl px-14 pt-12 pb-14 flex flex-col gap-6"
            style={{ border: '1px solid #fecdd3', boxShadow: '0 16px 24px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="text-3xl">⚠️</div>
              <h1
                className="text-hc-dark text-2xl font-extrabold"
                style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
              >
                Spin-up hit a snag
              </h1>
              <p className="text-gray-500 text-sm">
                {isNameTaken
                  ? `The ${label} is already taken. Pick a different one and we'll retry.`
                  : `Something went wrong: ${errorMessage}`}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {steps.map(step => <StepRow key={step.id} step={step} />)}
            </div>

            <form onSubmit={handleRetry} className="flex flex-col gap-3 pt-2 border-t border-gray-100">
              <label className="text-sm font-semibold text-gray-700">
                New {label}
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hc-red focus:border-transparent transition"
                placeholder={errorStep === 'slack' ? 'new-channel-name' : ''}
                value={fixValue}
                onChange={e => setFixValue(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                required
              />
              <button
                type="submit"
                disabled={retrying || !fixValue}
                className="bg-hc-red text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {retrying ? 'Retrying…' : 'Retry spin-up →'}
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar variant="admin" />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div
          className="bg-white rounded-3xl w-full max-w-xl px-14 pt-12 pb-14 flex flex-col gap-6"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 16px 24px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1
              className="text-hc-dark text-2xl font-extrabold"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              Setting up your Smol...
            </h1>
            <p className="text-gray-500 text-sm">
              {`We're creating everything you need — hang tight!`}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Steps */}
          {phase === 'loading' ? (
            <div className="text-center text-gray-400 text-sm py-4">Loading...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {steps.map(step => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          )}

          {/* Progress */}
          {phase !== 'loading' && (
            <p className="text-center text-xs text-gray-400">
              {doneCount} of {total} steps complete
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
