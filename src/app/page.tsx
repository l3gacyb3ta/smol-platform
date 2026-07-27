import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import LoginButton from '@/components/LoginButton'
import Ledger from '@/components/Ledger'
import { AxisScale, RunBar } from '@/components/RunAxis'
import { getPrograms } from '@/lib/airtable'
import { formatDate, formatDateRange } from '@/lib/format'
import { programUrl } from '@/lib/constants'
import { parsePitch } from '@/lib/pitch'
import { buildAxis, countdown, dayNumber, todayNumber } from '@/lib/runwindow'
import { FORM_NUMBER, FORM_REVISION } from '@/lib/edition'
import type { Program } from '@/lib/types'
import { auth } from '@/auth'

/* ---------------------------------------------------------------------------
   The public sheet. Mode: placard.

   The job is to land in four seconds with a sixteen-year-old deciding whether
   this is worth their weekend. Their four questions are: what do I build, how
   long have I got, what do I get, is this for someone like me. All four are
   answered by the table, which is why the table starts immediately under the
   masthead instead of below three sections of persuasion.

   What used to be here: a hero with two buttons, then "Open right now" as a card
   grid, then "Starting soon" as a second card grid, then three cards of generic
   reasons to care. A card grid encodes "these are the same kind of thing", which
   is the one thing nobody needed to know. Both grids are now one table on one
   shared date axis, and the reasons to care are the rows.
   --------------------------------------------------------------------------- */

const STEPS = [
  {
    title: 'Pick one that you like',
    body: 'Each smol runs a few weeks, has a tight theme, and has a cool reward, no big shops.',
  },
  {
    title: 'Build it and ship it',
    body: 'Make your thing. Submit a link, your code, and a screenshot before the run closes.',
  },
  {
    title: 'Get the thing in the mail',
    body: 'Your submission will be reviewed asap. Once you are approved, your cool reward will be shipped right to you!',
  },
]

function ProgramRow({
  program,
  axis,
}: {
  program: Program
  axis: ReturnType<typeof buildAxis>
}) {
  const pitch = parsePitch(program.description)
  const when = countdown(program.startDate, program.endDate)
  const slackUrl = program.resources.slack

  return (
    <tr>
      {/* Identity, not state: this program's own colour, as a rule. */}
      <td className="program-key" style={{ backgroundColor: program.keyColor }} aria-hidden="true" />

      <td className="program-name" data-label="Program">
        <a href={programUrl(program.subdomain)} target="_blank" rel="noopener noreferrer">
          {program.name}
        </a>
      </td>

      {pitch ? (
        <>
          <td className="program-pitch" data-label="You ship">
            {pitch.youShip}
          </td>
          <td data-label="We ship">
            <strong>{pitch.weShip}</strong>
          </td>
        </>
      ) : (
        // Programs pitched before the two blanks existed keep their prose.
        <td className="program-pitch" colSpan={2} data-label="The pitch">
          {program.description}
        </td>
      )}

      <td>
        <RunBar axis={axis} startDate={program.startDate} endDate={program.endDate} />
      </td>

      {/* formatDateRange drops the repeated year — "Jul 1 – Aug 1, 2026" rather
          than "Jul 1, 2026 – Aug 1, 2026", which is five characters of column
          budget saved on every row for no loss of meaning. */}
      <td className="ledger-numeric" data-label="Runs">
        {formatDateRange(program.startDate, program.endDate) || 'open-ended'}
        <span className={`countdown${when.imminent ? ' countdown-soon' : ''}`}>{when.label}</span>
      </td>

      {/* No site column: the program's name already links to its site, and the
          full host was the widest thing in the table for information the reader
          already had. */}
      <td className="program-links" data-label="Talk in">
        {slackUrl ? (
          <a href={slackUrl} target="_blank" rel="noopener noreferrer">
            #{program.slackChannel}
          </a>
        ) : (
          <span className="tally">#{program.slackChannel}</span>
        )}
      </td>
    </tr>
  )
}

export default async function LandingPage() {
  const session = await auth()
  const now = new Date()
  const today = todayNumber(now)

  let listed: Program[] = []
  let openCount = 0
  let soonCount = 0
  let programsUnavailable = false

  try {
    const programs = await getPrograms()

    // Open now, and accepted-but-not-yet-started. These used to be two sections;
    // on one axis they are one question — "what can I start, and what's next".
    const open = programs.filter(p => p.status === 'active')
    const soon = programs.filter(p => p.status === 'accepted' && dayNumber(p.startDate) > today)

    openCount = open.length
    soonCount = soon.length

    // Closing soonest first, because that's the one with a deadline attached;
    // then the next thing to land.
    listed = [
      ...open.sort((a, b) => dayNumber(a.endDate) - dayNumber(b.endDate)),
      ...soon.sort((a, b) => dayNumber(a.startDate) - dayNumber(b.startDate)),
    ]
  } catch {
    // Airtable is down or misconfigured. The sheet still explains what smol is;
    // the table owns the apology.
    programsUnavailable = true
  }

  const axis = buildAxis(listed, now)

  return (
    <>
      <SiteHeader />

      <main>
        {/* ------------------------------------------------------------ Placard */}
        <div className="masthead">
          <div className="masthead-frame">
            <div className="masthead-strap">
              <span>A YOU SHIP WE SHIP META-PROGRAM RUN BY ARCADE AT HACK CLUB</span>
              <span>
                {FORM_NUMBER} · {FORM_REVISION}
              </span>
            </div>

            <h1 className="masthead-title">smol</h1>
            <hr className="masthead-rule" />
            {/* The programs are what's small, not the projects — see the note in
                opengraph-image.tsx. This line used to read "small build
                challenges", which claimed the opposite. */}
            <p className="masthead-line">Small programs. Specific rewards.</p>

            <p>
              Each smol is scrappy and short, asks for one particular thing, and pays out a reward
              picked to match it — no points, no generic shop. Free, run by teenagers at Hack Club,
              and you keep everything you make.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ Programs */}
        <div className="sheet">
          <section className="section" id="programs">
            <div className="section-head">
              <h2>Open and upcoming</h2>
              <span className="tally">
                {openCount} open · {soonCount} starting soon · today is {formatDate(now.toISOString())}
              </span>
            </div>

            {programsUnavailable ? (
              <p className="empty">
                The program list won&apos;t load right now — that&apos;s us, not you. Try again in a
                minute, or ask in the{' '}
                <a href="https://hackclub.com/slack/" target="_blank" rel="noopener noreferrer">
                  Hack Club Slack
                </a>
                , where someone always knows what&apos;s running.
              </p>
            ) : listed.length === 0 ? (
              <p className="empty">
                Nothing is open at this exact moment. New smols start all the time and get announced
                in Slack first, so{' '}
                <a href="https://hackclub.com/slack/" target="_blank" rel="noopener noreferrer">
                  join the Hack Club Slack
                </a>{' '}
                and you&apos;ll hear about the next one before it lands here.
              </p>
            ) : (
              <Ledger label="Open and upcoming programs" width="wide" stacked>
                {/* The column budget. Under fixed layout these widths hold
                    whatever the records say, so a wordy pitch can't reshape the
                    table. The two pitch columns get the most room because they
                    are what the reader came to compare. */}
                <colgroup>
                  <col style={{ width: '4px' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '21%' }} />
                  <col style={{ width: '21%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="program-key" aria-hidden="true" />
                    <th scope="col">Program</th>
                    <th scope="col">You ship</th>
                    <th scope="col">We ship</th>
                    <th scope="col" aria-label="Run window, on a shared date scale">
                      <AxisScale axis={axis} />
                    </th>
                    <th scope="col">Runs</th>
                    <th scope="col">Talk in</th>
                  </tr>
                </thead>
                <tbody>
                  {listed.map(program => (
                    <ProgramRow key={program.id} program={program} axis={axis} />
                  ))}
                </tbody>
              </Ledger>
            )}
          </section>

          {/* -------------------------------------------------------- How it works */}
          <section className="section">
            <div className="section-head">
              <h2>How it works</h2>
              <span className="tally">three steps, start to mailbox</span>
            </div>

            <ol className="steps">
              {STEPS.map(step => (
                <li key={step.title}>
                  <span>
                    <strong>{step.title}.</strong> {step.body}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* -------------------------------------------------------- Run your own */}
          <section className="section" id="run-your-own">
            <div className="section-head">
              <h2>Run one yourself</h2>
              <span className="tally">for organizers</span>
            </div>

            <p>
              Anyone in Hack Club can run a smol YSWS! Tell us the theme, the dates, and the
              reward, we at HQ will set up the Slack channel, the site, the repo, the submission form, and the
              finance account for you!
            </p>

            <div className="action-row">
              {session ? (
                <Link href="/programs/new" className="action action-strong">
                  Pitch a smol
                </Link>
              ) : (
                <LoginButton>Log in and pitch one</LoginButton>
              )}
              <span className="tally">Every pitch gets a quick review before it goes live.</span>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
