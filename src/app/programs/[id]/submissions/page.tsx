import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { getProgram } from '@/lib/airtable'
import { getSubmissions, stripPII } from '@/lib/airtable-submissions'
import { auth } from '@/auth'
import { isAdmin, canAccessProgram } from '@/lib/permissions'
import SubmissionsList from './SubmissionsList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const program = await getProgram(id)
  return { title: program ? `${program.name} submissions` : 'Submissions' }
}

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, session] = await Promise.all([getProgram(id), auth()])
  if (!program) notFound()

  const slackId = session?.user?.slackId
  if (!canAccessProgram(slackId, program)) notFound()

  const admin = isAdmin(slackId)
  const allSubmissions = await getSubmissions(program.slackChannel)
  const submissions = admin ? allSubmissions : allSubmissions.map(stripPII)

  const pendingCount = submissions.filter(s => s.status === 'Pending').length

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Navbar variant="admin" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6">
          <Link
            href={`/programs/${id}`}
            className="text-sm font-semibold text-gray-500 transition-colors hover:text-hc-red"
          >
            ← {program.name}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="h-7 w-1.5 rounded-full" style={{ backgroundColor: program.keyColor }} />
            <h1 className="font-display text-2xl font-extrabold text-hc-dark">Submissions</h1>
            <span className="text-sm font-semibold text-gray-400">
              {submissions.length} in total
              {pendingCount > 0 && ` · ${pendingCount} waiting on review`}
            </span>
          </div>
        </header>

        <SubmissionsList initialSubmissions={submissions} isAdmin={admin} />
      </main>
    </div>
  )
}
