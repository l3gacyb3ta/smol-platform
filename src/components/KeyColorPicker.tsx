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
 * The program's identity colour, picked by pointing at it.
 *
 * A colour lives in a strip of colours, not in a dropdown of names, so the
 * swatches abut into one band of the palette — the choice is "this one, not that
 * one", and abutting them is what makes that comparison possible. The hex field
 * beside it is the escape hatch, not the primary control.
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
    <span className="action-row">
      <span className="key-swatches" role="radiogroup" aria-label="Key colour presets">
        {KEY_COLORS.map(color => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value.toLowerCase() === color.toLowerCase()}
            aria-label={color}
            title={color}
            onClick={() => pickSwatch(color)}
            className="swatch"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>

      <input
        type="text"
        value={shown}
        onChange={e => handleHexChange(e.target.value)}
        onBlur={handleHexBlur}
        onFocus={e => e.currentTarget.select()}
        spellCheck={false}
        autoComplete="off"
        aria-label="Key colour hex code"
        aria-invalid={!draftIsValid}
        className="swatch-hex"
        style={{ borderLeft: `6px solid ${draftIsValid ? value : 'var(--attention-mark)'}` }}
      />
    </span>
  )
}
