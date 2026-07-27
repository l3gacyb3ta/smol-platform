'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import KeyColorPicker from '@/components/KeyColorPicker'
import PitchFields from '@/components/PitchFields'
import { ROOT_DOMAIN } from '@/lib/constants'
import { composePitch, parsePitch } from '@/lib/pitch'
import type { Program } from '@/lib/types'

// `<input type="date">` needs YYYY-MM-DD; Airtable may hand back a full ISO string.
const toDateInput = (d: string) => (d ? d.slice(0, 10) : '')

/**
 * Programs pitched before the two blanks existed have free-form descriptions
 * that don't split cleanly, so the form starts in whichever mode fits the data
 * and lets you move between them without losing what's already written.
 */
type PitchMode = 'blanks' | 'free'

export default function EditProgramForm({ program }: { program: Program }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parsed = parsePitch(program.description)

  const [name, setName] = useState(program.name)
  const [pitchMode, setPitchMode] = useState<PitchMode>(parsed ? 'blanks' : 'free')
  const [youShip, setYouShip] = useState(parsed?.youShip ?? '')
  const [weShip, setWeShip] = useState(parsed?.weShip ?? program.weShip ?? '')
  const [description, setDescription] = useState(program.description)
  const [slackChannel, setSlackChannel] = useState(program.slackChannel)
  const [subdomain, setSubdomain] = useState(program.subdomain)
  const [startDate, setStartDate] = useState(toDateInput(program.startDate))
  const [endDate, setEndDate] = useState(toDateInput(program.endDate))
  const [keyColor, setKeyColor] = useState(program.keyColor)

  // Carry the wording across when switching modes, so neither direction discards work.
  function switchToFreeText() {
    if (youShip.trim() || weShip.trim()) setDescription(composePitch(youShip, weShip))
    setPitchMode('free')
  }

  function switchToBlanks() {
    const fromText = parsePitch(description)
    if (fromText) {
      setYouShip(fromText.youShip)
      setWeShip(fromText.weShip)
    }
    setPitchMode('blanks')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endDate && startDate && endDate < startDate) {
      setError('The end date needs to be on or after the start date.')
      return
    }
    setSaving(true)
    setError('')

    // In free-text mode the sentence isn't split, so `weShip` is left alone
    // rather than being overwritten with a guess.
    const pitch =
      pitchMode === 'blanks'
        ? { description: composePitch(youShip, weShip), weShip: weShip.trim() }
        : { description }

    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ...pitch,
          slackChannel,
          subdomain,
          startDate,
          endDate,
          keyColor,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push(`/programs/${program.id}`)
      router.refresh()
    } catch {
      setError('Couldn’t save those changes. Give it another go.')
      setSaving(false)
    }
  }

  const toggleClass =
    'cursor-pointer text-xs font-semibold text-gray-500 underline transition-colors hover:text-hc-red'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {pitchMode === 'blanks' ? (
        <PitchFields
          youShip={youShip}
          weShip={weShip}
          onYouShipChange={setYouShip}
          onWeShipChange={setWeShip}
          action={
            <button type="button" onClick={switchToFreeText} className={toggleClass}>
              Write it as free text
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="field-label">
            The pitch
          </label>
          <textarea
            id="description"
            className="input resize-none"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            aria-describedby="description-hint"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p id="description-hint" className="field-hint">
              {parsed
                ? 'Free text — this replaces the sentence shown on the homepage.'
                : 'This pitch predates the fill-in-the-blanks version.'}
            </p>
            <button type="button" onClick={switchToBlanks} className={toggleClass}>
              Use “You ship…, we ship…”
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="field-label">
            Program name
          </label>
          <input
            id="name"
            type="text"
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
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
              value={slackChannel}
              onChange={e =>
                setSlackChannel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
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
            value={subdomain}
            onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            required
            aria-describedby="subdomain-hint"
          />
          <span className="input-affix border-l border-gray-200">.{ROOT_DOMAIN}</span>
        </div>
        <p id="subdomain-hint" className="field-hint">
          Renaming this won&apos;t move an already-provisioned site or repo.
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

      <KeyColorPicker value={keyColor} onChange={setKeyColor} />

      {error && (
        <p role="alert" className="text-sm font-semibold text-hc-red">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => router.push(`/programs/${program.id}`)}
          className="btn btn-secondary btn-lg"
        >
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary btn-lg flex-1">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
