import type { Program, ProgramStatus } from './types'

// Comma-separated Slack user IDs, e.g. ADMIN_SLACK_IDS=U01234ABCDE,U09876ZYXWV
const ADMIN_SLACK_IDS = new Set(
  (process.env.ADMIN_SLACK_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
)

// A program only really owns its Slack channel once an admin has accepted it.
// Anything still pending is just a self-service claim on a name.
const VETTED_STATUSES: ReadonlySet<ProgramStatus> = new Set<ProgramStatus>([
  'accepted',
  'active',
  'archived',
])

export function isAdmin(slackId: string | undefined): boolean {
  if (!slackId) return false
  return ADMIN_SLACK_IDS.has(slackId)
}

export function canAccessProgram(slackId: string | undefined, program: Program): boolean {
  if (!slackId) return false
  return isAdmin(slackId) || program.creatorSlackId === slackId
}

/**
 * Whether someone may read or review a program's submissions.
 *
 * Stricter than `canAccessProgram` on purpose. Submissions are joined to
 * programs by a free-text Slack channel name that the *submitter* fills in, and
 * anyone with a Hack Club login can create a program claiming any channel they
 * like. Ownership of a channel is therefore only meaningful once an admin has
 * accepted the program — `status` is admin-only, so a squatter's self-created
 * program stays `pending` and authorizes nothing.
 */
export function canAccessSubmissions(
  slackId: string | undefined,
  program: Program
): boolean {
  if (!slackId) return false
  if (isAdmin(slackId)) return true
  return canAccessProgram(slackId, program) && VETTED_STATUSES.has(program.status)
}
