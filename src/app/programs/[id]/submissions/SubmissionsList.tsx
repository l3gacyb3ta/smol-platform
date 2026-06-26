'use client'

import { useState, useEffect } from 'react'
import type { Submission, SubmissionStatus } from '@/lib/airtable-submissions'

type Filter = 'all' | 'Pending' | 'Accepted' | 'Rejected'

function StatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === 'Accepted' || status === 'Sent to Unified') return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
      {status === 'Sent to Unified' ? 'Accepted · Sent' : 'Accepted'}
    </span>
  )
  if (status === 'Rejected') return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Rejected</span>
  )
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Pending</span>
  )
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  )
}

function PIIRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 shrink-0 w-24">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  )
}

function hackatimeApiUrl(projectUrl: string): string | null {
  try {
    const { pathname } = new URL(projectUrl)
    // format: /@username/project/project-name
    const m = pathname.match(/\/@([^/]+)\/project\/([^/]+)/)
    if (!m) return null
    return `https://hackatime.hackclub.com/api/v1/users/${m[1]}/project/${m[2]}`
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
      .then(d => { if (typeof d.total_seconds === 'number') setHours(d.total_seconds / 3600) })
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
  const [deflating, setDeflating] = useState(false)
  const [deflateHours, setDeflateHours] = useState('')
  const thumb = submission.screenshot?.[0]
  const isPending = submission.status === 'Pending'
  const hackatimeHours = useHackatimeHours(submission.hackatimeProject)

  const hasPII = isAdmin && (
    submission.email || submission.phoneNumber || submission.birthday ||
    submission.addressLine1 || submission.city
  )

  const address = [
    submission.addressLine1,
    submission.addressLine2,
    submission.city,
    submission.state,
    submission.zip,
    submission.country,
  ].filter(Boolean).join(', ')

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="flex gap-4 p-4">
        {/* Screenshot thumbnail */}
        {thumb ? (
          <a href={thumb.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb.url}
              alt={thumb.filename}
              className="w-20 h-20 object-cover rounded-xl bg-gray-100"
            />
          </a>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-gray-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-bold text-hc-dark">
                {submission.firstName} {submission.lastName}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {submission.slackUsername && (
                  <span className="text-xs text-gray-400">@{submission.slackUsername}</span>
                )}
                {submission.githubUsername && (
                  <span className="text-xs text-gray-400">github: {submission.githubUsername}</span>
                )}
              </div>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          {submission.description && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">
              {submission.description}
            </p>
          )}

          {/* Links + hours */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {submission.playableUrl && <LinkChip href={submission.playableUrl} label="Live" />}
            {submission.codeUrl && <LinkChip href={submission.codeUrl} label="Code" />}
            {submission.hackatimeProject && <LinkChip href={submission.hackatimeProject} label="Hackatime" />}
            {hackatimeHours !== null && (
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {hackatimeHours.toFixed(1)} hrs
                {submission.adjustedHours !== undefined && (
                  <span className="text-gray-400 font-normal">→ {submission.adjustedHours} adj</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin PII section */}
      {hasPII && (
        <div className="mx-4 mb-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 font-semibold flex items-center gap-1"
          >
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {expanded ? 'Hide' : 'Show'} contact info
          </button>

          {expanded && (
            <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col gap-1.5">
              <PIIRow label="Email" value={submission.email} />
              <PIIRow label="Phone" value={submission.phoneNumber} />
              <PIIRow label="Birthday" value={submission.birthday} />
              {address && <PIIRow label="Address" value={address} />}
            </div>
          )}
        </div>
      )}

      {/* Review actions */}
      {isPending && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-50 mt-1">
          {deflating ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Adjusted hrs"
                value={deflateHours}
                onChange={e => setDeflateHours(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-hc-red"
                autoFocus
              />
              <button
                onClick={() => {
                  const hrs = parseFloat(deflateHours)
                  if (!isNaN(hrs)) onReview(submission.id, 'accept', hrs)
                }}
                disabled={reviewing || !deflateHours}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: '#20c997' }}
              >
                Confirm
              </button>
              <button
                onClick={() => { setDeflating(false); setDeflateHours('') }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onReview(submission.id, 'accept')}
                disabled={reviewing}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#20c997' }}
              >
                Approve
              </button>
              <button
                onClick={() => setDeflating(true)}
                disabled={reviewing}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#339af0' }}
              >
                Approve + Deflate
              </button>
              <button
                onClick={() => onReview(submission.id, 'reject')}
                disabled={reviewing}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#ec3750' }}
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

const FILTER_LABELS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Accepted', label: 'Accepted' },
  { key: 'Rejected', label: 'Rejected' },
]

type Nudge = { id: string; action: 'accept' | 'reject'; slackUsername?: string; firstName: string }

export default function SubmissionsList({
  programId,
  initialSubmissions,
  isAdmin,
}: {
  programId: string
  initialSubmissions: Submission[]
  isAdmin: boolean
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [filter, setFilter] = useState<Filter>('Pending')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [nudge, setNudge] = useState<Nudge | null>(null)

  async function handleReview(id: string, action: 'accept' | 'reject', adjustedHours?: number) {
    setReviewingId(id)
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(adjustedHours !== undefined && { adjustedHours }) }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: updated.status } : s))
      const sub = submissions.find(s => s.id === id)
      setNudge({ id, action, slackUsername: sub?.slackUsername, firstName: sub?.firstName ?? '' })
    } finally {
      setReviewingId(null)
    }
  }

  const counts = {
    all: submissions.length,
    Pending: submissions.filter(s => s.status === 'Pending').length,
    Accepted: submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified').length,
    Rejected: submissions.filter(s => s.status === 'Rejected').length,
  }

  const visible = filter === 'all'
    ? submissions
    : filter === 'Accepted'
      ? submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified')
      : submissions.filter(s => s.status === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 w-fit" style={{ border: '1px solid #e5e7eb' }}>
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filter === key ? 'bg-hc-dark text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Nudge banner */}
      {nudge && (
        <div
          className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: nudge.action === 'accept' ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${nudge.action === 'accept' ? '#bbf7d0' : '#fecdd3'}`,
            color: nudge.action === 'accept' ? '#166534' : '#9f1239',
          }}
        >
          <span>
            {nudge.action === 'accept' ? '✅' : '❌'}{' '}
            {nudge.slackUsername
              ? <>Let <a href={`https://hackclub.slack.com/team/${nudge.slackUsername}`} target="_blank" rel="noopener noreferrer" className="underline">@{nudge.slackUsername}</a> know their submission was {nudge.action === 'accept' ? 'approved' : 'rejected'}.</>
              : <>Let {nudge.firstName} know their submission was {nudge.action === 'accept' ? 'approved' : 'rejected'}.</>
            }
          </span>
          <button onClick={() => setNudge(null)} className="opacity-50 hover:opacity-100 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No {filter === 'all' ? '' : filter.toLowerCase()} submissions yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Hidden programId reference to suppress unused warning */}
      <input type="hidden" value={programId} />
    </div>
  )
}
