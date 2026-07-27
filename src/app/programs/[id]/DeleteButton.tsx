'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Blank from '@/components/Blank'

/**
 * Deleting a program, confirmed in place.
 *
 * This used to open a modal over a blurred backdrop. An instrument has no
 * modals — nothing here needs to interrupt the page to be understood, and the
 * thing being deleted is more useful visible behind the question than covered up
 * by it. So the control expands into the sentence it was always asking:
 *
 *   Type "Tea and Biscuits" to confirm.
 *
 * The typed-name gate stays. This is a real commit with no undo, and it deserves
 * the friction.
 */
export default function DeleteButton({
  programId,
  programName,
}: {
  programId: string
  programName: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  const confirmed = typed === programName

  async function handleDelete() {
    if (!confirmed || deleting) return
    setDeleting(true)
    setFailed(false)
    try {
      // Without this check a rejected delete looks identical to a successful one:
      // the page navigates and the program is still there.
      const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
      router.push('/dashboard')
    } catch {
      setFailed(true)
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="action action-danger">
        Delete program
      </button>
    )
  }

  return (
    <span className="action-row">
      <span>
        Type{' '}
        <Blank
          label={`Type ${programName} to confirm deletion`}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleDelete()
            if (e.key === 'Escape') setConfirming(false)
          }}
          placeholder={programName}
          autoComplete="off"
          autoFocus
        />{' '}
        to confirm.
      </span>
      <button
        onClick={handleDelete}
        disabled={!confirmed || deleting}
        className="action action-danger"
      >
        {deleting ? 'Deleting…' : 'Delete for good'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="action action-quiet"
      >
        Keep it
      </button>
      {failed && (
        <span role="alert" className="error-note">
          That didn&apos;t delete. Try again.
        </span>
      )}
    </span>
  )
}
