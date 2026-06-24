'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import type { Program } from '@/lib/types'

function StatusBadge({ status }: { status: Program['status'] }) {
  if (status === 'active') {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
        Active
      </span>
    )
  }
  if (status === 'accepted') {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
        Accepted
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
        Pending
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
      Archived
    </span>
  )
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/programs/${program.id}`}
      className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
      style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="flex flex-col gap-3">
        <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: program.keyColor }} />
        <div>
          <h3
            className="text-hc-dark text-2xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0' }}
          >
            {program.name}
          </h3>
          <p className="text-gray-500 text-sm font-medium leading-relaxed mt-1">{program.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: program.keyColor }} />
          <span className="text-gray-500 text-sm">#{program.slackChannel}</span>
        </div>
        <span className="text-gray-500 text-sm">{program.subdomain}.hackclub.com</span>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={program.status} />
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          <Link
            href={`/programs/${program.id}`}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Edit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </Link>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
            style={{ background: '#fee2e2' }}
            title="Delete"
            onClick={async (e) => {
              e.preventDefault()
              if (confirm(`Delete "${program.name}"? This cannot be undone.`)) {
                await fetch(`/api/programs/${program.id}`, { method: 'DELETE' })
                window.location.reload()
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/programs')
      .then(r => r.json())
      .then(setPrograms)
      .finally(() => setLoading(false))
  }, [])

  const activeCount = programs.filter(p => p.status === 'active').length
  const acceptedCount = programs.filter(p => p.status === 'accepted').length
  const pendingCount = programs.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar variant="admin" />

      <main className="flex-1 px-12 py-9">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1
              className="text-hc-dark text-3xl font-extrabold"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0' }}
            >
              Smol Programs
            </h1>
            <span className="bg-hc-red text-white text-xs font-bold px-3 py-1.5 rounded-full">
              A You Ship We Ship project
            </span>
          </div>
          <Link
            href="/programs/new"
            className="bg-hc-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
            style={{ fontFamily: 'var(--font-recursive)', boxShadow: '0 4px 8px rgba(236,55,80,0.4)' }}
          >
            New Program →
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-8">
          {[
            `${programs.length} Programs`,
            `${activeCount} Active`,
            ...(acceptedCount > 0 ? [`${acceptedCount} Accepted`] : []),
            `${pendingCount} Pending`,
          ].map(stat => (
            <span
              key={stat}
              className="text-sm font-semibold text-gray-700 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200"
            >
              {stat}
            </span>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-gray-400 text-sm">Loading programs...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-lg mb-4">No programs yet.</p>
            <Link href="/programs/new" className="bg-hc-red text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
              Create your first program →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {programs.map(program => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
