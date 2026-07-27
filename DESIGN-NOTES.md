# Lab notes — UI rebuild

Built with `magic-ink` (what appears, what the user must do) and
`arcade-house-style` (tokens, prohibitions, naming).

## Mode selection

Two modes, split on the auth boundary, because the two surfaces have genuinely
different jobs:

| routes | mode | job |
| --- | --- | --- |
| `/` | **placard** | land in four seconds on a teenager deciding about their weekend |
| everything behind login | **instrument** | dense operational data; an organizer working for an hour |

The house style says to read exactly one mode per build. This is a deliberate
exception, taken on a route boundary rather than for mood: the skill's own
examples name "a YSWS landing page" as placard and "a submissions review UI" as
instrument, and this repo is both. The token layer (§4 invariants, prohibitions)
is shared; only composition differs.

## 1. Classification

**Information software**, both surfaces, wearing manipulation software's clothes.

- The homepage looks like a marketing site; it is a catalog someone compares
  options in.
- The submissions queue looks like a tool for flipping approval flags; it is a
  tool for understanding what got submitted. The flag flip is one click at the
  end of a long look.
- The pitch and edit forms are the only genuine manipulation surfaces — they
  write an external artifact. They keep their affordances and their Submit
  button (a real commit deserves a real button).

## 2. The questions

**Public homepage** — a sixteen-year-old, on a phone, deciding:

1. What do I actually have to build?
2. What do I get for it?
3. When does it close — do I have time before then?
4. If nothing suits me now, when's the next one?
5. Where do other people doing this hang out?
6. Is this a real thing or a landing page for a thing?

**Dashboard** — an organizer or admin, arriving cold:

1. Which of these is waiting on *me*, and for how long has it been waiting?
2. What's live right now?
3. What's mid-spin-up, and is any of it stuck?
4. Which ones haven't started yet, and in what order do they land?

**Submissions queue** — a reviewer, forty rows deep:

1. Is this project real, or a template with the name changed?
2. Did they put the hours in that Hackatime says they did?
3. Did they give me enough to check — a live link, code, a screenshot?
4. How does this one compare to the last five I approved?
5. Which ones still need me?

**Program detail** — someone mid-provision:

1. What still isn't provisioned, and is it on a machine or on a human?
2. Where do I go to do the thing (Slack, repo, site, HCB)?
3. Who pitched this and can I reach them?

## 3. The decisions

- Homepage → **which smol do I start this weekend** (or: none of them, join the
  Slack and wait for the next).
- Dashboard → **which program do I open next**.
- Submissions → **approve, approve with fewer hours, or reject** — per row.
- Program detail → **which provisioning gap do I go close**.

## 4. Data space and winnowing

| surface | full set | what cuts it down |
| --- | --- | --- |
| homepage | every program record | `status = active`, plus `accepted` with a future start. Both land on **one shared time axis** instead of two card grids |
| dashboard | every program the viewer may see | server-side permission filter; then *ordered* needs-you-first rather than filtered |
| submissions | every submission for the program's Slack channel | default view is `Pending` (a prediction, correctable); PII stripped for non-admins |

## 5. Design moves made

**Two card grids → one shared time axis.** The homepage used to group programs
into "Open right now" and "Starting soon", each an equal-card grid. A card grid
encodes "these are the same kind of thing", which is not what anyone needed to
know. Both sets now sit on one horizontal date axis with today marked, so "what
can I start now", "which closes soonest", and "what's next" are one glance
instead of two sections and a subtraction. Open runs read as solid bars, future
runs as hatched — texture, not a second hue.

**Status pill → the signal underneath it** (patterns.md §11). `In review` became
`in review · 3 days`. The age is what drives the decision; the threshold was
throwing it away. Same on submissions: `Approved` now carries the hour count
that was approved.

**Hour counts → hour bars.** A submission's Hackatime total was a number you had
to compare across rows from memory. It's now a bar scaled to the largest total in
the set, with the adjusted count drawn as a shorter bar inside it. Comparison
happens by eye, and an adjustment is visible as a gap rather than an arrow in
prose.

**Card grid → table**, on every instrument surface. Cell padding `2px 6px`; forty
rows fit. To compare two submissions you now move your eye, not your memory.

**Pitch form → one editable sentence** (patterns.md §4). The form was
fourteen labelled fields plus a two-blank pitch line. The whole spec is now a
paragraph the software says back to you, with the parameters as blanks:

> You ship **a game under 13kb**, we ship **a handheld to play it on**.
> It runs **2026-08-01** to **2026-08-22**, lives at **tea-and-biscuits**.smol.hackclub.com,
> and talks in #**tea-and-biscuits**.

Same fields, same validation, same Submit. It reads as a description of the
program rather than an interrogation, and the parameters take their meaning from
the words around them instead of needing self-sufficient labels.

**Persistent chrome → chrome on approach** (patterns.md §12). Row actions
(edit, delete) appear on row hover *and* on keyboard focus within the row. State
is never hidden — only actions.

**Modal → inline.** The delete confirmation was a modal with a backdrop blur.
Instrument mode has no modals; it's now an inline confirm row on the thing being
deleted.

## 6. Amnesia test — what the interface made you tell it

| asked for | now inferred from | correction path |
| --- | --- | --- |
| start date | **environment** — next Monday | it's a date input, type over it |
| end date | **environment** — three weeks after start, and it tracks the start date until you touch it | same |
| GitHub username | **history** — last one used, kept in `localStorage` on this device only | the field, prefilled |
| Slack channel, subdomain | already derived from the program name (kept) | edit either, auto-fill stops |
| "which submissions matter" | **prediction** — opens on the pending queue | tab row |

History lives in the browser's own storage, never on a server. That's the only
honest way to do history-based inference, and it's faster.

## 7. Interaction budget

| journey | before | after | where the saving came from |
| --- | --- | --- | --- |
| cold homepage → decide on a program | 1 click (anchor) + scroll + read a card; comparing two programs meant scrolling between cards | **0 clicks** to decide, 1 to leave for the program site | graphics — the deciding data (build, reward, days left, run window) is in the row |
| cold homepage → know when the next program lands | not answerable without reading every "Starting soon" card | **0 clicks** | graphics — one shared axis |
| pitch a program, all fields | ~14 field visits, 2 of which are typed twice | **~9**, two of them prefilled predictions | environment (dates) + history (GitHub handle) |
| review one submission | 2 clicks minimum to see enough to judge (thumbnail, Hackatime), then 1 to decide | **0 clicks** to judge, 1 to decide | graphics — shot, hour bar, and link presence all in the row |
| dashboard → find what's waiting on me | read every badge | **0 clicks**, top of the table | arrangement — ordered by who's waiting, with the wait length shown |

## 8. What did I flatten?

- **Hackatime hours** is still one number per submission. It hides the *shape* —
  ten hours in one night reads very differently from ten hours across three
  weeks, and that's exactly the "is this real" question. The endpoint only
  returns `total_seconds`, so the shape isn't available without more calls per
  row. The bar makes magnitudes comparable; the distribution is still missing and
  this is the largest remaining gap in the design.
- **Spin-up progress** shows `3 of 6` as a fill-fraction glyph, but each step
  also states its own status and who owns it, so the fraction isn't standing in
  for anything.
- **Dashboard has no pending-submission count per program.** It would be the
  single most useful column and it needs one Airtable call per row. Not
  fabricated, not fetched — noted.

## 9. What got cut, and why

- **The hero section** — centered headline, two buttons. Replaced by a placard
  masthead and, immediately beneath it, the actual program table. The first
  frame now contains information rather than an invitation to scroll.
- **"What every smol gives you"** — three cards of generic reasons (learn
  something, meet people, nice rewards). None of it was specific to any program,
  and the program rows now answer "is this for someone like me" with what you
  build and what you get. One three-line block survives in its place.
- **Both webfonts** (Recursive, Plus Jakarta Sans). Prohibited for body text, and
  two fewer network requests on a bad connection.
- **Tailwind**, entirely. Utility classes make the markup the stylesheet, which
  destroys the domain-noun naming the rest of the style depends on. The whole
  app is now ~40 named classes in one hand-written sheet.
- **Every `box-shadow`, every `border-radius`, both radial-gradient glows, the
  backdrop blur, the skeleton pulse, the spin animation on the loading state.**
- **The modal.**

## 10. Polish pass — table shape and overflow

The first cut got the information design right and the table *mechanics* wrong.
Three faults, all with the same root: nothing declared how wide anything should
be, so content decided, differently on every page.

**Auto layout → `table-layout: fixed` plus a `<colgroup>` per table.** Under auto
layout the longest cell in a column sets that column's width, so one verbose
pitch or one long hostname reshaped the whole table and squeezed the dates into
two ragged lines. Every ledger now declares its own column budget and holds it
whatever the records say. Adding a column means re-dividing that budget — that's
the intended cost, and it's cheaper than an unpredictable table.

**Thirteen `white-space: nowrap` declarations → four.** Each one was quietly
overriding the column budget: a cell that can't wrap makes its column as wide as
its longest line or spills over the rule. The four that remain are short fixed
labels — an `Aug` axis tick, `no hackatime`, a shipping-detail row label, a button.
Everything else wraps, and `overflow-wrap: break-word` on the table means a long
identifier can never overhang its cell.

**Two redundant columns removed rather than squeezed.** The widest cell in both
program tables was the full host, `tea-and-biscuits.smol.hackclub.com` — 34
characters for information the reader already had, since the program's name links
to its site. It's gone from both. The dashboard now shows the channel alone, and
*whether the channel is a link* is itself the provisioning signal.

**`formatDateRange` instead of two `formatDate` calls.** The helper already
existed and collapses the repeated year — `Jul 1 – Aug 1, 2026` rather than
`Jul 1, 2026 – Aug 1, 2026`. Rebuilding by hand had regressed it, at five
characters of column budget per row for no gain.

**Nested tables need their own fixed layout.** The shipping-details table sits
inside a table cell; on auto layout it sized to its longest value and pushed a
postal address straight out of the column. Fixed layout, a narrow label column,
wrapping values — and the Shipper column widened so the expanded address isn't
punished for existing.

### Making the scroll visible

A table too wide for the sheet used to drag the whole page sideways with no
indication there was more to see. Both halves of that are fixed:

- Every ledger sits in a `.ledger-scroll` box, so the page body never scrolls
  horizontally — the table scrolls where it stands.
- The box shows a **hatched edge on whichever side has content off-screen**, and
  hides it when you reach that end. It's four background layers and no script:
  two flat-paper covers on `background-attachment: local` scroll with the content,
  two hatch markers on `scroll` stay pinned to the container, so the covers hide
  the markers exactly when there's nothing more that way. A shadow would have been
  the conventional answer and is prohibited; the hatch is the sanctioned texture
  channel doing the same job, and it reads as a torn edge.
- The box is focusable and named, because a scrollable region needs a keyboard
  path.

`.instrument` **lost its `min-width: 860px`.** Panning the whole page plus
scrolling each table meant two scrollbars for one problem. The page reflows
normally now, everything that isn't a table fits at any width, and the tables
scroll individually. The instrument still refuses to pretend to be a phone — it
just refuses less destructively.

**The public table stacks at 860px, not 620px.** That's where its six columns
stop fitting, which is the honest threshold — below it, one stacked record per
program with each cell naming itself via `data-label`. Between 620 and 860 the
old build left the table cramped and horizontally scrolling on the one surface
that should never do that.

## 11. The spin-up page, second pass

Three changes, and the third is a behaviour change rather than a visual one.

**The progress bar moved into the log's `<tfoot>`.** It had been floating loose
under the table at a 300px `max-width`, orphaned from the thing it summarised — a
stray widget rather than a total. A ledger's total belongs in the ledger's own
foot, on the far side of a heavier rule, so it reads as the sum of the rows above
it. The count and the bar now share that row, and the bar flexes to fill it.

**"Done by" became "Waiting on".** The old heading answered a question nobody
had: it named an actor even for steps that had already finished. The useful
reading is what a row is *blocked on*, so the column now says `a human, by hand`,
`the server`, `a timer — not built yet`, or `—` for anything done. That tells a
reader whether to wait or go chase someone, which is the actual decision this page
leads to. The two simulated steps admit it in the same breath.

**The page hands over as soon as there is a repo.** This one is the real find:
spin-up has always written the repo URL to Airtable the moment it creates the
repo, but the status endpoint never returned it, so the page couldn't say so. It
now returns `repoUrl` on every response, and the page turns into a handover four
steps before the run finishes — the clone line with a copy button, a link to the
repo, and a note that pushing works now and DNS only decides when the site goes
*public*.

That is the same interaction-budget question as everywhere else in this rebuild,
just pointed at time instead of clicks: the creator was being made to wait for
information the server already had. Nothing after the GitHub step blocks writing
the site, so nothing after the GitHub step should have been blocking the person.
The handover sits *above* the log, because once it exists it is the most
actionable thing on the page and the log becomes reference.

A bug fell out of it. The provisioning table displayed the repo as
`hackclub-smol/<subdomain>`, but spin-up creates `smol-<subdomain>` — so the one
identifier a creator would have tried to clone was wrong. Both now go through
`programRepoSlug` in `lib/constants.ts`, along with the four hardcoded
`hackclub-smol` strings in the status route.

## 12. Never flex a table cell

Worth its own heading, because it was invisible until someone looked at a border
and it had been wrong in three places.

`display: flex` on a `<td>` stops it being a table cell. The table wraps it in an
anonymous cell, and the td's own border and background then draw around the flex
box at *its* content height rather than stretching to the row — so the bottom
border floats above the rest of the row's. It showed up first on the "Talk in"
column, where the cell holds one short link and the height gap is largest, but
`.evidence` and `.review-actions` had it too.

Two fixes, depending on what the cell actually needed:

- **Stacking only** (`.program-links`, `.evidence`): the cell stays a cell and its
  children become blocks. `width: fit-content` on them is a bonus — the inverted
  hover block now hugs the link text instead of spanning the whole column, which
  is what flex's default `align-items: stretch` had been doing.
- **Genuine gap control** (`.review-actions`, wrapping buttons): the flex moves to
  a `<span>` *inside* the cell.

`.program-links` was designed to stack two links; it holds one now that the
redundant site URL is gone, so the flex column had nothing left to do anyway.

Rule for future edits: **a flex or grid container is a `div` or a `span`, never a
`td`, `th`, or `tr`.** There is a check for this — see the audit in §13.

## 13. Your own role

There was no way to tell whether you were an admin. `isAdmin()` is server-only —
`ADMIN_SLACK_IDS` isn't `NEXT_PUBLIC_` — and the session carried `slackId` and
`verificationStatus` but no role, so nothing in the UI said it.

Admin status decides four things: accepting a pitch, archiving the Slack channel,
recording a by-hand resource URL, and seeing a submitter's shipping details. All
four were discoverable only by noticing a control that *hadn't* appeared. The one
positive statement anywhere was on the submissions page, and it only rendered when
you weren't an admin.

Inferring your own permissions from absent buttons is the same failure this rebuild
has been correcting everywhere else, so:

- `session.user.isAdmin` is computed in the NextAuth `session()` callback, which
  runs on every session read — so it's derived per request rather than baked into
  the JWT, and editing `ADMIN_SLACK_IDS` takes effect immediately instead of
  waiting for everyone's token to age out.
- **It is display only.** Every route and page still calls `isAdmin(slackId)`
  server-side before doing anything gated. This rides in a session the client can
  read; it must never become the authorization source, and that's written on the
  type.
- The site header states the role on every page — `admin` or `organizer` — in a
  keyline box rather than a colour, because a role isn't one of the three states
  in the legend. The word does the work. The header previously hardcoded
  `organizer` on every logged-in page, which labelled the *route*, not the person.
- Its counterpart: a pending program used to show a reviewer the accept button and
  everyone else nothing at all, so a non-admin's page went quiet about the one
  thing holding their program up. It now states the same wait to the person who is
  actually waiting.

## 14. Three kinds of owner, not two

The provisioning table showed **Airtable** and **Submission form** as `not yet
recorded` in attention red — on every program, forever, including fully live ones.
Meanwhile the spin-up log two clicks away reported the same two steps `done`. The
two screens were contradicting each other about the same two things.

Both were wrong in the same way. Those steps are the simulated ones: they advance
on a timer and **nothing is created**, so no URL is ever written and the row can
never be recorded. The table only knew two categories — a hardcoded
`MANUAL_RESOURCE_KEYS` set, and "everything else is spin-up" — so the simulated
pair fell into the spin-up bucket and got dressed as work in progress. Two
consequences, both misleading:

- attention red means *a human has to act*, and no human action will ever clear
  those rows. It needs platform work, not program work.
- `provisioned of 6` could never exceed 4, so a fully provisioned program read
  "4 of 6" and looked permanently half-finished.

Fixed by giving ownership three values rather than two — `server`, `human`,
`unbuilt` — and putting them in `lib/provisioning.ts`, which **both** screens now
read. The simulated rows are hatched with `row-void` and marked `simulated`,
because they're inert: not a thing anyone can act on for this program. Progress
counts against the four that can actually be recorded, and the header states the
other two: `4 of 4 recorded · 2 simulated`.

The root cause was two sources of truth for one set of facts. The spin-up log had
already been taught about the simulated steps in §11; the provisioning table
hadn't, and nothing connected them. `lib/provisioning.ts` holds the resource key
and the step id side by side — they don't match, `domain` is recorded against the
`dns` step — so neither screen has to remember the mapping.

That list *describes* what the status route does; the route is what does it. Its
docblock says so, and says to update it when a step moves — a stale description is
how this happened.

## 15. The way back

Getting to the program list from anywhere logged-in was harder than it should
have been, in two compounding ways.

**The header link was on the wrong pages.** "Your programs" only rendered when
`variant === 'public'` — so on the dashboard, a program page, a submissions queue,
a spin-up log or either form, the header offered no route to the list at all. The
crumbs were the only way, and they only step up one level: from a submissions
queue you got `← {program name}`, then another crumb, so two hops.

**The wordmark was a hidden mode.** It pointed at `/dashboard` on instrument
routes and `/` on the public one. That did make the list one click — but silently,
and the same element went somewhere different depending on where you already were.
Navigation you have to discover by trying it isn't navigation.

Now: the wordmark always means home, and **All programs** is a labelled action
next to your name, on every page except the dashboard itself — a link to the page
you're on is noise, and it's the one place the button can't usefully go. Two
destinations, both stated, one click each.

That left `variant` deciding nothing — the role chip had already moved to
`session &&` in §13 — so the prop came out of the component and its seven call
sites rather than lingering as an argument with no effect.

## 16. Accessibility

Magic Ink is silent on this and the omission is real. Anything carried by
position, texture, or colour has a text equivalent in the same row:

- Run bars are decorative; the dates and "closes in 18 days" are literal text.
- Hour bars sit beside the numeral.
- State is a word (`in review`, `approved`) before it is a colour or a texture.
- The hatch that marks rejected/future rows is `aria-hidden` ornament over text
  that already says so.
- Hover-revealed row actions are equally revealed by `:focus-within`, so the
  keyboard path never differs from the mouse path.
- Every table is a real `<table>` with `<th scope>`; the page survives its
  stylesheet being switched off, which is the house test anyway.
