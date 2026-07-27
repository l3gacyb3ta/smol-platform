import { cache } from 'react'
import { auth } from '@/auth'
import { getProgram } from './airtable'
import { canAccessProgram } from './permissions'

/**
 * Loads a program alongside the viewer's session and access decision.
 *
 * Wrapped in React `cache` so a page and its `generateMetadata` share one
 * Airtable round-trip per request. Both need the decision: metadata streams
 * separately from the page body, so a title built from the program name would
 * leak it even on a route that goes on to call `notFound()`.
 */
export const loadProgramForViewer = cache(async (id: string) => {
  const [program, session] = await Promise.all([getProgram(id), auth()])
  const allowed = Boolean(session && program && canAccessProgram(session.user?.slackId, program))
  return { program, session, allowed }
})
