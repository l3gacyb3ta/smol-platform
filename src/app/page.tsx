import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LoginButton from '@/components/LoginButton'
import { ProgramCard } from '@/components/ProgramCard'
import { CalendarIcon, GiftIcon, LightbulbIcon, UsersIcon } from '@/components/Icons'
import { getPrograms } from '@/lib/airtable'
import { formatDate } from '@/lib/format'
import { programHost, programUrl } from '@/lib/constants'
import type { Program } from '@/lib/types'
import { auth } from '@/auth'

const STEPS = [
  {
    title: 'Pick a program',
    body: 'Each smol program runs for a few weeks with its own theme, and its own reward.',
    color: '#5bc0de',
  },
  {
    title: 'Build and ship it',
    body: 'Make your thing, then submit it with a link and a screenshot before the deadline closes.',
    color: '#7950f2',
  },
  {
    title: 'Get the goods',
    body: 'A real person reads every submission. Once you are approved, your reward goes in the mail.',
    color: '#ec3750',
  },
]

const PERKS = [
  {
    icon: <LightbulbIcon size={26} />,
    title: 'Learn something new',
    body: 'A new language, a new corner of the internet. Every program is an excuse to try something you haven\'t yet!',
    color: '#5bc0de',
  },
  {
    icon: <UsersIcon size={26} />,
    title: 'Build with other people',
    body: 'Every program has a slack channel, and someone who cares. Post progress, ask for help, watch what everyone else is making.',
    color: '#7950f2',
  },
  {
    icon: <GiftIcon size={26} />,
    title: 'Rewards worth wanting',
    body: 'Not another generic shop. Each smol has a reward chosen specifically for the thing it asks you to build.',
    color: '#ec3750',
  },
]

function PublicProgramCard({ program, variant }: { program: Program; variant: 'open' | 'soon' }) {
  const slackUrl = program.resources.slack
  const dateLabel =
    variant === 'open'
      ? program.endDate
        ? `Closes ${formatDate(program.endDate)}`
        : 'Open-ended'
      : `Opens ${formatDate(program.startDate)}`

  return (
    <ProgramCard
      program={program}
      badge={
        <span className={`badge ${variant === 'open' ? 'badge-green' : 'badge-blue'}`}>
          {variant === 'open' ? 'Open now' : 'Starting soon'}
        </span>
      }
    >
      <div className="mt-auto flex flex-col gap-3">
        <div className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          {dateLabel}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={programUrl(program.subdomain)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm text-white"
            style={{ backgroundColor: program.keyColor }}
          >
            {programHost(program.subdomain)} ↗
          </a>
          {slackUrl ? (
            <a
              href={slackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost"
            >
              #{program.slackChannel}
            </a>
          ) : (
            <span className="btn btn-sm btn-ghost cursor-default opacity-70">
              #{program.slackChannel}
            </span>
          )}
        </div>
      </div>
    </ProgramCard>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-widest text-hc-red uppercase">{eyebrow}</span>
      <h2 className="font-display text-2xl font-bold text-hc-dark sm:text-3xl">{title}</h2>
    </div>
  )
}

export default async function LandingPage() {
  const session = await auth()
  const today = new Date().toISOString().split('T')[0]

  let openPrograms: Program[] = []
  let soonPrograms: Program[] = []
  let programsUnavailable = false

  try {
    const programs = await getPrograms()
    openPrograms = programs.filter(p => p.status === 'active')
    soonPrograms = programs.filter(p => p.status === 'accepted' && p.startDate > today)
  } catch {
    // Airtable is down or misconfigured. The page still explains what smol is;
    // the programs section owns the apology.
    programsUnavailable = true
  }

  const openCount = openPrograms.length

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar variant="public" />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- Hero */}
        <section className="grid-bg hero-glow border-b border-gray-200/70">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 py-16 text-center sm:py-20">
            <span className="font-heading rounded-2xl bg-hc-red px-4 py-2 text-xs font-bold text-white shadow-md sm:rounded-full">
              A You Ship We Ship project, run by Arcade Wise at Hack Club
            </span>

            <h1
              className="font-display leading-none font-extrabold text-hc-dark"
              style={{ fontSize: 'clamp(76px, 15vw, 146px)', letterSpacing: '-0.045em' }}
            >
              smol
            </h1>

            <p className="max-w-xl text-lg leading-relaxed font-medium text-gray-600 sm:text-xl">
              Small build challenges with real rewards. Ship a tiny project, and we
              ship you something you actually want.
            </p>

            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <a href="#programs" className="btn btn-primary btn-lg">
                See what&apos;s open
              </a>
              {session ? (
                <Link href="/dashboard" className="btn btn-secondary btn-lg">
                  Go to your dashboard
                </Link>
              ) : (
                <a href="#run-your-own" className="btn btn-secondary btn-lg">
                  Run your own
                </a>
              )}
            </div>

            {openCount > 0 && (
              <p className="text-sm font-semibold text-gray-400">
                {openCount} {openCount === 1 ? 'program' : 'programs'} accepting
                submissions right now
              </p>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------ Programs */}
        <section id="programs" className="scroll-mt-20 border-b border-gray-200/70 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <SectionHeading eyebrow="Programs" title="Open right now" />

            {programsUnavailable ? (
              <div className="card p-8 text-center">
                <p className="text-sm font-semibold text-gray-600">
                  We can&apos;t load the program list right now.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try again in a minute — or ask in the Hack Club Slack, someone
                  there always knows what&apos;s running.
                </p>
              </div>
            ) : openPrograms.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {openPrograms.map(p => (
                  <PublicProgramCard key={p.id} program={p} variant="open" />
                ))}
              </div>
            ) : (
              <div className="card flex flex-col items-center gap-3 p-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <CalendarIcon size={24} />
                </span>
                <p className="font-display text-lg font-bold text-hc-dark">
                  Nothing open at this exact moment
                </p>
                <p className="max-w-md text-sm leading-relaxed text-gray-500">
                  New smols start all the time, and they are usually announced in
                  Slack first. Hop in and you&apos;ll hear about the next one before
                  it lands here.
                </p>
                <a
                  href="https://hackclub.com/slack/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-1"
                >
                  Join the Hack Club Slack
                </a>
              </div>
            )}

            {soonPrograms.length > 0 && (
              <div className="mt-14">
                <SectionHeading eyebrow="Coming up" title="Starting soon" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {soonPrograms.map(p => (
                    <PublicProgramCard key={p.id} program={p} variant="soon" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --------------------------------------------------------- How it works */}
        <section className="grid-bg border-b border-gray-200/70">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <SectionHeading eyebrow="How it works" title="Three steps, start to mailbox" />

            <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className="font-heading flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
                    style={{ backgroundColor: step.color }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg leading-snug font-bold text-hc-dark">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------------ Why smol */}
        <section className="border-b border-gray-200/70 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <SectionHeading eyebrow="Why bother" title="What every smol gives you" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PERKS.map(perk => (
                <div
                  key={perk.title}
                  className="card flex flex-col gap-4 p-6"
                  style={{
                    borderColor: `${perk.color}33`,
                    boxShadow: `0 1px 2px rgba(17,24,39,0.04), 0 6px 20px ${perk.color}14`,
                  }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${perk.color}1a`, color: perk.color }}
                  >
                    {perk.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-xl leading-snug font-extrabold text-hc-dark">
                      {perk.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{perk.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Run your own */}
        <section id="run-your-own" className="grid-bg scroll-mt-20">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <span className="text-xs font-bold tracking-widest text-hc-red uppercase">
              For organizers
            </span>
            <h2 className="font-display mt-2 text-2xl font-bold text-hc-dark sm:text-3xl">
              Got an idea for a smol?
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-gray-600">
              Anyone in the Hack Club Slack can run one. Tell us the theme, the
              dates, and the reward — we&apos;ll set up the Slack channel, the
              site, the repo, the submission form, and the finance account. You
              just run the program.
            </p>
            <div className="mt-7 flex justify-center">
              {session ? (
                <Link href="/programs/new" className="btn btn-primary btn-lg">
                  Start a smol
                </Link>
              ) : (
                <LoginButton>Log in and pitch one</LoginButton>
              )}
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Programs go through a quick review before they go live.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
