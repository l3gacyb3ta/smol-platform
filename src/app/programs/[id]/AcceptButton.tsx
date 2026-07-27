'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TEMPLATES = [
  {
    id: 'smol-template-sw',
    label: 'Software',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: 'smol-template-hw',
    label: 'Hardware',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
]

export default function AcceptButton({ programId }: { programId: string }) {
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [accepting, setAccepting] = useState(false)

  async function handleAccept(template: string) {
    setAccepting(true)
    await fetch(`/api/programs/${programId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', template }),
    })
    router.refresh()
  }

  if (picking) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-amber-800">Which template?</span>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => handleAccept(t.id)}
            disabled={accepting}
            title={t.id}
            className="btn btn-sm border border-amber-300 bg-white text-amber-900 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setPicking(false)}
          disabled={accepting}
          className="cursor-pointer px-1 text-xs font-semibold text-amber-600 transition-colors hover:text-amber-800"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setPicking(true)}
      className="btn btn-sm bg-hc-green text-white hover:brightness-95"
    >
      Accept program
    </button>
  )
}
