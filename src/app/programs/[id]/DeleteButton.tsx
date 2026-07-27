'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { TrashIcon } from '@/components/Icons'

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
        <button onClick={() => setOpen(true)} className="btn btn-primary">
          Delete program
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-7"
            style={{ boxShadow: 'var(--shadow-modal)' }}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-hc-red">
                  <TrashIcon size={16} strokeWidth={2.5} />
                </span>
                <h2 id="delete-title" className="font-display text-lg font-extrabold text-hc-dark">
                  Delete this program?
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                This removes <span className="font-semibold text-hc-dark">{programName}</span> and
                everything recorded against it. There is no undo.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <label htmlFor="delete-confirm" className="field-label">
                Type{' '}
                <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-sm text-hc-red">
                  {programName}
                </span>{' '}
                to confirm
              </label>
              <input
                id="delete-confirm"
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleDelete()
                }}
                placeholder={programName}
                autoComplete="off"
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-medium outline-none transition-all"
                style={{
                  borderColor: inputValue.length === 0 ? '#e5e7eb' : confirmed ? '#6ee7b7' : '#fda4af',
                  boxShadow:
                    inputValue.length === 0
                      ? 'none'
                      : `0 0 0 3px ${confirmed ? '#d1fae5' : '#ffe4e6'}`,
                }}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={close} disabled={deleting} className="btn btn-secondary btn-sm">
                Keep it
              </button>
              <button
                onClick={handleDelete}
                disabled={!confirmed || deleting}
                className="btn btn-primary btn-sm"
              >
                {deleting ? 'Deleting…' : 'Delete program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
