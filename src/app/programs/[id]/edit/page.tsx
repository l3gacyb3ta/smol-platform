import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { loadProgramForViewer } from '@/lib/program-access'
import { FORM_REVISION } from '@/lib/edition'
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
    <>
      <SiteHeader />

      <main className="sheet sheet-form">
        <Link href={`/programs/${program.id}`} className="crumb">
          ← {program.name}
        </Link>

        <div className="section-head">
          <h1>Edit {program.name}</h1>
          <span className="tally">the record, not the resources</span>
        </div>

        <p>
          Changes here don&apos;t touch the program&apos;s status or anything already provisioned for
          it.
        </p>

        <EditProgramForm program={program} />

        <p className="edition" style={{ marginTop: '16px' }}>
          SMOL FORM 2 · AMENDMENT · {FORM_REVISION}
        </p>
      </main>

      <SiteFooter />
    </>
  )
}
