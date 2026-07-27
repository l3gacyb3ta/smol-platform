import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { getSubmissions, stripPII } from '@/lib/airtable-submissions'
import { isAdmin, canAccessSubmissions } from '@/lib/permissions'
import { loadProgramForViewer } from '@/lib/program-access'
import { countdown } from '@/lib/runwindow'
import SubmissionsList from './SubmissionsList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { program, allowed } = await loadProgramForViewer(id)
  return { title: allowed && program ? `${program.name} submissions` : 'Submissions' }
}

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { program, session, allowed } = await loadProgramForViewer(id)
  if (!program || !allowed) notFound()

  const slackId = session?.user?.slackId

  // A program only owns its Slack channel once an admin has accepted it, and
  // that channel is the only thing tying submissions to a program. Until then
  // there is nothing to show and nothing we can safely attribute.
  const reviewable = canAccessSubmissions(slackId, program)

  const admin = isAdmin(slackId)
  const allSubmissions = reviewable ? await getSubmissions(program.slackChannel) : []
  const submissions = admin ? allSubmissions : allSubmissions.map(stripPII)

  const pendingCount = submissions.filter(s => s.status === 'Pending').length
  const when = countdown(program.startDate, program.endDate)

  return (
    <>
      <SiteHeader />

      <main className="sheet instrument">
        <Link href={`/programs/${id}`} className="crumb">
          ← {program.name}
        </Link>

        <div className="section-head">
          <h1>
            <span
              className="key-chip"
              style={{ backgroundColor: program.keyColor }}
              aria-hidden="true"
            />
            Submissions
          </h1>
          {reviewable && (
            <span className="tally">
              {submissions.length} in total
              {pendingCount > 0 && ` · ${pendingCount} waiting on you`} · the run {when.label}
            </span>
          )}
        </div>

        {reviewable ? (
          <SubmissionsList initialSubmissions={submissions} isAdmin={admin} />
        ) : (
          <div className="empty">
            <h2>Submissions open once this program is accepted</h2>
            <p>
              A Hack Club admin still needs to review the pitch. Once they accept it and spin-up
              finishes, everything people ship lands here.
            </p>
          </div>
        )}

        {!admin && reviewable && (
          <p className="edition">
            Contact and shipping details are stripped for non-admin reviewers.
          </p>
        )}
      </main>

      <SiteFooter />
    </>
  )
}
