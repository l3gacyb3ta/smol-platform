import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { ProgramStatusBadge } from '@/components/StatusBadge'
import {
  BankIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FormIcon,
  GitHubIcon,
  GlobeIcon,
  PencilIcon,
  SlackIcon,
} from '@/components/Icons'
import { getProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/permissions'
import { formatDate } from '@/lib/format'
import { programHost, programUrl } from '@/lib/constants'
import type { Program } from '@/lib/types'
import DeleteButton from './DeleteButton'
import AcceptButton from './AcceptButton'
import ArchiveChannelButton from './ArchiveChannelButton'
import ResourceLinkForm from './ResourceLinkForm'

// Resources an admin provisions by hand and records the URL for. Entering the
// URL is what marks the matching DNS/HCB spin-up step done.
const MANUAL_RESOURCE_KEYS = new Set<keyof Program['resources']>(['domain', 'hcb'])
const RESOURCE_PLACEHOLDER: Partial<Record<keyof Program['resources'], string>> = {
  domain: 'https://…',
  hcb: 'hcb.hackclub.com/…',
}

type Resource = {
  key: keyof Program['resources']
  label: string
  icon: React.ReactNode
  getValue: (p: Program) => string
}

const RESOURCES: Resource[] = [
  { key: 'slack', label: 'Slack', icon: <SlackIcon />, getValue: p => `#${p.slackChannel}` },
  { key: 'github', label: 'GitHub', icon: <GitHubIcon />, getValue: p => `${p.subdomain} repo` },
  { key: 'domain', label: 'Domain', icon: <GlobeIcon />, getValue: p => programHost(p.subdomain) },
  { key: 'hcb', label: 'HCB', icon: <BankIcon />, getValue: p => `${p.name} org` },
  { key: 'airtable', label: 'Airtable', icon: <DatabaseIcon />, getValue: () => 'Program records' },
  { key: 'fillout', label: 'Fillout', icon: <FormIcon />, getValue: () => 'Submission form' },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const program = await getProgram(id)
  return { title: program?.name ?? 'Program' }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 font-semibold text-gray-500">{label}</span>
      <span className="text-right font-semibold text-hc-dark">{children}</span>
    </div>
  )
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, session] = await Promise.all([getProgram(id), auth()])
  if (!session) redirect('/')
  if (!program) notFound()

  const userIsAdmin = isAdmin(session.user?.slackId)
  const canAccept = userIsAdmin && program.status === 'pending'
  const spinUpUrl = `/programs/${id}/creating`

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Navbar variant="admin" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------------ Header */}
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-500 transition-colors hover:text-hc-red"
        >
          ← All programs
        </Link>

        <header className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: program.keyColor }} />
            <h1 className="font-casual text-3xl font-bold text-hc-dark">{program.name}</h1>
            <ProgramStatusBadge status={program.status} />
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-500">{program.description}</p>

          {canAccept && (
            <div className="notice notice-amber">
              <span>This program is waiting on review. Accepting it kicks off spin-up.</span>
              <AcceptButton programId={program.id} />
            </div>
          )}

          {(program.status === 'accepted' || program.status === 'active') && (
            <div className="notice notice-blue">
              <span>
                {program.status === 'accepted'
                  ? 'Spin-up is still in progress.'
                  : 'Spin-up finished — everything is provisioned.'}
              </span>
              <Link href={spinUpUrl} className="font-bold underline hover:no-underline">
                View spin-up log →
              </Link>
            </div>
          )}
        </header>

        {/* ----------------------------------------------------------- Content */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Details */}
          <section className="card flex flex-col gap-4 p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-extrabold text-hc-dark">Program details</h2>
              <div className="flex items-center gap-2">
                <Link href={`/programs/${program.id}/submissions`} className="btn btn-primary btn-sm">
                  <FormIcon size={13} />
                  Submissions
                </Link>
                <Link href={`/programs/${program.id}/edit`} className="btn btn-secondary btn-sm">
                  <PencilIcon size={13} />
                  Edit
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <DetailRow label="Slack channel">
                {program.resources.slack ? (
                  <a
                    href={program.resources.slack}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-hc-red"
                  >
                    #{program.slackChannel}
                    <ExternalLinkIcon size={14} className="text-gray-400" />
                  </a>
                ) : (
                  <>#{program.slackChannel}</>
                )}
              </DetailRow>

              <DetailRow label="Website">
                <a
                  href={programUrl(program.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 break-all hover:text-hc-red"
                >
                  {programHost(program.subdomain)}
                  <ExternalLinkIcon size={14} className="shrink-0 text-gray-400" />
                </a>
              </DetailRow>

              <DetailRow label="Runs">
                {formatDate(program.startDate)} → {formatDate(program.endDate)}
              </DetailRow>

              <DetailRow label="Key color">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: program.keyColor }}
                  />
                  {program.keyColor.toUpperCase()}
                </span>
              </DetailRow>

              {program.creatorName && (
                <DetailRow label="Pitched by">
                  {program.creatorName}
                  {program.creatorEmail && (
                    <span className="block text-xs font-medium text-gray-400">
                      {program.creatorEmail}
                    </span>
                  )}
                </DetailRow>
              )}
            </div>
          </section>

          {/* Resources */}
          <section className="card flex flex-col gap-4 p-6 lg:col-span-2">
            <div>
              <h2 className="font-display text-lg font-extrabold text-hc-dark">Resources</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Everything provisioned for this program.
              </p>
            </div>

            <div className="flex flex-col divide-y divide-gray-100">
              {RESOURCES.map(({ key, label, icon, getValue }) => {
                const url = program.resources[key]
                return (
                  <div key={key} className="flex items-center gap-3 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-hc-dark">{label}</p>
                      <p className="truncate text-xs text-gray-500">{getValue(program)}</p>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-gray-400 transition-colors hover:text-hc-red"
                        aria-label={`Open ${label}`}
                      >
                        <ExternalLinkIcon size={15} />
                      </a>
                    ) : userIsAdmin && MANUAL_RESOURCE_KEYS.has(key) ? (
                      <ResourceLinkForm
                        programId={program.id}
                        resourceKey={key}
                        placeholder={RESOURCE_PLACEHOLDER[key] ?? 'https://…'}
                      />
                    ) : (
                      <span className="badge badge-gray shrink-0">pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------- Danger zone */}
        <section className="mt-8 rounded-2xl border border-rose-200 bg-white p-6">
          <h2 className="font-display text-base font-extrabold text-hc-dark">Danger zone</h2>

          {userIsAdmin && program.resources.slack && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-hc-dark">Archive the Slack channel</p>
                <p className="text-xs text-gray-500">
                  Hides #{program.slackChannel} from the workspace. History is kept.
                </p>
              </div>
              <ArchiveChannelButton programId={program.id} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-hc-dark">Delete this program</p>
              <p className="text-xs text-gray-500">
                Removes the program and everything recorded against it. Not reversible.
              </p>
            </div>
            <DeleteButton programId={program.id} programName={program.name} />
          </div>
        </section>
      </main>
    </div>
  )
}
