'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ProgramSpec, { type Availability, type SpecValues } from '@/components/ProgramSpec'
import { composePitch } from '@/lib/pitch'
import { addDays, nextMonday } from '@/lib/runwindow'
import { FORM_REVISION } from '@/lib/edition'

/* ---------------------------------------------------------------------------
   Pitching a program.

   This is the one genuinely manipulative surface in the app: it writes an
   external artifact, and accepting it provisions a Slack channel and a GitHub
   repo. So it keeps its affordances, and it keeps its Submit button.

   What changed is everything above the button. Fourteen labelled fields in a
   stack became four sentences the software says about the program it is going to
   make, with the values as blanks — see ProgramSpec. And three of those values
   arrive already filled in, because the software could have known them:

     start date     the next Monday                                (environment)
     end date       three weeks after the start, until you move it  (environment)
     GitHub handle  the last one you used, from this device only    (history)

   Each is a plain field you can type straight over. A prediction the user can't
   override is worse than the empty field it replaced.
   --------------------------------------------------------------------------- */

/** Where the last-used GitHub handle lives. On the device, never on a server. */
const GITHUB_HANDLE_KEY = 'smol.githubUsername'

/** How long a run lasts unless someone says otherwise. */
const DEFAULT_RUN_DAYS = 21

const EMPTY: SpecValues = {
  name: '',
  youShip: '',
  weShip: '',
  description: '',
  startDate: '',
  endDate: '',
  subdomain: '',
  slackChannel: '',
  keyColor: '#ec3750',
  githubUsername: '',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function NewProgramPage() {
  const router = useRouter()
  const [values, setValues] = useState<SpecValues>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availability, setAvailability] = useState<Availability>('idle')

  // Once a derived field is edited by hand, stop deriving it.
  const [channelDirty, setChannelDirty] = useState(false)
  const [subdomainDirty, setSubdomainDirty] = useState(false)
  const [endDirty, setEndDirty] = useState(false)

  // The predictions land after mount, not in a lazy initializer, because both of
  // their sources are external systems that don't exist during render: this route
  // is statically prerendered, so `nextMonday()` at build time would bake in
  // whatever Monday followed the deploy and never move again, and `localStorage`
  // isn't there at all. Reading the clock and the device on mount is what this
  // effect is for.
  useEffect(() => {
    const start = nextMonday()
    let remembered = ''
    try {
      remembered = localStorage.getItem(GITHUB_HANDLE_KEY) ?? ''
    } catch {
      // Private mode, or storage disabled. The field is optional anyway.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the clock and the device, once, on mount. See the comment above.
    setValues(prev => ({
      ...prev,
      startDate: prev.startDate || start,
      endDate: prev.endDate || addDays(start, DEFAULT_RUN_DAYS),
      githubUsername: prev.githubUsername || remembered,
    }))
  }, [])

  function change(patch: Partial<SpecValues>) {
    if (patch.slackChannel !== undefined) setChannelDirty(true)
    if (patch.subdomain !== undefined) setSubdomainDirty(true)
    if (patch.endDate !== undefined) setEndDirty(true)

    setValues(prev => {
      const next = { ...prev, ...patch }

      // The channel and the address are the program's name, slugified, until
      // someone says otherwise.
      if (patch.name !== undefined) {
        const slug = slugify(patch.name)
        if (!channelDirty) next.slackChannel = slug
        if (!subdomainDirty) next.subdomain = slug
      }

      // The end date follows the start date around until it's been moved by hand,
      // so moving when a run begins doesn't silently leave it a day long.
      if (patch.startDate !== undefined && !endDirty && patch.startDate) {
        next.endDate = addDays(patch.startDate, DEFAULT_RUN_DAYS)
      }

      return next
    })
  }

  const checkSubdomain = useCallback(async (sub: string) => {
    if (!sub) return setAvailability('idle')
    setAvailability('checking')
    try {
      const res = await fetch(`/api/programs/check?subdomain=${encodeURIComponent(sub)}`)
      const data = await res.json()
      setAvailability(data.available ? 'available' : 'taken')
    } catch {
      setAvailability('idle')
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkSubdomain(values.subdomain), 500)
    return () => clearTimeout(t)
  }, [values.subdomain, checkSubdomain])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      setError('The end date needs to be on or after the start date.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          // The full sentence is what gets rendered; `weShip` keeps the reward
          // half on its own so it's queryable without parsing prose.
          description: composePitch(values.youShip, values.weShip),
          weShip: values.weShip.trim(),
          slackChannel: values.slackChannel,
          subdomain: values.subdomain,
          startDate: values.startDate,
          endDate: values.endDate,
          keyColor: values.keyColor,
          creatorGithubUsername: values.githubUsername || undefined,
        }),
      })
      if (!res.ok) {
        // The server rejects duplicate channels/subdomains and bad charsets —
        // show its reason rather than a generic failure.
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Something went wrong on our end. Give it another go.')
        setSubmitting(false)
        return
      }

      // Remember the handle for the next pitch, on this device only.
      try {
        if (values.githubUsername) localStorage.setItem(GITHUB_HANDLE_KEY, values.githubUsername)
      } catch {
        // Not important enough to fail a submission over.
      }

      const program = await res.json()
      router.push(`/programs/${program.id}/creating`)
    } catch {
      setError('Something went wrong on our end. Give it another go.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="sheet sheet-form">
        <Link href="/dashboard" className="crumb">
          ← All programs
        </Link>

        <div className="section-head">
          <h1>Pitch a smol</h1>
          <span className="tally">one small thing to build, one thing worth having</span>
        </div>

        <p>
          Fill in the blanks. We set up the Slack channel, the site, the repo, the submission form,
          and the finance account from what you write here.
        </p>

        <form onSubmit={handleSubmit}>
          <ProgramSpec
            values={values}
            onChange={change}
            subdomainAvailability={availability}
            askGithub
          />

          {error && (
            <p role="alert" className="error-note">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={submitting || availability === 'taken'}
              className="action action-strong"
            >
              {submitting ? 'Sending…' : 'Send it in'}
            </button>
            <span className="tally">
              A Hack Club admin reviews every pitch. Nothing is created until they accept it.
            </span>
          </div>
        </form>

        <p className="edition" style={{ marginTop: '16px' }}>
          SMOL FORM 2 · PITCH · {FORM_REVISION} · PREVIOUS EDITION IS OBSOLETE
        </p>
      </main>

      <SiteFooter />
    </>
  )
}
