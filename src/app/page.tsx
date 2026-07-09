import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { getPrograms } from '@/lib/airtable'
import { ProgramCard } from '@/components/ProgramCard'
import type { Program } from '@/lib/types'
import { auth } from '@/auth'

const FEATURE_CARDS = [
  {
    title: 'Learning something new',
    description: 'Learn new software, new hardware, or just a new way to make a project!',
    accentColor: '#5bc0de',
    borderColor: '#5bc0de',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    title: 'Engaging community',
    description: "Meet other builders, share what you're making, and get help when you need it.",
    accentColor: '#7950f2',
    borderColor: '#7950f2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Cool rewards',
    description: "Don't just get another 3D Printer. Get something made specifically for this program.",
    accentColor: '#ec3750',
    borderColor: '#ec3750',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/>
        <rect x="2" y="7" width="20" height="5"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
]

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ActiveBadge() {
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
      Active
    </span>
  )
}

function UpcomingBadge() {
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
      Upcoming
    </span>
  )
}

function PublicProgramCard({ program, variant }: { program: Program; variant: 'active' | 'upcoming' }) {
  const websiteUrl = `https://${program.subdomain}.smol.hackclub.com`
  const slackUrl = program.resources.slack
  const dateLabel = variant === 'active'
    ? (program.endDate ? `Ends ${formatDate(program.endDate)}` : 'Ongoing')
    : `Starts ${formatDate(program.startDate)}`

  return (
    <ProgramCard program={program} badge={variant === 'active' ? <ActiveBadge /> : <UpcomingBadge />}>
      <div className="text-xs text-gray-400 font-medium">{dateLabel}</div>

      <div className="flex gap-2 flex-wrap">
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: program.keyColor }}
        >
          Website ↗
        </a>
        {slackUrl ? (
          <a
            href={slackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            #{program.slackChannel}
          </a>
        ) : (
          <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">
            #{program.slackChannel}
          </span>
        )}
      </div>
    </ProgramCard>
  )
}

export default async function LandingPage() {
  const session = await auth()
  const today = new Date().toISOString().split('T')[0]

  let activePrograms: Program[] = []
  let upcomingPrograms: Program[] = []

  try {
    const programs = await getPrograms()
    activePrograms = programs.filter(p => p.status === 'active')
    upcomingPrograms = programs.filter(
      p => p.status === 'accepted' && p.startDate > today
    )
  } catch {
    // silently degrade — programs section just won't render
  }

  const hasPrograms = activePrograms.length > 0 || upcomingPrograms.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="public" />

      <main className="flex-1 grid-bg">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center min-h-[380px]">
          <div
            className="bg-hc-red text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
          >
            A You Ship We Ship project, run by Arcade at Hack Club
          </div>

          <h1
            className="font-heading text-hc-dark leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(80px, 18vw, 220px)',
              fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0',
              letterSpacing: '-0.03em',
            }}
          >
            Smol
          </h1>

          <p
            className="text-hc-dark text-lg font-semibold opacity-90"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
          >
            Small YSWSs, big fun
          </p>

          {session && (
            <Link
              href="/dashboard"
              className="bg-hc-red text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
              style={{ fontFamily: 'var(--font-recursive)', boxShadow: '0 4px 8px rgba(236,55,80,0.4)' }}
            >
              Go to Dashboard →
            </Link>
          )}
        </section>

        {/* Active & Upcoming Programs */}
        {hasPrograms && (
          <section className="px-6 md:px-16 lg:px-24 pb-16">
            <div className="max-w-5xl mx-auto flex flex-col gap-12">
              {activePrograms.length > 0 && (
                <div>
                  <h2
                    className="text-hc-dark text-2xl font-bold mb-6"
                    style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0.18, "CRSV" 0, "MONO" 0' }}
                  >
                    Active Programs
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {activePrograms.map(p => (
                      <PublicProgramCard key={p.id} program={p} variant="active" />
                    ))}
                  </div>
                </div>
              )}

              {upcomingPrograms.length > 0 && (
                <div>
                  <h2
                    className="text-hc-dark text-2xl font-bold mb-6"
                    style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0.18, "CRSV" 0, "MONO" 0' }}
                  >
                    Upcoming Programs
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {upcomingPrograms.map(p => (
                      <PublicProgramCard key={p.id} program={p} variant="upcoming" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cards section */}
        <section className="px-6 md:px-16 lg:px-24 pb-20">
          <h2
            className="text-hc-dark text-2xl font-bold text-center mb-8 opacity-95"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
          >
            Programs focused on:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  border: `1.5px solid ${card.borderColor}33`,
                  boxShadow: `0 4px 20px ${card.accentColor}18, 0 2px 6px rgba(0,0,0,0.06)`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${card.accentColor}18`, color: card.accentColor }}
                >
                  {card.icon}
                </div>

                <div>
                  <h3
                    className="font-heading text-hc-dark text-xl font-extrabold leading-snug"
                    style={{ fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed mt-2">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link
              href="/dashboard"
              className="bg-hc-red text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-red-600 transition-colors"
              style={{
                fontFamily: 'var(--font-recursive)',
                boxShadow: '0 4px 8px rgba(236,55,80,0.4)',
              }}
            >
              View Programs →
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
