'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Program } from '@/lib/types'

const KEY_COLORS = ['#ec3750', '#5bc0de', '#f7b731', '#20c997', '#7950f2', '#ff6b6b', '#339af0']

const inputClass =
  'w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hc-red focus:border-transparent transition'

// `<input type="date">` needs YYYY-MM-DD; Airtable may hand back a full ISO string.
const toDateInput = (d: string) => (d ? d.slice(0, 10) : '')

export default function EditProgramForm({ program }: { program: Program }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(program.name)
  const [description, setDescription] = useState(program.description)
  const [slackChannel, setSlackChannel] = useState(program.slackChannel)
  const [subdomain, setSubdomain] = useState(program.subdomain)
  const [startDate, setStartDate] = useState(toDateInput(program.startDate))
  const [endDate, setEndDate] = useState(toDateInput(program.endDate))
  const [keyColor, setKeyColor] = useState(program.keyColor)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (endDate && startDate && endDate < startDate) {
      setError('End date must be on or after the start date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, slackChannel, subdomain, startDate, endDate, keyColor }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push(`/programs/${program.id}`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Program Name</label>
          <input type="text" className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Slack Channel Name</label>
          <input
            type="text"
            className={inputClass}
            value={slackChannel}
            onChange={e => setSlackChannel(e.target.value.replace(/[^a-z0-9-]/g, ''))}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Subdomain</label>
        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-hc-red">
          <input
            type="text"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            value={subdomain}
            onChange={e => setSubdomain(e.target.value.replace(/[^a-z0-9-]/g, ''))}
            required
          />
          <span className="px-3 py-3 text-sm text-gray-400 border-l border-gray-200 bg-gray-50 shrink-0">.smol.hackclub.com</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Start Date</label>
          <input type="date" className={inputClass} value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">End Date</label>
          <input type="date" className={inputClass} value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-gray-700">Key color</label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {KEY_COLORS.map(color => (
              <button
                key={color}
                type="button"
                aria-label={`Key color ${color}`}
                aria-pressed={keyColor === color}
                className="w-8 h-8 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: color,
                  boxShadow: keyColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : undefined,
                }}
                onClick={() => setKeyColor(color)}
                title={color}
              />
            ))}
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: keyColor }} />
            <span className="text-sm font-medium text-gray-700">{keyColor.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3.5 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#ec3750', fontFamily: 'var(--font-recursive)', boxShadow: '0 4px 8px rgba(236,55,80,0.4)' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/programs/${program.id}`)}
          className="px-6 py-3.5 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
