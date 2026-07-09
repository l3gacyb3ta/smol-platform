'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const KEY_COLORS = ['#ec3750', '#5bc0de', '#f7b731', '#20c997', '#7950f2', '#ff6b6b', '#339af0']

export default function NewProgramPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [keyColor, setKeyColor] = useState('#ec3750')
  const [githubUsername, setGithubUsername] = useState('')

  // Auto-fill slug fields from name
  useEffect(() => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setSlackChannel(slug)
    setSubdomain(slug)
  }, [name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, slackChannel, subdomain, startDate, endDate, keyColor, creatorGithubUsername: githubUsername || undefined }),
      })
      if (!res.ok) throw new Error('Failed to create program')
      const program = await res.json()
      router.push(`/programs/${program.id}/creating`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const inputClass = "w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hc-red focus:border-transparent transition"

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      <Navbar variant="admin" />

      <main className="flex-1 flex items-start justify-center py-12 px-4">
        <div
          className="bg-white rounded-3xl w-full max-w-2xl px-14 pt-12 pb-14"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 16px 24px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <span
              className="bg-hc-red text-white text-xs font-bold px-4 py-1.5 rounded-full"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              A You Ship We Ship project
            </span>
            <h1
              className="text-hc-dark text-3xl font-extrabold text-center"
              style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
            >
              Unified Smol Program Form
            </h1>
            <p className="text-gray-500 text-sm text-center">Submit your program details below to get started.</p>
          </div>

          <hr className="border-gray-100 mb-8" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Preview row */}
            <div className="flex items-center gap-2 flex-wrap text-sm justify-center text-gray-600 font-semibold">
              <span>You ship</span>
              <span className="bg-gray-50 border border-gray-200 rounded px-3 py-1 text-gray-400 text-xs min-w-20">
                {name || 'a project'}
              </span>
              <span>, we ship</span>
              <span className="bg-gray-50 border border-gray-200 rounded px-3 py-1 text-gray-400 text-xs min-w-20">
                {description.split(' ').slice(0, 4).join(' ') || 'something cool'}
              </span>
              <span>!</span>
            </div>

            {/* Program Name + Slack Channel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Program Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Tea And Biscuits"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Slack Channel Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="#tea-and-biscuits"
                  value={slackChannel}
                  onChange={e => setSlackChannel(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                  required
                />
              </div>
            </div>

            {/* Subdomain */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Subdomain</label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-hc-red">
                <input
                  type="text"
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="tea-and-biscuits"
                  value={subdomain}
                  onChange={e => setSubdomain(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                  required
                />
                <span className="px-3 py-3 text-sm text-gray-400 border-l border-gray-200 bg-gray-50 shrink-0">.hackclub.com</span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">End Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="You ship a website, we ship tea & biscuits"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            {/* GitHub Username */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Your GitHub Username</label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-hc-red">
                <span className="px-3 py-3 text-sm text-gray-400 border-r border-gray-200 bg-gray-50 shrink-0">github.com/</span>
                <input
                  type="text"
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="your-username"
                  value={githubUsername}
                  onChange={e => setGithubUsername(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                />
              </div>
              <p className="text-xs text-gray-400">You'll be added as an admin to the generated repo.</p>
            </div>

            {/* Key Color */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700">Key color</label>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {KEY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
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
                <div
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: keyColor }} />
                  <span className="text-sm font-medium text-gray-700">{keyColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
              style={{
                backgroundColor: '#ec3750',
                fontFamily: 'var(--font-recursive)',
                boxShadow: '0 4px 8px rgba(236,55,80,0.4)',
              }}
            >
              {submitting ? 'Creating your Smol...' : 'Submit →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
