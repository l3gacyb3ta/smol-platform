import Navbar from '@/components/Navbar'
import Link from 'next/link'

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

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="public" />

      <main className="flex-1 grid-bg">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center min-h-[480px]">
          <div
            className="bg-hc-red text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0, "MONO" 0' }}
          >
            A You Ship We Ship project
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
        </section>

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
