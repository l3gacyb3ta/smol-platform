'use client'

import { useState, useEffect } from 'react'
import { SubmissionStatusBadge } from '@/components/StatusBadge'
import {
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  ExternalLinkIcon,
  ImagePlaceholderIcon,
} from '@/components/Icons'
import type { Submission } from '@/lib/airtable-submissions'

type Filter = 'all' | 'Pending' | 'Accepted' | 'Rejected'

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
    >
      {label}
      <ExternalLinkIcon size={10} strokeWidth={2.5} />
    </a>
  )
}

function ContactRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-24 shrink-0 text-gray-400">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  )
}

function hackatimeApiUrl(projectUrl: string): string | null {
  try {
    const { pathname } = new URL(projectUrl)
    // format: /@username/project/project-name
    const m = pathname.match(/\/@([^/]+)\/project\/([^/]+)/)
    if (!m) return null
    return `https://hackatime.smol.hackclub.com/api/v1/users/${m[1]}/project/${m[2]}`
  } catch {
    return null
  }
}

function useHackatimeHours(projectUrl?: string) {
  const [hours, setHours] = useState<number | null>(null)
  useEffect(() => {
    const apiUrl = projectUrl ? hackatimeApiUrl(projectUrl) : null
    if (!apiUrl) return
    fetch(apiUrl)
      .then(r => r.json())
      .then(d => {
        if (typeof d.total_seconds === 'number') setHours(d.total_seconds / 3600)
      })
      .catch(() => {})
  }, [projectUrl])
  return hours
}

function SubmissionCard({
  submission,
  isAdmin,
  onReview,
  reviewing,
}: {
  submission: Submission
  isAdmin: boolean
  onReview: (id: string, action: 'accept' | 'reject', adjustedHours?: number) => void
  reviewing: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [adjustedHours, setAdjustedHours] = useState('')
  const thumb = submission.screenshot?.[0]
  const isPending = submission.status === 'Pending'
  const hackatimeHours = useHackatimeHours(submission.hackatimeProject)

  const hasContactInfo =
    isAdmin &&
    Boolean(
      submission.email ||
        submission.phoneNumber ||
        submission.birthday ||
        submission.addressLine1 ||
        submission.city
    )

  const address = [
    submission.addressLine1,
    submission.addressLine2,
    submission.city,
    submission.state,
    submission.zip,
    submission.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="flex gap-4 p-4">
        {thumb ? (
          <a href={thumb.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb.url}
              alt={`Screenshot of ${submission.firstName}'s project`}
              className="h-20 w-20 rounded-xl bg-gray-100 object-cover transition-opacity hover:opacity-90"
            />
          </a>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-300">
            <ImagePlaceholderIcon size={24} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm font-bold text-hc-dark">
                {submission.firstName} {submission.lastName}
              </span>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {submission.slackUsername && (
                  <span className="text-xs text-gray-400">@{submission.slackUsername}</span>
                )}
                {submission.githubUsername && (
                  <span className="text-xs text-gray-400">github: {submission.githubUsername}</span>
                )}
              </div>
            </div>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          {submission.description && (
            <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-600">
              {submission.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {submission.playableUrl && <LinkChip href={submission.playableUrl} label="Live" />}
            {submission.codeUrl && <LinkChip href={submission.codeUrl} label="Code" />}
            {submission.hackatimeProject && (
              <LinkChip href={submission.hackatimeProject} label="Hackatime" />
            )}
            {hackatimeHours !== null && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                <ClockIcon size={11} strokeWidth={2.5} />
                {hackatimeHours.toFixed(1)} hrs
                {submission.adjustedHours !== undefined && (
                  <span className="font-normal text-gray-400">
                    → {submission.adjustedHours} counted
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasContactInfo && (
        <div className="mx-4 mb-3">
          <button
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-600"
          >
            <ChevronRightIcon
              size={10}
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
            {expanded ? 'Hide' : 'Show'} shipping details
          </button>

          {expanded && (
            <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <ContactRow label="Email" value={submission.email} />
              <ContactRow label="Phone" value={submission.phoneNumber} />
              <ContactRow label="Birthday" value={submission.birthday} />
              <ContactRow label="Address" value={address || undefined} />
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="mt-auto border-t border-gray-100 px-4 pt-3 pb-4">
          {adjusting ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Hours to count"
                value={adjustedHours}
                onChange={e => setAdjustedHours(e.target.value)}
                className="input flex-1 px-3 py-2 text-xs"
                autoFocus
              />
              <button
                onClick={() => {
                  const hrs = parseFloat(adjustedHours)
                  if (!isNaN(hrs)) onReview(submission.id, 'accept', hrs)
                }}
                disabled={reviewing || !adjustedHours}
                className="btn btn-sm bg-hc-green text-white hover:brightness-95"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setAdjusting(false)
                  setAdjustedHours('')
                }}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onReview(submission.id, 'accept')}
                disabled={reviewing}
                className="btn btn-sm flex-1 bg-hc-green text-white hover:brightness-95"
              >
                Approve
              </button>
              <button
                onClick={() => setAdjusting(true)}
                disabled={reviewing}
                className="btn btn-sm btn-secondary flex-1"
                title="Approve, but count fewer hours than Hackatime logged"
              >
                Adjust hours
              </button>
              <button
                onClick={() => onReview(submission.id, 'reject')}
                disabled={reviewing}
                className="btn btn-sm flex-1 bg-hc-red text-white hover:brightness-95"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'Pending', label: 'Needs review' },
  { key: 'Accepted', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'all', label: 'Everything' },
]

const EMPTY_COPY: Record<Filter, string> = {
  Pending: 'Nothing waiting on you. Enjoy it.',
  Accepted: 'No approved submissions yet.',
  Rejected: 'Nothing rejected — nice.',
  all: 'No submissions yet. They show up here the moment someone ships.',
}

type Nudge = { action: 'accept' | 'reject'; slackUsername?: string; firstName: string }

export default function SubmissionsList({
  initialSubmissions,
  isAdmin,
}: {
  initialSubmissions: Submission[]
  isAdmin: boolean
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [filter, setFilter] = useState<Filter>('Pending')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [nudge, setNudge] = useState<Nudge | null>(null)
  const [error, setError] = useState('')

  async function handleReview(id: string, action: 'accept' | 'reject', adjustedHours?: number) {
    setReviewingId(id)
    setError('')
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(adjustedHours !== undefined && { adjustedHours }) }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      const sub = submissions.find(s => s.id === id)
      setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, status: updated.status } : s)))
      setNudge({
        action,
        slackUsername: sub?.slackUsername,
        firstName: sub?.firstName ?? 'them',
      })
    } catch {
      setError('That review didn’t save. Try it again.')
    } finally {
      setReviewingId(null)
    }
  }

  const counts: Record<Filter, number> = {
    all: submissions.length,
    Pending: submissions.filter(s => s.status === 'Pending').length,
    Accepted: submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified')
      .length,
    Rejected: submissions.filter(s => s.status === 'Rejected').length,
  }

  const visible =
    filter === 'all'
      ? submissions
      : filter === 'Accepted'
        ? submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified')
        : submissions.filter(s => s.status === filter)

  return (
    <div>
      <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-hc-dark text-white'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-hc-red">
          {error}
        </p>
      )}

      {nudge && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
            nudge.action === 'accept'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>
            {nudge.action === 'accept' ? 'Approved. ' : 'Rejected. '}
            {nudge.slackUsername ? (
              <>
                Give{' '}
                <a
                  href={`https://hackclub.slack.com/team/${nudge.slackUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  @{nudge.slackUsername}
                </a>{' '}
                a heads-up in Slack.
              </>
            ) : (
              <>Let {nudge.firstName} know.</>
            )}
          </span>
          <button
            onClick={() => setNudge(null)}
            aria-label="Dismiss"
            className="shrink-0 cursor-pointer opacity-50 transition-opacity hover:opacity-100"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-500">{EMPTY_COPY[filter]}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map(sub => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              isAdmin={isAdmin}
              onReview={handleReview}
              reviewing={reviewingId === sub.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
