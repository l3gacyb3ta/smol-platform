import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { canAccessProgram } from '@/lib/permissions'
import EditProgramForm from './EditProgramForm'

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, session] = await Promise.all([getProgram(id), auth()])
  if (!session) redirect('/')
  if (!program) notFound()
  if (!canAccessProgram(session.user?.slackId, program)) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar variant="admin" />

      <main className="flex-1 flex items-start justify-center py-12 px-4">
        <div
          className="bg-white rounded-3xl w-full max-w-2xl px-14 pt-12 pb-14"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 16px 24px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <div className="flex flex-col items-center gap-2 mb-8">
            <Link href={`/programs/${program.id}`} className="text-gray-500 text-sm font-semibold hover:text-gray-700 self-start">
              ← Back to program
            </Link>
            <h1
              className="text-hc-dark text-3xl font-extrabold text-center"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              Edit {program.name}
            </h1>
            <p className="text-gray-500 text-sm text-center">Update program details. Resources and status aren&apos;t changed here.</p>
          </div>

          <hr className="border-gray-100 mb-8" />

          <EditProgramForm program={program} />
        </div>
      </main>
    </div>
  )
}
