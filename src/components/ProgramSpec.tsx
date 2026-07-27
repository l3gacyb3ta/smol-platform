'use client'

import Blank from './Blank'
import KeyColorPicker from './KeyColorPicker'
import { ROOT_DOMAIN } from '@/lib/constants'

/**
 * A program, written as the paragraph someone would say out loud.
 *
 * This replaced fourteen labelled fields in a stack. The parameters are the same
 * and so is the validation; what changed is that the software now states what it
 * is going to make, with the values as blanks in its own sentence, instead of
 * interrogating you field by field. Three things follow from that:
 *
 *  - it's an information graphic before it's a control — the resting state reads
 *    as a description of the program, so you can check it by reading it;
 *  - each blank takes its meaning from the words around it, so none of them needs
 *    a self-sufficient label, which is why a stack of fifteen labels became four
 *    sentences;
 *  - there is nothing to confirm *about the configuration*, so the only button on
 *    the page is the one that actually commits the record.
 *
 * The commit keeps its button on purpose. Feedback-loop tightness applies to
 * specifying context, not to executing consequences, and this one provisions a
 * Slack channel and a GitHub repo.
 */

export type Availability = 'idle' | 'checking' | 'available' | 'taken'

export interface SpecValues {
  name: string
  youShip: string
  weShip: string
  /** The whole sentence. Only edited directly in free-text mode. */
  description: string
  startDate: string
  endDate: string
  subdomain: string
  slackChannel: string
  keyColor: string
  githubUsername: string
}

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, '')

/**
 * Whether the address is free, said next to the address.
 *
 * The leading space lives in here rather than at the call site so that an idle
 * check leaves no gap — otherwise the sentence reads "…smol.hackclub.com , and".
 */
function AvailabilityNote({ state }: { state: Availability }) {
  if (state === 'idle') return null
  return (
    <>
      {' '}
      {state === 'checking' ? (
        <span className="state working">checking…</span>
      ) : state === 'available' ? (
        <span className="state state-clear">free</span>
      ) : (
        <span className="state state-attention">taken</span>
      )}
    </>
  )
}

export default function ProgramSpec({
  values,
  onChange,
  subdomainAvailability = 'idle',
  askGithub = false,
  freeText = false,
  onFreeText,
  freeTextNote,
}: {
  values: SpecValues
  onChange: (patch: Partial<SpecValues>) => void
  subdomainAvailability?: Availability
  /** The pitch form offers to add you to the repo; editing doesn't re-run that. */
  askGithub?: boolean
  /**
   * Programs pitched before the two blanks existed have descriptions that don't
   * split cleanly, so the sentence gives way to a plain textarea rather than
   * mangling what's already written.
   */
  freeText?: boolean
  onFreeText?: (on: boolean) => void
  freeTextNote?: string
}) {
  return (
    <div className="pitch-sentence">
      <p>
        This program is called{' '}
        <Blank
          label="Program name"
          value={values.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="Tea and Biscuits"
          required
        />
        .
      </p>

      {freeText ? (
        <label className="spec-field">
          Its pitch reads:
          <textarea
            rows={3}
            value={values.description}
            onChange={e => onChange({ description: e.target.value })}
            required
          />
          <span className="spec-note">
            {freeTextNote ?? 'Free text — this is what shows on the smol homepage.'}
            {onFreeText && (
              <>
                {' '}
                <button type="button" className="action action-quiet" onClick={() => onFreeText(false)}>
                  Use “You ship…, we ship…” instead
                </button>
              </>
            )}
          </span>
        </label>
      ) : (
        <p>
          You ship{' '}
          <Blank
            label="What people build"
            value={values.youShip}
            onChange={e => onChange({ youShip: e.target.value })}
            placeholder="a game under 13kb"
            required
          />
          , we ship{' '}
          <Blank
            label="What they get for it"
            value={values.weShip}
            onChange={e => onChange({ weShip: e.target.value })}
            placeholder="a handheld to play it on"
            required
          />
          .
          {onFreeText && (
            <span className="spec-note">
              This is the one line people read on the homepage. Keep both halves short.{' '}
              <button type="button" className="action action-quiet" onClick={() => onFreeText(true)}>
                Write it as free text
              </button>
            </span>
          )}
        </p>
      )}

      <p>
        It runs{' '}
        <Blank
          label="Start date"
          size="date"
          type="date"
          value={values.startDate}
          onChange={e => onChange({ startDate: e.target.value })}
          required
        />{' '}
        to{' '}
        <Blank
          label="End date"
          size="date"
          type="date"
          min={values.startDate || undefined}
          value={values.endDate}
          onChange={e => onChange({ endDate: e.target.value })}
          required
        />
        , lives at{' '}
        <Blank
          label="Website address"
          size="slug"
          value={values.subdomain}
          onChange={e => onChange({ subdomain: slug(e.target.value) })}
          placeholder="tea-and-biscuits"
          required
        />
        <code>.{ROOT_DOMAIN}</code>
        <AvailabilityNote state={subdomainAvailability} />, and talks in{' '}
        <code>#</code>
        <Blank
          label="Slack channel"
          size="slug"
          value={values.slackChannel}
          onChange={e => onChange({ slackChannel: slug(e.target.value) })}
          placeholder="tea-and-biscuits"
          required
        />
        .
      </p>

      <p>
        Its key colour is <KeyColorPicker value={values.keyColor} onChange={c => onChange({ keyColor: c })} />
        <span className="spec-note">
          Used to tell this program apart from the others at a glance. Pick from the strip or type
          any hex code.
        </span>
      </p>

      {askGithub && (
        <p>
          Add <code>github.com/</code>
          <Blank
            label="Your GitHub username"
            size="slug"
            value={values.githubUsername}
            onChange={e => onChange({ githubUsername: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
            placeholder="your-username"
          />{' '}
          as an admin on the repo.
          <span className="spec-note">
            Optional. Remembered on this device for next time — never sent anywhere but the repo
            we generate.
          </span>
        </p>
      )}
    </div>
  )
}
