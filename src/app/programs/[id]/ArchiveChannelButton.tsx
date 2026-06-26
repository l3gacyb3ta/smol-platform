'use client'

import { useState } from 'react'

export default function ArchiveChannelButton({ programId }: { programId: string }) {
  const [state, setState] = useState<'idle' | 'confirming' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleArchive() {
    setState('loading')
    try {
      const res = await fetch(`/api/programs/${programId}/slack-archive`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed')
      }
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'done') {
    return <span className="text-xs font-semibold text-gray-400">Channel archived</span>
  }

  if (state === 'error') {
    return <span className="text-xs font-semibold text-red-500">{errorMsg}</span>
  }

  if (state === 'confirming') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Archive this channel?</span>
        <button
          onClick={handleArchive}
          className="text-xs font-bold text-white bg-hc-red px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
        >
          Yes, archive it
        </button>
        <button
          onClick={() => setState('idle')}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState('confirming')}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
      Archive Slack Channel
    </button>
  )
}
