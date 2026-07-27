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
