import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { loadProgramForViewer } from '@/lib/program-access'
import EditProgramForm from './EditProgramForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { program, allowed } = await loadProgramForViewer(id)
  return { title: allowed && program ? `Edit ${program.name}` : 'Edit program' }
}

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { program, session, allowed } = await loadProgramForViewer(id)
  if (!session) redirect('/')
  // 404, not a redirect to the dashboard — bouncing only on programs that
  // exist would confirm which IDs are real.
  if (!program || !allowed) notFound()

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
