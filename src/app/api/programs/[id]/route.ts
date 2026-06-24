import { NextRequest, NextResponse } from 'next/server'
import { getProgram, updateProgram, deleteProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { canAccessProgram } from '@/lib/permissions'

type Params = { params: Promise<{ id: string }> }

async function authorize(id: string) {
  const [session, program] = await Promise.all([auth(), getProgram(id)])
  if (!program) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (!canAccessProgram(session?.user?.slackId, program)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { program }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { program, error } = await authorize(id)
  if (error) return error
  return NextResponse.json(program)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error } = await authorize(id)
  if (error) return error
  const body = await req.json()
  const program = await updateProgram(id, body)
  return NextResponse.json(program)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error } = await authorize(id)
  if (error) return error
  await deleteProgram(id)
  return NextResponse.json({ ok: true })
}
