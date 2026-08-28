'use client'

import { useState } from 'react'
import Ledger from '@/components/Ledger'
import { SubmissionState } from '@/components/StateMark'
import type { Submission } from '@/lib/airtable-submissions'

type Filter = 'all' | 'Pending' | 'Sent to Ari' | 'Accepted' | 'Rejected'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'Pending', label: 'Ready to send' },
  { key: 'Sent to Ari', label: 'With Ari' },
  { key: 'Accepted', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'all', label: 'Everything' },
]

function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function Evidence({ href, label }: { href?: string; label: string }) {
  const safeHref = safeHttpUrl(href)
  return safeHref
    ? <a href={safeHref} target="_blank" rel="noopener noreferrer">{label} ↗</a>
    : <span className="evidence-missing">no {label}</span>
}

function Details({ submission }: { submission: Submission }) {
  const address = [submission.addressLine1, submission.addressLine2, submission.city, submission.state, submission.zip, submission.country].filter(Boolean).join(', ')
  const rows: Array<[string, string | undefined]> = [
    ['Email', submission.email], ['Phone', submission.phoneNumber], ['Birthday', submission.birthday], ['Address', address || undefined], ['Ari note', submission.ariReviewNote],
  ]
  if (!rows.some(([, value]) => value)) return null
  return <details className="shipping-details"><summary>details</summary><table><tbody>{rows.map(([label, value]) => value ? <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr> : null)}</tbody></table></details>
}

function AriState({ submission }: { submission: Submission }) {
  if (!submission.ariShipId) return <SubmissionState status={submission.status} adjustedHours={submission.adjustedHours} />
  const phase = submission.ariPhase?.replace(/_/g, ' ') ?? 'submitted'
  const tone = submission.ariDecision === 'approved' ? 'clear' : submission.ariDecision === 'rejected' ? 'void' : submission.ariDecision === 'changes' ? 'attention' : 'hold'
  return <span className={`state state-${tone}`}>Ari · {submission.ariDecision ?? phase}{submission.ariReviewMinutes !== undefined && ` · ${(submission.ariReviewMinutes / 60).toFixed(1)}h`}</span>
}

function SubmissionRow({ submission, isAdmin, sending, onSend }: { submission: Submission; isAdmin: boolean; sending: boolean; onSend: (id: string) => void }) {
  const thumbnailUrl = safeHttpUrl(submission.screenshot?.[0]?.url)
  const canSend = submission.status === 'Pending' && !submission.ariShipId
  return <tr className={submission.status === 'Rejected' ? 'row-void' : undefined}>
    <td>{thumbnailUrl ? <a href={thumbnailUrl} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnailUrl} alt={`Screenshot of ${submission.firstName}'s project`} className="shot" />
    </a> : <span className="shot-missing" role="img" aria-label="No screenshot submitted" />}</td>
    <td><span className="shipper">{submission.firstName} {submission.lastName}</span><span className="shipper-handles">{submission.slackUsername ? `@${submission.slackUsername}` : 'no slack handle'}{submission.githubUsername && ` · gh:${submission.githubUsername}`}</span>{isAdmin && <Details submission={submission} />}</td>
    <td>{submission.projectTitle && <strong>{submission.projectTitle}</strong>}{submission.projectTitle && submission.description && <br />}{submission.description || <span className="tally">no description</span>}</td>
    <td className="evidence"><Evidence href={submission.playableUrl} label="live" /><Evidence href={submission.codeUrl} label="code" /><Evidence href={submission.hackatimeProject} label="hackatime" /></td>
    <td><AriState submission={submission} /></td>
    <td><span className="review-actions">{canSend ? <button onClick={() => onSend(submission.id)} disabled={sending} className="action action-strong">{sending ? 'Sending…' : 'Send to Ari'}</button> : <span className="tally">{submission.ariShipId ? 'Ari decides' : '—'}</span>}</span></td>
  </tr>
}

export default function SubmissionsList({ initialSubmissions, isAdmin }: { initialSubmissions: Submission[]; isAdmin: boolean }) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [filter, setFilter] = useState<Filter>('Pending')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function sendToAri(id: string) {
    setSendingId(id)
    setError('')
    try {
      const res = await fetch(`/api/submissions/${id}/ari`, { method: 'POST' })
      const body = await res.json() as { error?: string; status?: Submission['status']; ariShipId?: string; ariPhase?: string }
      if (!res.ok) throw new Error(body.error ?? 'That submission could not be sent to Ari.')
      setSubmissions(previous => previous.map(sub => sub.id === id ? { ...sub, status: body.status ?? 'Sent to Ari', ariShipId: body.ariShipId ?? sub.ariShipId, ariPhase: body.ariPhase ?? sub.ariPhase ?? 'submitted' } : sub))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That submission could not be sent to Ari.')
    } finally {
      setSendingId(null)
    }
  }

  const counts: Record<Filter, number> = {
    all: submissions.length,
    Pending: submissions.filter(s => s.status === 'Pending' && !s.ariShipId).length,
    'Sent to Ari': submissions.filter(s => s.status === 'Sent to Ari' || (!!s.ariShipId && !s.ariDecision)).length,
    Accepted: submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified').length,
    Rejected: submissions.filter(s => s.status === 'Rejected').length,
  }
  const visible = filter === 'all' ? submissions : filter === 'Sent to Ari'
    ? submissions.filter(s => s.status === 'Sent to Ari' || (!!s.ariShipId && !s.ariDecision))
    : filter === 'Accepted' ? submissions.filter(s => s.status === 'Accepted' || s.status === 'Sent to Unified')
    : submissions.filter(s => s.status === filter && (filter !== 'Pending' || !s.ariShipId))

  return <>
    <ul className="queue-tabs">{FILTERS.map(({ key, label }) => <li key={key}><button onClick={() => setFilter(key)} aria-pressed={filter === key}>{label} ({counts[key]})</button></li>)}</ul>
    {error && <p role="alert" className="error-note">{error}</p>}
    {visible.length === 0 ? <p className="empty">Nothing here right now.</p> : <Ledger label={`${visible.length} submissions`} width="wide">
      <colgroup><col style={{ width: '76px' }} /><col style={{ width: '19%' }} /><col style={{ width: '29%' }} /><col style={{ width: '14%' }} /><col style={{ width: '14%' }} /><col style={{ width: '14%' }} /></colgroup>
      <thead><tr><th scope="col">Shot</th><th scope="col">Shipper</th><th scope="col">What they made</th><th scope="col">Evidence</th><th scope="col">Review</th><th scope="col"><span className="tally">Ari</span></th></tr></thead>
      <tbody>{visible.map(submission => <SubmissionRow key={submission.id} submission={submission} isAdmin={isAdmin} sending={sendingId === submission.id} onSend={sendToAri} />)}</tbody>
    </Ledger>}
    <p className="edition">Ari is the review authority. Decisions return here through its signed webhook.</p>
  </>
}
