'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Accepting a pitch, and picking the repo template in the same breath.
 *
 * The two templates used to be buttons with a line-drawing of a chevron and a
 * chip on them. A template is an identifier, so it says its identifier: the
 * repo it generates from is right there in monospace, which is the thing an
 * admin actually wants to confirm before committing.
 */
const TEMPLATES = [
  { id: 'smol-template-sw', label: 'Software' },
  { id: 'smol-template-hw', label: 'Hardware' },
]

export default function AcceptButton({ programId }: { programId: string }) {
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleAccept(template: string) {
    setAccepting(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', template }),
      })
      if (!res.ok) throw new Error(`Accept failed: ${res.status}`)
      router.refresh()
    } catch {
      setFailed(true)
      setAccepting(false)
    }
  }

  if (!picking) {
    return (
      <button onClick={() => setPicking(true)} className="action action-clear">
        Accept program
      </button>
    )
  }

  return (
    <span className="action-row">
      <span className="tally">Generate the repo from</span>
      {TEMPLATES.map(t => (
        <button
          key={t.id}
          onClick={() => handleAccept(t.id)}
          disabled={accepting}
          className="action action-clear"
        >
          {t.label} <code>{t.id}</code>
        </button>
      ))}
      <button onClick={() => setPicking(false)} disabled={accepting} className="action action-quiet">
        Cancel
      </button>
      {failed && (
        <span role="alert" className="error-note">
          That didn&apos;t save — the program is still in review.
        </span>
      )}
    </span>
  )
}
