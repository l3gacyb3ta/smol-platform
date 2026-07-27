'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Blank from '@/components/Blank'
import type { Program } from '@/lib/types'

/**
 * Admin-only inline editor for a manually-provisioned resource (DNS domain,
 * HCB org). Recording the URL is what marks the corresponding spin-up step
 * done — there is no separate "done" flag, which is why this sits in the state
 * column of the provisioning table rather than off in a form somewhere.
 */
export default function ResourceLinkForm({
  programId,
  resourceKey,
  placeholder,
}: {
  programId: string
  resourceKey: keyof Program['resources']
  placeholder: string
}) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return
    setSaving(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: { [resourceKey]: url } }),
      })
      // Without this check a rejected write looks identical to a successful
      // one: the field clears, the page refreshes, and nothing has changed.
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setUrl('')
      router.refresh()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="action-row">
      <Blank
        label={`${resourceKey} URL`}
        type="url"
        required
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder={placeholder}
        aria-invalid={failed}
      />
      <button type="submit" disabled={saving || !url} className="action">
        {saving ? 'Saving…' : 'Record it'}
      </button>
      {failed && (
        <span role="alert" className="error-note">
          Didn&apos;t save — check the field exists in Airtable.
        </span>
      )}
    </form>
  )
}
