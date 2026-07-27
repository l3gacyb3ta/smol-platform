/**
 * A program's description is a single sentence in the shape
 * "You ship <a thing>, we ship <a reward>!" — composed from two blanks in the
 * pitch and edit forms, and rendered verbatim on the homepage.
 *
 * The reward half is also stored on its own in the `We Ship` column, so it can
 * be queried without parsing prose.
 */

// Non-greedy first group so the split lands on the first ", we ship", even when
// the first half contains commas of its own. `[\s\S]` rather than `.` with the
// dotAll flag, which this project's ES2017 target doesn't allow.
const PITCH_RE = /^\s*you ship\s+([\s\S]+?)\s*,\s*we ship\s+([\s\S]+?)\s*!?\s*$/i

export function composePitch(youShip: string, weShip: string): string {
  return `You ship ${youShip.trim()}, we ship ${weShip.trim()}!`
}

/**
 * Splits a composed description back into its two halves. Returns null for
 * free-form descriptions — programs pitched before the blanks existed — so
 * callers can fall back to editing the raw text instead of mangling it.
 */
export function parsePitch(description: string): { youShip: string; weShip: string } | null {
  const match = PITCH_RE.exec(description ?? '')
  if (!match) return null
  return { youShip: match[1], weShip: match[2] }
}
