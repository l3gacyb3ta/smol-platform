import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { getProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { canAccessProgram } from '@/lib/permissions'
import EditProgramForm from './EditProgramForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const program = await getProgram(id)
  return { title: program ? `Edit ${program.name}` : 'Edit program' }
}

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, session] = await Promise.all([getProgram(id), auth()])
  if (!session) redirect('/')
  if (!program) notFound()
  if (!canAccessProgram(session.user?.slackId, program)) redirect('/dashboard')

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Navbar variant="admin" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={`/programs/${program.id}`}
          className="text-sm font-semibold text-gray-500 transition-colors hover:text-hc-red"
        >
          ← Back to {program.name}
        </Link>

        <div className="panel mt-4 px-6 py-10 sm:px-12">
          <div className="mb-8 flex flex-col gap-1.5">
            <h1 className="font-display text-2xl font-extrabold text-hc-dark sm:text-3xl">
              Edit {program.name}
            </h1>
            <p className="text-sm text-gray-500">
              Changes here don&apos;t touch the program&apos;s status or any resource
              already provisioned for it.
            </p>
          </div>

          <hr className="mb-8 border-gray-100" />

          <EditProgramForm program={program} />
        </div>
      </main>
    </div>
  )
}
