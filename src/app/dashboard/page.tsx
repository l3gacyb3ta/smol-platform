'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import LoginButton from '@/components/LoginButton'
import { ProgramCard } from '@/components/ProgramCard'
import { ProgramStatusBadge } from '@/components/StatusBadge'
import { PencilIcon, TrashIcon } from '@/components/Icons'
import { formatDateRange } from '@/lib/format'
import { programHost } from '@/lib/constants'
import type { Program } from '@/lib/types'
import DeleteButton from '@/app/programs/[id]/DeleteButton'

type FetchState = 'loading' | 'ready' | 'unauthorized' | 'failed'

function AdminProgramCard({ program, onDeleted }: { program: Program; onDeleted: () => void }) {
  const dates = formatDateRange(program.startDate, program.endDate)

  return (
    <ProgramCard
      program={program}
      badge={<ProgramStatusBadge status={program.status} />}
      className="transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Stretched link: keeps the whole card clickable without nesting
          anchors inside the action buttons below. */}
      <Link
        href={`/programs/${program.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${program.name}`}
      />

      <div className="pointer-events-none mt-auto flex flex-col gap-1.5 text-sm text-gray-500">
        <span className="font-medium">#{program.slackChannel}</span>
        <span className="truncate">{programHost(program.subdomain)}</span>
        {dates && <span className="text-xs text-gray-400">{dates}</span>}
      </div>

      <div className="relative z-10 flex justify-end gap-2">
        <Link
          href={`/programs/${program.id}/edit`}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
          title={`Edit ${program.name}`}
          aria-label={`Edit ${program.name}`}
        >
          <PencilIcon size={15} />
        </Link>
        <DeleteButton
          programId={program.id}
          programName={program.name}
          onSuccess={onDeleted}
          trigger={
            <button
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-rose-50 text-hc-red transition-colors hover:bg-rose-100"
              title={`Delete ${program.name}`}
              aria-label={`Delete ${program.name}`}
            >
              <TrashIcon size={15} />
            </button>
          }
        />
      </div>
    </ProgramCard>
  )
}

function SkeletonCard() {
  return (
    <div className="card flex h-full flex-col overflow-hidden" aria-hidden="true">
      <div className="h-1.5 w-full bg-gray-200" />
      <div className="animate-pulse-soft flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
          </div>
          <div className="h-6 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="mt-auto space-y-2">
          <div className="h-3 w-1/3 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { status: authStatus } = useSession()
  const [programs, setPrograms] = useState<Program[]>([])
  const [fetchState, setFetchState] = useState<FetchState>('loading')

  useEffect(() => {
    if (authStatus !== 'authenticated') return

    let cancelled = false
    fetch('/api/programs')
      .then(async res => {
        if (cancelled) return
        if (res.status === 401) return setFetchState('unauthorized')
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data: unknown = await res.json()
        if (cancelled) return
        setPrograms(Array.isArray(data) ? data : [])
        setFetchState('ready')
      })
      .catch(() => {
        if (!cancelled) setFetchState('failed')
      })

    return () => {
      cancelled = true
    }
  }, [authStatus])

  // Derived rather than stored, so signing out never leaves stale UI behind.
  const state: FetchState =
    authStatus === 'unauthenticated'
      ? 'unauthorized'
      : authStatus === 'loading'
        ? 'loading'
        : fetchState

  const counts = {
    total: programs.length,
    running: programs.filter(p => p.status === 'active').length,
    settingUp: programs.filter(p => p.status === 'accepted').length,
    inReview: programs.filter(p => p.status === 'pending').length,
  }

  const stats = [
    `${counts.total} total`,
    ...(counts.running ? [`${counts.running} running`] : []),
    ...(counts.settingUp ? [`${counts.settingUp} setting up`] : []),
    ...(counts.inReview ? [`${counts.inReview} in review`] : []),
  ]

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Navbar variant="admin" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-hc-dark">Programs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Every smol you can see, and how far along it is.
            </p>
          </div>
          <Link href="/programs/new" className="btn btn-primary self-start sm:self-auto">
            Pitch a new smol
          </Link>
        </header>

        {state === 'ready' && programs.length > 0 && (
          <div className="mb-7 flex flex-wrap gap-2">
            {stats.map(stat => (
              <span key={stat} className="pill">
                {stat}
              </span>
            ))}
          </div>
        )}

        {state === 'loading' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <span className="sr-only" role="status">
              Loading programs
            </span>
          </div>
        )}

        {state === 'unauthorized' && (
          <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
            <h2 className="font-display text-lg font-bold text-hc-dark">
              Log in to see your programs
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              smol uses your Hack Club account, the same one you use for the Slack.
            </p>
            <LoginButton className="btn btn-primary mt-1" callbackUrl="/dashboard">
              Log in with Hack Club
            </LoginButton>
          </div>
        )}

        {state === 'failed' && (
          <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
            <h2 className="font-display text-lg font-bold text-hc-dark">
              Couldn&apos;t load your programs
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Something went wrong between here and Airtable. Give it another go.
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary mt-1">
              Try again
            </button>
          </div>
        )}

        {state === 'ready' && programs.length === 0 && (
          <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
            <h2 className="font-display text-lg font-bold text-hc-dark">No programs yet</h2>
            <p className="text-sm leading-relaxed text-gray-500">
              Pitch your first smol and we&apos;ll set up the Slack channel, the site,
              the repo, and the submission form for you.
            </p>
            <Link href="/programs/new" className="btn btn-primary mt-1">
              Pitch a new smol
            </Link>
          </div>
        )}

        {state === 'ready' && programs.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {programs.map(program => (
              <AdminProgramCard
                key={program.id}
                program={program}
                onDeleted={() => setPrograms(prev => prev.filter(p => p.id !== program.id))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
