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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return
    setSaving(true)
    await fetch(`/api/programs/${programId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resources: { [resourceKey]: url } }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-1.5 shrink-0">
      <input
        type="url"
        required
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder={placeholder}
        className="w-40 bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hc-red focus:border-transparent transition"
      />
      <button
        type="submit"
        disabled={saving || !url}
        className="text-xs font-bold text-white rounded-lg px-2.5 py-1 disabled:opacity-50 transition-colors"
        style={{ backgroundColor: '#ec3750' }}
      >
        {saving ? '…' : 'Mark done'}
      </button>
    </form>
  )
}
