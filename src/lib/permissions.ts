import type { Program } from './types'

// Comma-separated Slack user IDs, e.g. ADMIN_SLACK_IDS=U01234ABCDE,U09876ZYXWV
const ADMIN_SLACK_IDS = new Set(
  (process.env.ADMIN_SLACK_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
)

export function isAdmin(slackId: string | undefined): boolean {
  if (!slackId) return false
  return ADMIN_SLACK_IDS.has(slackId)
}

export function canAccessProgram(slackId: string | undefined, program: Program): boolean {
  if (!slackId) return false
  return isAdmin(slackId) || program.creatorSlackId === slackId
}
