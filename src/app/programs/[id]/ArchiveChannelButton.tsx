'use client'

import { useState } from 'react'

/** Archives the program's Slack channel. Confirmed in place, like every other
 *  irreversible-ish action on this page. */
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
    return <span className="state state-void">channel archived</span>
  }

  if (state === 'error') {
    return (
      <span role="alert" className="error-note">
        {errorMsg}
      </span>
    )
  }

  if (state === 'confirming') {
    return (
      <span className="action-row">
        <button onClick={handleArchive} className="action action-danger">
          Yes, archive it
        </button>
        <button onClick={() => setState('idle')} className="action action-quiet">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setState('confirming')}
      disabled={state === 'loading'}
      className="action action-danger"
    >
      Archive channel
    </button>
  )
}
