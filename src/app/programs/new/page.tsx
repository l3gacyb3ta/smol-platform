'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import KeyColorPicker from '@/components/KeyColorPicker'
import PitchFields from '@/components/PitchFields'
import { CheckIcon, CloseIcon, SpinnerIcon } from '@/components/Icons'
import { ROOT_DOMAIN } from '@/lib/constants'
import { composePitch } from '@/lib/pitch'

type Availability = 'idle' | 'checking' | 'available' | 'taken'

function AvailabilityBadge({ state }: { state: Availability }) {
  if (state === 'idle') return null
  if (state === 'checking') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
        <SpinnerIcon size={12} />
        Checking
      </span>
    )
  }
  if (state === 'available') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <CheckIcon size={12} />
        Free
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-hc-red">
      <CloseIcon size={12} />
      Taken
    </span>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function NewProgramPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [youShip, setYouShip] = useState('')
  const [weShip, setWeShip] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [keyColor, setKeyColor] = useState('#ec3750')
  const [githubUsername, setGithubUsername] = useState('')

  // Once the user edits a slug field by hand, stop auto-filling it from the name.
  const [channelDirty, setChannelDirty] = useState(false)
  const [subdomainDirty, setSubdomainDirty] = useState(false)

  const [subdomainAvailability, setSubdomainAvailability] = useState<Availability>('idle')

  const checkSubdomain = useCallback(async (sub: string) => {
    if (!sub) return setSubdomainAvailability('idle')
    setSubdomainAvailability('checking')
    try {
      const res = await fetch(`/api/programs/check?subdomain=${encodeURIComponent(sub)}`)
      const data = await res.json()
      setSubdomainAvailability(data.available ? 'available' : 'taken')
    } catch {
      setSubdomainAvailability('idle')
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkSubdomain(subdomain), 500)
    return () => clearTimeout(t)
  }, [subdomain, checkSubdomain])

  // Auto-fill slug fields from the name, but never clobber a field the user has
  // edited by hand. Derived on change rather than in an effect.
  function handleNameChange(value: string) {
    setName(value)
    const slug = slugify(value)
    if (!channelDirty) setSlackChannel(slug)
    if (!subdomainDirty) setSubdomain(slug)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endDate && startDate && endDate < startDate) {
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
          name,
          // The full sentence is what gets rendered; `weShip` keeps the reward
          // half on its own so it's queryable without parsing prose.
          description: composePitch(youShip, weShip),
          weShip: weShip.trim(),
          slackChannel,
          subdomain,
          startDate,
          endDate,
          keyColor,
          creatorGithubUsername: githubUsername || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create program')
      const program = await res.json()
      router.push(`/programs/${program.id}/creating`)
    } catch {
      setError('Something went wrong on our end. Give it another go.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Navbar variant="admin" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-500 transition-colors hover:text-hc-red"
        >
          ← All programs
        </Link>

        <div className="panel mt-4 px-6 py-10 sm:px-12">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <span className="font-heading rounded-full bg-hc-red px-4 py-1.5 text-xs font-bold text-white">
              A You Ship We Ship project
            </span>
            <h1 className="font-display text-3xl font-extrabold text-hc-dark">Pitch a smol</h1>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500">
              Tell us what people build and what they get for it. We&apos;ll handle the
              Slack channel, site, repo, form, and finances.
            </p>
          </div>

          <hr className="mb-8 border-gray-100" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <PitchFields
              youShip={youShip}
              weShip={weShip}
              onYouShipChange={setYouShip}
              onWeShipChange={setWeShip}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="field-label">
                  Program name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="Tea and Biscuits"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="channel" className="field-label">
                  Slack channel
                </label>
                <div className="input-group">
                  <span className="input-affix border-r border-gray-200">#</span>
                  <input
                    id="channel"
                    type="text"
                    placeholder="tea-and-biscuits"
                    value={slackChannel}
                    onChange={e => {
                      setChannelDirty(true)
                      setSlackChannel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="subdomain" className="field-label">
                Website address
              </label>
              <div className="input-group">
                <input
                  id="subdomain"
                  type="text"
                  placeholder="tea-and-biscuits"
                  value={subdomain}
                  onChange={e => {
                    setSubdomainDirty(true)
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }}
                  required
                  aria-describedby="subdomain-hint"
                />
                <span className="input-affix border-l border-gray-200">.{ROOT_DOMAIN}</span>
                <span className="px-3">
                  <AvailabilityBadge state={subdomainAvailability} />
                </span>
              </div>
              <p id="subdomain-hint" className="field-hint">
                Where your program&apos;s site will live. Lowercase letters, numbers, and
                dashes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="start" className="field-label">
                  Start date
                </label>
                <input
                  id="start"
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="end" className="field-label">
                  End date
                </label>
                <input
                  id="end"
                  type="date"
                  className="input"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="github" className="field-label">
                Your GitHub username
              </label>
              <div className="input-group">
                <span className="input-affix border-r border-gray-200">github.com/</span>
                <input
                  id="github"
                  type="text"
                  placeholder="your-username"
                  value={githubUsername}
                  onChange={e => setGithubUsername(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  aria-describedby="github-hint"
                />
              </div>
              <p id="github-hint" className="field-hint">
                Optional — we&apos;ll add you as an admin on the repo we generate.
              </p>
            </div>

            <KeyColorPicker value={keyColor} onChange={setKeyColor} />

            {error && (
              <p role="alert" className="text-sm font-semibold text-hc-red">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || subdomainAvailability === 'taken'}
              className="btn btn-primary btn-lg w-full"
            >
              {submitting ? 'Setting things up…' : 'Send it in'}
            </button>

            <p className="text-center text-xs text-gray-400">
              A Hack Club admin reviews every pitch before it goes live.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
