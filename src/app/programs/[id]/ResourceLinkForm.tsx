'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Program } from '@/lib/types'

/**
 * Admin-only inline editor for a manually-provisioned resource (DNS domain,
 * HCB org). Recording the URL is what marks the corresponding spin-up step
 * done — there is no separate "done" flag.
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
    <div className="flex shrink-0 flex-col items-end gap-1">
      <form onSubmit={handleSave} className="flex items-center gap-1.5">
        <input
          type="url"
          required
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={placeholder}
          aria-label={`${resourceKey} URL`}
          aria-invalid={failed}
          className="input w-36 rounded-lg px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={saving || !url}
          className="btn btn-sm btn-primary px-2.5 py-1"
        >
          {saving ? '…' : 'Save'}
        </button>
      </form>
      {failed && (
        <span role="alert" className="text-xs font-semibold text-hc-red">
          Didn&apos;t save — check the field exists in Airtable.
        </span>
      )}
    </div>
  )
}
