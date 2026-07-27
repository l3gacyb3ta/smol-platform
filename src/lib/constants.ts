/** Palette offered to program creators for their program's key colour. */
export const KEY_COLORS = [
  '#ec3750',
  '#ff4d05',
  '#f7b731',
  '#20c997',
  '#5bc0de',
  '#339af0',
  '#7950f2',
] as const

/**
 * Identifier charsets, enforced server-side. Both values are interpolated into
 * Airtable formulas and used to name external resources (repo, DNS record,
 * Slack channel), so they are validated rather than trusted from the client.
 */
export const SUBDOMAIN_RE = /^[a-z0-9-]{1,63}$/
export const SLACK_CHANNEL_RE = /^[a-z0-9-]{1,80}$/

export const ROOT_DOMAIN = 'smol.hackclub.com'

export const SITE_URL = `https://${ROOT_DOMAIN}`

/** Public URL a program's own site lives at. */
export function programUrl(subdomain: string): string {
  return `https://${subdomain}.${ROOT_DOMAIN}`
}

/** Host portion of the above, for display. */
export function programHost(subdomain: string): string {
  return `${subdomain}.${ROOT_DOMAIN}`
}
