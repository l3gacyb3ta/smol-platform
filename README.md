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
| `SLACK_BOT_TOKEN` | Bot token with `channels:manage` for creating/archiving channels |
| `SLACK_CHANNEL_CREATION` | Set to `enabled` to let spin-up create real channels. Off by default — see below |
| `GITHUB_TOKEN` | Fine-grained PAT that can generate repos in the `hackclub-smol` org |
| `ADMIN_SLACK_IDS` | Comma-separated Slack user IDs who can accept and review programs |

## How a program gets made

1. **Pitch** — an organizer fills in `/programs/new`. The program lands in
   Airtable as `pending`.
2. **Review** — an admin (someone in `ADMIN_SLACK_IDS`) accepts it from the
   program page and picks a software or hardware template. Status becomes
   `accepted`.
3. **Spin-up** — `/programs/[id]/creating` polls
   `GET /api/programs/[id]/status`, which advances the steps below.

   | Step | How it happens |
   | --- | --- |
   | Slack channel | Real API call, but only when `SLACK_CHANNEL_CREATION=enabled` |
   | GitHub repo | Generated from the chosen template, `smol.json` written, organizer added as admin |
   | DNS | By hand. Done once an admin records the URL on the program page |
   | HCB org | By hand. Same — recording the URL marks it done |
   | Unified database + Fillout form | **Still simulated.** These steps report progress on a timer; nothing is actually created yet |

4. **Live** — an Airtable automation flips the program to `active` on its start
   date, which is when it appears on the public homepage.
5. **Submissions** — entries arrive in the Submissions table and get reviewed at
   `/programs/[id]/submissions`. Reviewers can approve, reject, or approve with an
   adjusted hour count. Contact details are stripped for non-admins.

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
  components/                   Navbar, Footer, ProgramCard, StatusBadge, Icons…
  lib/
    airtable.ts                 programs
    airtable-submissions.ts     submissions + PII stripping
    permissions.ts              admin allowlist, per-program access
    slack.ts                    channel create/archive
    format.ts, constants.ts     dates, palette, domains
  auth.ts                       NextAuth + Hack Club OIDC
  proxy.ts                      redirects anonymous users away from private routes
```

Styling is Tailwind v4. Shared type styles, buttons, cards, inputs, and badges are
defined once as component classes in `src/app/globals.css` — reach for
`.btn-primary`, `.card`, `.input`, `.badge-green`, `.font-display` and friends
rather than re-deriving them inline.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · NextAuth v5 · Airtable

> Heads up: this repo tracks a Next.js version with breaking changes from what you
> may be used to. The bundled docs in `node_modules/next/dist/docs/` are the source
> of truth — for example, error boundaries take `unstable_retry`, not `reset`.
