import Navbar from '@/components/Navbar'
import Link from 'next/link'

const FEATURE_CARDS = [
  {
    title: 'Learning something new',
    description: 'Learn new software, new hardware, or just a new way to make a project!',
    accentColor: '#5bc0de',
    borderColor: '#5bc0de',
  },
  {
    title: 'Engaging community',
    description: "Meet other builders, share what you're making, and get help when you need it.",
    accentColor: '#e5e7eb',
    borderColor: '#e5e7eb',
  },
  {
    title: 'Cool rewards',
    description: "Don't just get another 3D Printer. Get something made specifically for this program.",
    accentColor: '#ec3750',
    borderColor: '#ec3750',
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
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0.5, "MONO" 0' }}
          >
            A You Ship We Ship project
          </div>

          <h1
            className="font-heading text-hc-dark leading-none tracking-tight"
            style={{
              fontSize: 'clamp(80px, 18vw, 220px)',
              fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0',
              textShadow: '0 0 4px rgba(0,0,0,0.25)',
            }}
          >
            Smol
          </h1>

          <p
            className="text-hc-dark text-lg font-semibold opacity-90"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0, "CRSV" 0.5, "MONO" 0' }}
          >
            Small YSWSs, big fun
          </p>
        </section>

        {/* Cards section */}
        <section className="px-6 md:px-16 lg:px-24 pb-20">
          <h2
            className="text-hc-dark text-2xl font-bold text-center mb-8 opacity-95"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 0.18, "CRSV" 0, "MONO" 0' }}
          >
            Programs focused on:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  border: `2px solid ${card.borderColor}`,
                  boxShadow: '0 18px 20px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div>
                  <div
                    className="h-1.5 rounded-full w-full mb-2"
                    style={{ backgroundColor: card.accentColor }}
                  />
                  <h3
                    className="font-heading text-hc-dark text-xl font-extrabold"
                    style={{ fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0' }}
                  >
                    {card.title}
                  </h3>
                </div>

                <div
                  className="rounded-xl h-44 w-full"
                  style={{ backgroundColor: `${card.accentColor}22` }}
                />

                <p className="text-hc-dark text-sm font-medium leading-relaxed opacity-85">
                  {card.description}
                </p>
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
