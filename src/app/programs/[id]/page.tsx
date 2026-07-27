import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Ledger from '@/components/Ledger'
import { ProgramState } from '@/components/StateMark'
import { loadProgramForViewer } from '@/lib/program-access'
import { isAdmin } from '@/lib/permissions'
import { formatDate, formatDateRange } from '@/lib/format'
import { programHost, programRepoSlug, programUrl } from '@/lib/constants'
import { countdown, daysSince, ageInDays } from '@/lib/runwindow'
import {
  PROVISIONING,
  OWNER_LABEL,
  RECORDABLE,
  SIMULATED_COUNT,
  recordedCount,
} from '@/lib/provisioning'
import type { Program } from '@/lib/types'
import DeleteButton from './DeleteButton'
import AcceptButton from './AcceptButton'
import ArchiveChannelButton from './ArchiveChannelButton'
import ResourceLinkForm from './ResourceLinkForm'

/* ---------------------------------------------------------------------------
   One program. Mode: instrument.

   The question that brought someone here is almost always "what still isn't
   provisioned, and is it waiting on a machine or on a person" — so the
   provisioning table has an owner column, which is the fact the old resource
   list left out. A row that says "by hand" is not a row that will fix itself.
   --------------------------------------------------------------------------- */

// What each resource *is*, for the "What" column. Which of them exist, who owns
// them and what they're called all live in lib/provisioning.ts, so this page and
// the spin-up log can't drift apart about it again.
const DESCRIBE: Record<keyof Program['resources'], (p: Program) => string> = {
  slack: p => `#${p.slackChannel}`,
  // programRepoSlug, not a hand-built string: spin-up names the repo
  // `smol-<subdomain>`, so this cell used to print an org path that didn't exist.
  github: p => programRepoSlug(p.subdomain),
  domain: p => programHost(p.subdomain),
  hcb: p => `${p.name} org`,
  airtable: () => 'program records',
  fillout: () => 'submission form',
}

const RESOURCE_PLACEHOLDER: Partial<Record<keyof Program['resources'], string>> = {
  domain: 'https://…',
  hcb: 'hcb.hackclub.com/…',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { program, allowed } = await loadProgramForViewer(id)
  // Never put the name in the title for someone who may not see the page.
  return { title: allowed && program ? program.name : 'Program' }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{children}</td>
    </tr>
  )
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { program, session, allowed } = await loadProgramForViewer(id)
  if (!session) redirect('/')
  // 404 rather than 403 for programs that exist but aren't yours — the page
  // carries the creator's email and the HCB/Airtable resource URLs, and a
  // distinct response would confirm which record IDs are real.
  if (!program || !allowed) notFound()

  const userIsAdmin = isAdmin(session.user?.slackId)
  const canAccept = userIsAdmin && program.status === 'pending'
  const when = countdown(program.startDate, program.endDate)
  const provisioned = recordedCount(program)

  return (
    <>
      <SiteHeader />

      <main className="sheet instrument">
        <Link href="/dashboard" className="crumb">
          ← All programs
        </Link>

        <div className="section-head">
          <h1>
            <span
              className="key-chip"
              style={{ backgroundColor: program.keyColor }}
              aria-hidden="true"
            />
            {program.name}
          </h1>
          <ProgramState status={program.status} waitingDays={daysSince(program.createdAt)} />
        </div>

        <p>{program.description}</p>

        <div className="action-row">
          <Link href={`/programs/${program.id}/submissions`} className="action action-strong">
            Submissions
          </Link>
          <Link href={`/programs/${program.id}/edit`} className="action">
            Edit
          </Link>
          <Link href={`/programs/${program.id}/creating`} className="action">
            Spin-up log
          </Link>
        </div>

        {canAccept && (
          <div className="notice notice-attention">
            <span>
              This program has been waiting on review for {ageInDays(daysSince(program.createdAt))}.
              Accepting it starts spin-up immediately.
            </span>
            <AcceptButton programId={program.id} />
          </div>
        )}

        {/* The other half of the same fact. A pending program used to show a
            reviewer the accept button and everyone else nothing at all — so if
            you weren't an admin, the page went quiet about the one thing holding
            your program up. Same wait, said to the person who is waiting. */}
        {program.status === 'pending' && !userIsAdmin && (
          <div className="notice">
            <span>
              Waiting on a Hack Club admin to accept it — {ageInDays(daysSince(program.createdAt))}
              {' '}so far. Nothing gets created until they do, and you can keep editing it meanwhile.
            </span>
          </div>
        )}

        {program.status === 'accepted' && (
          <div className="notice">
            <span>
              Spin-up is still in progress — {provisioned} of {RECORDABLE.length} resources
              recorded.
            </span>
            <Link href={`/programs/${program.id}/creating`}>Watch the log →</Link>
          </div>
        )}

        {/* ------------------------------------------------------------- Record */}
        <section className="section">
          <div className="section-head">
            <h2>The record</h2>
            <span className="tally">as pitched, and as edited since</span>
          </div>

          <Ledger label={`${program.name} — the record`} width="narrow">
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '76%' }} />
            </colgroup>
            <tbody>
              <Row label="Runs">
                <span className="ledger-numeric">
                  {formatDateRange(program.startDate, program.endDate) || 'open-ended'}
                </span>{' '}
                <span className={`countdown${when.imminent ? ' countdown-soon' : ''}`}>
                  {when.label}
                </span>
              </Row>

              <Row label="Website">
                <a href={programUrl(program.subdomain)} target="_blank" rel="noopener noreferrer">
                  {programHost(program.subdomain)}
                </a>
              </Row>

              <Row label="Slack">
                {program.resources.slack ? (
                  <a href={program.resources.slack} target="_blank" rel="noopener noreferrer">
                    #{program.slackChannel}
                  </a>
                ) : (
                  <code>#{program.slackChannel}</code>
                )}
              </Row>

              <Row label="Key colour">
                <span
                  className="key-swatch"
                  style={{ backgroundColor: program.keyColor }}
                  aria-hidden="true"
                />
                <code>{program.keyColor.toUpperCase()}</code>
              </Row>

              {program.template && (
                <Row label="Template">
                  <code>{program.template}</code>
                </Row>
              )}

              <Row label="Pitched">
                {formatDate(program.createdAt)}{' '}
                <span className="tally">({ageInDays(daysSince(program.createdAt))} ago)</span>
              </Row>

              {program.creatorName && (
                <Row label="Pitched by">
                  {program.creatorName}
                  {program.creatorEmail && (
                    <>
                      {' '}
                      <code>{program.creatorEmail}</code>
                    </>
                  )}
                  {program.creatorGithubUsername && (
                    <>
                      {' '}
                      <span className="tally">github: {program.creatorGithubUsername}</span>
                    </>
                  )}
                </Row>
              )}
            </tbody>
          </Ledger>
        </section>

        {/* ------------------------------------------------------- Provisioning */}
        <section className="section">
          <div className="section-head">
            <h2>Provisioning</h2>
            <span className="tally">
              {provisioned} of {RECORDABLE.length} recorded · {SIMULATED_COUNT} simulated
            </span>
          </div>

          <Ledger label={`${program.name} — provisioning`}>
            {/* "What" holds repo paths and hostnames, so it gets the room. */}
            <colgroup>
              <col style={{ width: '17%' }} />
              <col style={{ width: '31%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Resource</th>
                <th scope="col">What</th>
                <th scope="col">Owner</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {PROVISIONING.map(({ resource, label, owner }) => {
                const url = program.resources[resource]
                // Nothing creates these, so no URL is ever written and the row
                // can never be "recorded". Hatched, because it is inert: not a
                // thing anyone can act on for this program.
                const unbuilt = owner === 'unbuilt'

                return (
                  <tr key={resource} className={unbuilt ? 'row-void' : undefined}>
                    <th scope="row">{label}</th>
                    <td>
                      <code>{DESCRIBE[resource](program)}</code>
                    </td>
                    {/* The fact the old resource list left out: whether an
                        unfinished row is waiting on a machine, on a person, or on
                        nobody at all. */}
                    <td className="tally">{OWNER_LABEL[owner]}</td>
                    <td>
                      {unbuilt ? (
                        <span className="state state-void">simulated</span>
                      ) : url ? (
                        <>
                          <span className="state state-clear">recorded</span>{' '}
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            open ↗
                          </a>
                        </>
                      ) : userIsAdmin && owner === 'human' ? (
                        <ResourceLinkForm
                          programId={program.id}
                          resourceKey={resource}
                          placeholder={RESOURCE_PLACEHOLDER[resource] ?? 'https://…'}
                        />
                      ) : (
                        <span
                          className={`state ${owner === 'human' ? 'state-hold' : 'state-attention'}`}
                        >
                          {owner === 'human' ? 'waiting on an admin' : 'not yet recorded'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Ledger>
        </section>

        {/* --------------------------------------------------------- Ending it */}
        <section className="section">
          <div className="section-head">
            <h2>Ending this program</h2>
            <span className="tally">both of these are hard to undo</span>
          </div>

          {userIsAdmin && program.resources.slack && (
            <div className="notice notice-attention">
              <span>
                <strong>Archive #{program.slackChannel}.</strong> Hides the channel from the
                workspace. History is kept and it can be un-archived by hand.
              </span>
              <ArchiveChannelButton programId={program.id} />
            </div>
          )}

          <div className="notice notice-attention">
            <span>
              <strong>Delete {program.name}.</strong> Removes the program and everything recorded
              against it. Nothing outside smol is touched — the Slack channel, repo and HCB org all
              survive. Not reversible.
            </span>
            <DeleteButton programId={program.id} programName={program.name} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
