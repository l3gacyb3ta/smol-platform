import type { Program } from './types'

/**
 * The six things a program needs, and who is responsible for each.
 *
 * This exists because two screens describe the same six things and had drifted
 * apart. The spin-up log knew that the Airtable and Fillout steps are simulated;
 * the program page's provisioning table did not, so it showed both of them as
 * `not yet recorded` in attention red — on every program, forever, including
 * fully live ones — while the log two clicks away reported them `done`. Two
 * sources of truth, actively contradicting each other.
 *
 * Now there is one. Both screens read `PROVISIONING`, and the resource key and
 * the spin-up step id sit side by side because they don't match (`domain` is
 * recorded against the `dns` step) and neither screen should have to remember it.
 *
 * This list *describes* what the spin-up route does; the route is what actually
 * does it. If you add, remove or re-own a step in
 * `app/api/programs/[id]/status/route.ts`, change this to match — a description
 * that has gone stale is how the contradiction above happened in the first place.
 */

/**
 * Who has to act for a thing to exist.
 *
 *  server   spin-up creates it and records the URL itself
 *  human    an admin makes it by hand; recording the URL is what marks it done
 *  unbuilt  nothing creates it. The step advances on a timer and no URL is ever
 *           written, so it can never be "recorded" and no amount of waiting or
 *           chasing will change that — it needs platform work, not program work
 */
export type Owner = 'server' | 'human' | 'unbuilt'

export interface ProvisionedThing {
  /** Where the URL lands on the program record, if one ever does. */
  resource: keyof Program['resources']
  /** The step id the spin-up status route emits for this thing. */
  step: string
  label: string
  owner: Owner
}

export const PROVISIONING: readonly ProvisionedThing[] = [
  { resource: 'slack', step: 'slack', label: 'Slack channel', owner: 'server' },
  { resource: 'github', step: 'github', label: 'GitHub repo', owner: 'server' },
  { resource: 'domain', step: 'dns', label: 'Domain', owner: 'human' },
  { resource: 'hcb', step: 'hcb', label: 'HCB org', owner: 'human' },
  { resource: 'airtable', step: 'airtable', label: 'Airtable', owner: 'unbuilt' },
  { resource: 'fillout', step: 'fillout', label: 'Submission form', owner: 'unbuilt' },
] as const

/** What to say in a "waiting on" or "owner" column. */
export const OWNER_LABEL: Record<Owner, string> = {
  server: 'the server',
  human: 'a human, by hand',
  unbuilt: 'nothing — not built yet',
}

export function ownerOfStep(step: string): Owner {
  return PROVISIONING.find(p => p.step === step)?.owner ?? 'server'
}

/**
 * The things that can actually be recorded — everything except the simulated
 * ones. Progress has to be counted against this, not against all six: a program
 * with every real resource in place would otherwise read "4 of 6" and look
 * permanently half-finished.
 */
export const RECORDABLE = PROVISIONING.filter(p => p.owner !== 'unbuilt')

export const SIMULATED_COUNT = PROVISIONING.length - RECORDABLE.length

/** How many of the recordable resources this program has a URL for. */
export function recordedCount(program: Program): number {
  return RECORDABLE.filter(p => program.resources[p.resource]).length
}
