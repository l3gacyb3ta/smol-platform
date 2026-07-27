'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgramSpec, { type SpecValues } from '@/components/ProgramSpec'
import { composePitch, parsePitch } from '@/lib/pitch'
import type { Program } from '@/lib/types'

// `<input type="date">` needs YYYY-MM-DD; Airtable may hand back a full ISO string.
const toDateInput = (d: string) => (d ? d.slice(0, 10) : '')

/**
 * Editing a program is the same sentence as pitching one, prefilled — which is
 * the point of writing the form as a sentence. There is no separate edit layout
 * to drift out of sync with the pitch layout.
 *
 * Programs pitched before the two blanks existed have free-form descriptions that
 * don't split cleanly, so the form starts in whichever mode fits the data and
 * lets you move between them without losing what's already written.
 */
export default function EditProgramForm({ program }: { program: Program }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parsed = parsePitch(program.description)
  const [freeText, setFreeText] = useState(!parsed)

  const [values, setValues] = useState<SpecValues>({
    name: program.name,
    youShip: parsed?.youShip ?? '',
    weShip: parsed?.weShip ?? program.weShip ?? '',
    description: program.description,
    startDate: toDateInput(program.startDate),
    endDate: toDateInput(program.endDate),
    subdomain: program.subdomain,
    slackChannel: program.slackChannel,
    keyColor: program.keyColor,
    githubUsername: program.creatorGithubUsername ?? '',
  })

  const change = (patch: Partial<SpecValues>) => setValues(prev => ({ ...prev, ...patch }))

  /** Carry the wording across when switching modes, so neither direction discards work. */
  function switchMode(toFreeText: boolean) {
    if (toFreeText) {
      if (values.youShip.trim() || values.weShip.trim()) {
        change({ description: composePitch(values.youShip, values.weShip) })
      }
    } else {
      const fromText = parsePitch(values.description)
      if (fromText) change({ youShip: fromText.youShip, weShip: fromText.weShip })
    }
    setFreeText(toFreeText)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      setError('The end date needs to be on or after the start date.')
      return
    }
    setSaving(true)
    setError('')

    // In free-text mode the sentence isn't split, so `weShip` is left alone
    // rather than being overwritten with a guess.
    const pitch = freeText
      ? { description: values.description }
      : { description: composePitch(values.youShip, values.weShip), weShip: values.weShip.trim() }

    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          ...pitch,
          slackChannel: values.slackChannel,
          subdomain: values.subdomain,
          startDate: values.startDate,
          endDate: values.endDate,
          keyColor: values.keyColor,
        }),
      })
      if (!res.ok) {
        // Duplicate channel/subdomain and charset rejections carry a reason.
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Couldn’t save those changes. Give it another go.')
        setSaving(false)
        return
      }
      router.push(`/programs/${program.id}`)
      router.refresh()
    } catch {
      setError('Couldn’t save those changes. Give it another go.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ProgramSpec
        values={values}
        onChange={change}
        freeText={freeText}
        onFreeText={switchMode}
        freeTextNote={
          parsed
            ? 'Free text — this replaces the sentence shown on the homepage.'
            : 'This pitch predates the fill-in-the-blanks version.'
        }
      />

      <p className="spec-note">
        Renaming the address or the channel won&apos;t move a site, repo or channel that has already
        been provisioned — those move by hand.
      </p>

      {error && (
        <p role="alert" className="error-note">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={saving} className="action action-strong">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/programs/${program.id}`)}
          className="action action-quiet"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
