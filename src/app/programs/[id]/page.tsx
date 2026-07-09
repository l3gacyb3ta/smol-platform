import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/permissions'
import type { Program } from '@/lib/types'
import DeleteButton from './DeleteButton'
import AcceptButton from './AcceptButton'
import ArchiveChannelButton from './ArchiveChannelButton'

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function StatusBadge({ status }: { status: Program['status'] }) {
  if (status === 'active') return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>Active</span>
  )
  if (status === 'accepted') return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>Accepted</span>
  )
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Pending</span>
  )
}

type Resource = {
  key: keyof Program['resources']
  label: string
  icon: React.ReactNode
  getValue: (p: Program) => string
}

const RESOURCES: Resource[] = [
  {
    key: 'slack',
    label: 'Slack',
    getValue: p => `#${p.slackChannel}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
        <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
      </svg>
    ),
  },
  {
    key: 'github',
    label: 'GitHub',
    getValue: p => `${p.subdomain} repo`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
      </svg>
    ),
  },
  {
    key: 'domain',
    label: 'Domain',
    getValue: p => `${p.subdomain}.hackclub.com`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    key: 'hcb',
    label: 'HCB',
    getValue: p => `${p.name} org`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: 'airtable',
    label: 'Airtable',
    getValue: () => 'Program records',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
  {
    key: 'fillout',
    label: 'Fillout',
    getValue: () => 'Submission form',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, session] = await Promise.all([getProgram(id), auth()])
  if (!program) notFound()

  const userIsAdmin = isAdmin(session?.user?.slackId)
  const canAccept = userIsAdmin && program.status === 'pending'
  const spinUpUrl = `/programs/${id}/creating`

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar variant="admin" />

      <main className="flex-1 pb-12">
        {/* Header */}
        <div className="flex flex-col items-center pt-6 pb-5 px-12">
          <Link href="/dashboard" className="text-gray-500 text-sm font-semibold hover:text-gray-700 mb-3">
            ← All Programs
          </Link>
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="h-1 rounded-full w-24" style={{ backgroundColor: program.keyColor }} />
            <h1
              className="text-hc-dark text-3xl font-bold text-center"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              {program.name}
            </h1>
          </div>
          {/* Admin accept banner */}
          {canAccept && (
            <div className="mt-4 flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800">
              <span>Waiting for review. Accept to begin spin-up.</span>
              <AcceptButton programId={program.id} />
            </div>
          )}
          {/* Spin-up link shown once accepted or active */}
          {(program.status === 'accepted' || program.status === 'active') && (
            <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-800">
              <span>{program.status === 'accepted' ? 'Spin-up in progress.' : 'Spin-up complete.'}</span>
              <Link href={spinUpUrl} className="font-semibold underline hover:text-blue-600">
                View spin-up log →
              </Link>
            </div>
          )}
        </div>

        {/* Two-column content */}
        <div className="flex gap-6 px-12">
          {/* Program Details card */}
          <div
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative"
            style={{ flex: '0 0 55%', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-hc-dark text-lg font-extrabold"
                style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
              >
                Program Details
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href={`/programs/${program.id}/submissions`}
                  className="flex items-center gap-1.5 text-xs font-bold text-white rounded-lg px-3 py-2 transition-colors"
                  style={{ backgroundColor: '#ec3750' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Submissions
                </Link>
                <Link
                  href={`/programs/${program.id}/edit`}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Program
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Program Name', value: program.name },
                {
                  label: 'Slack Channel',
                  value: (
                    <a href={program.resources.slack} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-hc-dark font-semibold text-sm hover:text-hc-red">
                      <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
                      </span>
                      #{program.slackChannel}
                      <ExternalLinkIcon />
                    </a>
                  ),
                },
                {
                  label: 'Subdomain',
                  value: (
                    <a href={`https://${program.subdomain}.hackclub.com`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-hc-dark font-semibold text-sm hover:text-hc-red">
                      {program.subdomain}.hackclub.com
                      <ExternalLinkIcon />
                    </a>
                  ),
                },
                { label: 'Start Date', value: formatDate(program.startDate) },
                { label: 'End Date', value: formatDate(program.endDate) },
                {
                  label: 'Key Color',
                  value: (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: program.keyColor }} />
                      <span className="text-sm font-semibold text-hc-dark">{program.keyColor.toUpperCase()}</span>
                    </span>
                  ),
                },
                { label: 'Description', value: program.description },
                ...(program.creatorName ? [{ label: 'Submitted by', value: `${program.creatorName}${program.creatorEmail ? ` (${program.creatorEmail})` : ''}` }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between text-sm gap-4">
                  <span className="text-gray-500 font-semibold shrink-0">{label}</span>
                  {typeof value === 'string' ? (
                    <span className="text-hc-dark font-semibold text-right">{value}</span>
                  ) : value}
                </div>
              ))}
            </div>
          </div>

          {/* Resources card */}
          <div
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 flex-1"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-hc-dark text-lg font-extrabold"
                  style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
                >
                  Created Resources
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">All services provisioned for this program</p>
              </div>
              <StatusBadge status={program.status} />
            </div>

            <div className="flex flex-col divide-y divide-gray-100">
              {RESOURCES.map(({ key, label, icon, getValue }) => {
                const url = program.resources[key]
                return (
                  <div key={key} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-hc-dark">{label}</p>
                      <p className="text-xs text-gray-500 truncate">{getValue(program)}</p>
                    </div>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <ExternalLinkIcon />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300 shrink-0">pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="flex justify-center mt-8 px-12">
          <div
            className="bg-white border rounded-2xl px-12 py-5 flex flex-col gap-3 w-full max-w-lg"
            style={{ borderColor: '#fecdd3' }}
          >
            <h3
              className="text-hc-dark text-base font-extrabold"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              Danger Zone
            </h3>
            {userIsAdmin && program.resources.slack && (
              <div className="flex items-center justify-between py-2 border-b border-red-100">
                <div>
                  <p className="text-sm font-semibold text-hc-dark">Archive Slack Channel</p>
                  <p className="text-xs text-gray-500">Hides #{program.slackChannel} from the workspace.</p>
                </div>
                <ArchiveChannelButton programId={program.id} />
              </div>
            )}
            <p className="text-gray-500 text-sm">This will permanently delete the program and all associated data.</p>
            <DeleteButton programId={program.id} programName={program.name} />
          </div>
        </div>
      </main>
    </div>
  )
}
