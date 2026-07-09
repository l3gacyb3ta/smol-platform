'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Props {
  programId: string
  programName: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function DeleteButton({ programId, programName, trigger, onSuccess }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const confirmed = inputValue === programName

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function close() {
    setOpen(false)
    setInputValue('')
  }

  async function handleDelete() {
    if (!confirmed || deleting) return
    setDeleting(true)
    await fetch(`/api/programs/${programId}`, { method: 'DELETE' })
    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-hc-red text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
          style={{ fontFamily: 'var(--font-recursive)' }}
        >
          Delete Program
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className="bg-white rounded-2xl p-7 flex flex-col gap-5 w-full max-w-md"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}
          >
            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec3750" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </span>
                <h2
                  className="text-hc-dark text-lg font-extrabold"
                  style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0' }}
                >
                  Delete Program
                </h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                This will permanently delete <span className="font-semibold text-hc-dark">{programName}</span> and all associated data. This action cannot be undone.
              </p>
            </div>

            {/* Confirmation input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Type <span
                  className="font-mono px-1.5 py-0.5 rounded text-sm"
                  style={{ background: '#fef2f2', color: '#ec3750', border: '1px solid #fecdd3' }}
                >{programName}</span> to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleDelete() }}
                placeholder={programName}
                className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors"
                style={{
                  borderColor: inputValue.length > 0 ? (confirmed ? '#a7f3d0' : '#fecdd3') : '#e5e7eb',
                  boxShadow: inputValue.length > 0 ? (confirmed ? '0 0 0 3px #d1fae5' : '0 0 0 3px #fee2e2') : 'none',
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={close}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!confirmed || deleting}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
                style={{
                  backgroundColor: confirmed ? '#ec3750' : '#fca5a5',
                  cursor: confirmed && !deleting ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
