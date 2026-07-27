'use client'

import { useState } from 'react'
import { KEY_COLORS } from '@/lib/constants'

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Expands #abc to #aabbcc so stored values are always six digits. */
function normalize(hex: string) {
  const body = hex.slice(1)
  const full =
    body.length === 3
      ? body
          .split('')
          .map(c => c + c)
          .join('')
      : body
  return `#${full.toLowerCase()}`
}

/**
 * Swatch row for picking a program's key colour, plus an editable hex field for
 * anything outside the palette. Shared by the create and edit forms.
 */
export default function KeyColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  // `null` means "showing the committed value". Set while the field is being
  // typed in, so a half-finished hex isn't fighting the canonical value.
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? value.toUpperCase()
  // An empty field mid-retype isn't an error, just unfinished.
  const draftIsValid = draft === null || draft === '#' || HEX_RE.test(draft)

  function handleHexChange(raw: string) {
    // Keep a single leading # and hex digits only, capped at #rrggbb.
    const cleaned = '#' + raw.replace(/[^0-9a-f]/gi, '').slice(0, 6)
    setDraft(cleaned.toUpperCase())
    // Only commit complete six-digit codes while typing. A three-digit code is
    // ambiguous here — "#20c" is also the first half of "#20c997", so treating
    // it as final would flash #2200cc at the third keystroke.
    if (/^#[0-9a-f]{6}$/i.test(cleaned)) onChange(cleaned.toLowerCase())
  }

  function handleHexBlur() {
    // Shorthand is only unambiguous once the field is done being edited.
    if (draft && HEX_RE.test(draft)) onChange(normalize(draft))
    setDraft(null)
  }

  function pickSwatch(color: string) {
    setDraft(null)
    onChange(color)
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="field-label">Key color</span>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Key color presets">
          {KEY_COLORS.map(color => {
            const selected = value.toLowerCase() === color.toLowerCase()
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={color}
                title={color}
                onClick={() => pickSwatch(color)}
                className="h-8 w-8 cursor-pointer rounded-lg transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  boxShadow: selected ? `0 0 0 3px #fff, 0 0 0 5px ${color}` : undefined,
                }}
              />
            )
          })}
        </div>

        <div className="hidden h-8 w-px bg-gray-200 sm:block" />

        <div
          className={`flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 transition-shadow focus-within:border-transparent focus-within:ring-2 ${
            draftIsValid ? 'border-gray-200 focus-within:ring-hc-red' : 'border-rose-300 focus-within:ring-rose-400'
          }`}
        >
          <span
            className="h-4 w-4 shrink-0 rounded border border-black/10"
            style={{ backgroundColor: value }}
          />
          <input
            type="text"
            value={shown}
            onChange={e => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            onFocus={e => e.currentTarget.select()}
            spellCheck={false}
            autoComplete="off"
            aria-label="Key color hex code"
            aria-invalid={!draftIsValid}
            className="w-20 bg-transparent font-mono text-sm font-medium text-gray-700 uppercase outline-none"
          />
        </div>
      </div>
      <p className="field-hint">
        Pick one above, or type any hex code you like.
      </p>
    </div>
  )
}
