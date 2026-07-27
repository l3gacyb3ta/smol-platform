'use client'

import { useState } from 'react'

function ArchiveIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  )
}

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
    return <span className="badge badge-gray">Channel archived</span>
  }

  if (state === 'error') {
    return (
      <span role="alert" className="text-xs font-semibold text-hc-red">
        {errorMsg}
      </span>
    )
  }

  if (state === 'confirming') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Archive the channel?</span>
        <button onClick={handleArchive} className="btn btn-sm btn-primary">
          Yes, archive it
        </button>
        <button
          onClick={() => setState('idle')}
          className="cursor-pointer px-1 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700"
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
      className="btn btn-sm btn-secondary"
    >
      <ArchiveIcon />
      Archive channel
    </button>
  )
}
