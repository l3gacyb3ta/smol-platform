# smol

The platform behind [smol.hackclub.com](https://smol.hackclub.com) — small
[You Ship We Ship](https://ysws.hackclub.com) programs from Hack Club. Someone
pitches a tiny build challenge, we spin up everything it needs, and teenagers who
ship get something real in the mail.

Two audiences, one app:

- **Builders** land on the public homepage to see which programs are open.
- **Organizers** log in with their Hack Club account to pitch a program, watch it
  get provisioned, and review the submissions that come in.

## Running it locally

```bash
yarn install
cp .env.example .env.local   # then fill it in
yarn dev
```

Open [localhost:3000](http://localhost:3000). Everything except the homepage
requires a Hack Club login, so you'll need real OIDC credentials to get past the
front door.

```bash
yarn build   # production build
yarn lint    # eslint
```

## Environment

Every value lives in `.env.local`; see `.env.example` for the full list.

| Variable | What it's for |
| --- | --- |
| `HACKCLUB_CLIENT_ID` / `HACKCLUB_CLIENT_SECRET` | Hack Club OIDC app, registered at [auth.hackclub.com](https://auth.hackclub.com) |
| `AUTH_SECRET` | NextAuth session signing — `openssl rand -hex 32` |
| `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` | Airtable is the datastore |
| `AIRTABLE_TABLE_NAME` | Programs table, defaults to `Programs` |
| `AIRTABLE_SUBMISSIONS_TABLE` | Submissions table, defaults to `Submissions` |
| `AIRTABLE_ARI_DELIVERIES_TABLE` | Durable Ari delivery-ID table, defaults to `Ari Deliveries` |
| `ARI_PROGRAM_ID` | The single Ari program that reviews platform submissions |
| `ARI_INGEST_SECRET` | Ari inbound signing secret used to send ships |
| `ARI_WEBHOOK_SECRET` | Separate Ari outbound signing secret used to verify decisions |
| `ARI_BASE_URL` | Optional Ari endpoint override; defaults to `https://webhooks.ari.hackclub.com` |
| `SLACK_BOT_TOKEN` | Bot token with `channels:manage` for creating/archiving channels |
| `SLACK_CHANNEL_CREATION` | Set to `enabled` to let spin-up create real channels. Off by default — see below |
| `GITHUB_TOKEN` | Fine-grained PAT that can generate repos in the `hackclub-smol` org |
| `ADMIN_SLACK_IDS` | Comma-separated Slack user IDs who can accept and review programs. The site header states which role you're signed in as, so you can tell without reading this file |
| `NEXT_PUBLIC_BUILD_REV` | Optional. The build shown in the footer's edition line; falls back to the host's own SHA variable, then to `dev` |

## How a program gets made

1. **Pitch** — an organizer fills in `/programs/new`. The program lands in
   Airtable as `pending`.
2. **Review** — an admin (someone in `ADMIN_SLACK_IDS`) accepts it from the
   program page and picks a software or hardware template. Status becomes
   `accepted`.
3. **Spin-up** — `/programs/[id]/creating` polls
   `GET /api/programs/[id]/status`, which advances the steps below.

   | Step | Waiting on | How it happens |
   | --- | --- | --- |
   | Slack channel | the server | Real API call, but only when `SLACK_CHANNEL_CREATION=enabled` |
   | GitHub repo | the server | `hackclub-smol/smol-<subdomain>`, generated from the chosen template, `smol.json` written, organizer added as admin |
   | DNS | a human | By hand. Done once an admin records the URL on the program page |
   | HCB org | a human | By hand. Same — recording the URL marks it done |
   | Unified database + Fillout form | a timer | **Still simulated.** These report progress on a timer; nothing is actually created yet |

   Those three owners — `the server`, `a human, by hand`, `nothing — not built yet`
   — live in `lib/provisioning.ts`, and both the spin-up log and the program page's
   provisioning table read them from there. Keep that list in step with this route:
   a stale description is how the two screens once ended up disagreeing about
   whether the simulated resources were done or overdue.

   The simulated resources can never be "recorded", so the provisioning table
   marks them `simulated` and counts progress against the four that can — a
   finished program reads `4 of 4 recorded · 2 simulated`, not `4 of 6`.

   **The organizer doesn't wait for the whole run.** `GET /api/programs/[id]/status`
   returns `repoUrl` as soon as the repo exists — four steps before the run reports
   done — and the page turns into a handover at that point: the clone line, a link
   to the repo, and a note that pushing works now and DNS only decides when the
   site goes public. Nothing after the GitHub step blocks writing the site.

4. **Live** — an Airtable automation flips the program to `active` on its start
   date, which is when it appears on the public homepage.
5. **Submissions** — entries arrive in the Submissions table and are sent to Ari from
   `/programs/[id]/submissions`. Ari is the review authority: its signed decisions
   update Airtable back to approved, changes requested, or rejected. Contact details
   are stripped for non-admins.

## Ari reviews

Ari is configured for one platform-wide Ari program in this branch. In Ari Settings →
Webhooks, set the outbound destination to `https://<your-host>/api/webhooks/ari` and
copy its outbound secret to `ARI_WEBHOOK_SECRET`; this is distinct from the ingest
secret the platform uses to send ships.

Before enabling the action, add these fields to the **Submissions** Airtable table:
`Project Title`, `Slack ID`, `Ari Ship ID`, `Ari Version`, `Ari Phase`, `Ari Decision`,
`Ari Submitted At`, `Ari Last Event At`, `Ari Review Minutes`, and `Ari Review Note`.
Also create an **Ari Deliveries** table with `Delivery ID`, `Ship ID`, `External ID`,
`Event`, and `Received At`. Delivery IDs are recorded so retries cannot apply a review
more than once.

`Send to Ari` requires an email, canonical Slack user ID, project title, description,
public GitHub repository URL, demo URL, screenshot, and a Hackatime project key (or
legacy Hackatime project URL). The platform sends the Airtable record ID as Ari's
`external_id`; it never sends shipping address, phone, birthday, or internal notes.
Ari webhook signatures are checked against the raw request bytes, a five-minute
replay window, and a durable delivery record before any review state is changed.

### Two things to know before trusting the spin-up screen

- **Slack channel creation is off by default.** With `SLACK_CHANNEL_CREATION`
  unset, the step is labelled "Slack channel (created by an admin)" and someone
  makes the channel by hand. Turning it on means every accepted program creates a
  real channel in the Hack Club workspace.
- **The unified-database and Fillout steps are fake.** They advance on a timer to
  fill out the flow. Wire them to real integrations before treating a "done"
  spin-up as complete.

## Layout

```
src/
  app/
    page.tsx                    public homepage
    dashboard/                  program list (auth required)
    programs/new/               pitch form
    programs/[id]/              detail, edit, spin-up log, submissions
    api/                        route handlers
    error.tsx, not-found.tsx    error boundaries
    icon.svg, opengraph-image.tsx, robots.ts, sitemap.ts
  components/
    SiteHeader, SiteFooter      the whole of the chrome — mark, role, All programs
    Ledger                      a table of records, in its scroll box
    ProgramSpec, Blank          the pitch form, written as an editable sentence
    RunAxis                     the shared date scale and one run plotted on it
    StateMark                   a record's state, said as a word
    KeyColorPicker, Wordmark
  lib/
    airtable.ts                 programs
    airtable-submissions.ts     submissions + PII stripping
    permissions.ts              admin allowlist, per-program access
    slack.ts                    channel create/archive
    provisioning.ts             the six resources, and who owns each
    runwindow.ts                run windows, countdowns, the shared date axis
    edition.ts                  the form number and build in every footer
    format.ts, constants.ts     dates, palette, domains
  auth.ts                       NextAuth + Hack Club OIDC
  proxy.ts                      redirects anonymous users away from private routes
```

## Styling

One hand-written stylesheet, `src/app/globals.css`. No framework, no utility
classes, no webfonts — body text is the system sans stack at 16px/1.5.

Every class is a noun from the problem domain: `.program-name`, `.run-bar`,
`.submission-table`, `.spinup-step`, `.shipping-details`. Reach for an existing
noun before adding one, and if you need a new one, name the *thing* rather than
the shape — `.reviewer-note`, never `.info-box`.

The house rules, all of which are load-bearing rather than taste:

- every table is `table-layout: fixed` with its own `<colgroup>`, and goes through
  the `Ledger` component — that's what gives it a scroll box whose hatched edge
  appears only when there is content off-screen. Adding a column means
  re-dividing that table's colgroup
- a flex or grid container is a `div` or a `span`, **never** a `td`, `th` or `tr`.
  A flexed cell stops being a table cell and its border draws at its own content
  height instead of the row's — see `DESIGN-NOTES.md` §12
- no `box-shadow`, no `border-radius`, no gradient used as a fill
- no colour that doesn't name a category. There are exactly three —
  `--attention` (a human must act), `--clear` (resolved), `--hold` (parked on
  purpose) — plus each program's own key colour, which is identity and never
  state. Where you'd want a fourth, use one of the `--hatch` textures
- states are a *word* first; colour and texture are redundant encodings on top
- links are underlined, and hover is an instant inverted block with no transition
- every page states its own edition in the footer — see `src/lib/edition.ts`

Two compositions share those tokens: **placard** for the public homepage (lands
in four seconds), **instrument** for everything behind the login (dense, tabular,
declines to be a phone site — `.instrument` sets a min-width and the page pans).

`DESIGN-NOTES.md` records why each screen is shaped the way it is: the questions
each one answers, the interaction budget, what got inferred instead of asked, and
what was deliberately cut.

## Stack

Next.js 16 (App Router) · React 19 · NextAuth v5 · Airtable · one CSS file

> Heads up: this repo tracks a Next.js version with breaking changes from what you
> may be used to. The bundled docs in `node_modules/next/dist/docs/` are the source
> of truth — for example, error boundaries take `unstable_retry`, not `reset`.
