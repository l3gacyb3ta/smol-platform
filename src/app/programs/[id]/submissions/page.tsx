import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getProgram } from '@/lib/airtable'
import { getSubmissions, stripPII } from '@/lib/airtable-submissions'
import { auth } from '@/auth'
import { isAdmin, canAccessProgram } from '@/lib/permissions'
import SubmissionsList from './SubmissionsList'

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, session] = await Promise.all([getProgram(id), auth()])
  if (!program) notFound()

  const slackId = session?.user?.slackId
  if (!canAccessProgram(slackId, program)) notFound()

  const admin = isAdmin(slackId)
  const allSubmissions = await getSubmissions(program.slackChannel)
  const submissions = admin ? allSubmissions : allSubmissions.map(stripPII)

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar variant="admin" />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/programs/${id}`} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
            ← {program.name}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-5 w-1 rounded-full" style={{ backgroundColor: program.keyColor }} />
            <h1
              className="text-hc-dark text-2xl font-extrabold"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0' }}
            >
              Submissions
            </h1>
            <span className="text-sm font-semibold text-gray-400">{submissions.length} total</span>
          </div>
        </div>

        <SubmissionsList
          programId={id}
          initialSubmissions={submissions}
          isAdmin={admin}
        />
      </main>
    </div>
  )
}
