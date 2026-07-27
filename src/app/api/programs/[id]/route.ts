import { NextRequest, NextResponse } from 'next/server'
import { getProgram, updateProgram, deleteProgram } from '@/lib/airtable'
import { auth } from '@/auth'
import { canAccessProgram, isAdmin } from '@/lib/permissions'
import type { Session } from 'next-auth'

type Params = { params: Promise<{ id: string }> }

async function authorize(id: string) {
  const [session, program] = await Promise.all([auth(), getProgram(id)])
  if (!program) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (!canAccessProgram(session?.user?.slackId, program)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { program, session }
}

// Allow-list of fields a non-admin creator may edit. Everything else — status,
// resources, error state, template, and creator identity fields (which feed
// privileged server-side provisioning) — is admin-only. Using an allow-list
// avoids re-introducing gaps whenever a new field is added.
const USER_EDITABLE_FIELDS = ['name', 'description', 'slackChannel', 'subdomain', 'startDate', 'endDate', 'keyColor'] as const

function stripPrivilegedFields(body: Record<string, unknown>, session: Session | null) {
  if (isAdmin(session?.user?.slackId)) return body
  const safe: Record<string, unknown> = {}
  for (const field of USER_EDITABLE_FIELDS) {
    if (field in body) safe[field] = body[field]
  }
  return safe
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { program, error } = await authorize(id)
  if (error) return error
  return NextResponse.json(program)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error, session } = await authorize(id)
  if (error) return error
  const body = await req.json()
  const program = await updateProgram(id, stripPrivilegedFields(body, session ?? null))
  return NextResponse.json(program)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error } = await authorize(id)
  if (error) return error
  await deleteProgram(id)
  return NextResponse.json({ ok: true })
}
