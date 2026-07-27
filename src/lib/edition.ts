/**
 * The document states its own edition.
 *
 * Every page footer carries a form number and the revision it was built from,
 * set in the smallest type on the page. It costs nothing, it makes a bug report
 * answerable ("which build?"), and it is the clearest single tell that a person
 * who cared made the thing.
 */

/** Bumped by hand when the printed form itself changes shape. */
export const FORM_NUMBER = 'SMOL FORM 1'

/** Editorial revision of the layout, not of the deployed code. */
export const FORM_REVISION = 'REV 2026-07'

/**
 * The commit this build came from, if the host tells us.
 *
 * `NEXT_PUBLIC_BUILD_REV` comes first because it is the only one of these that
 * survives into a client bundle — the footer renders on both sides of the
 * boundary, and a footer that says `dev` in production would be worse than no
 * footer at all. Set it to the host's own SHA variable at build time; see
 * `.env.example`. Locally there is none, and `dev` is the honest answer rather
 * than a fabricated hash.
 */
export function buildRevision(): string {
  const sha =
    process.env.NEXT_PUBLIC_BUILD_REV ??
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA
  return sha ? sha.slice(0, 7) : 'dev'
}

/** `SMOL FORM 1 · REV 2026-07 · BUILD a1b2c3d` */
export function editionLine(): string {
  return `${FORM_NUMBER} · ${FORM_REVISION} · BUILD ${buildRevision()}`
}
