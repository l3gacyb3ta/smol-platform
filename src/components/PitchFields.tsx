'use client'

/**
 * The pitch, written as the sentence people actually read:
 * "You ship ___, we ship ___!". Shared by the pitch and edit forms.
 */
export default function PitchFields({
  youShip,
  weShip,
  onYouShipChange,
  onWeShipChange,
  hint = 'The one-liner people read on the smol homepage. Keep both halves short.',
  action,
}: {
  youShip: string
  weShip: string
  onYouShipChange: (value: string) => void
  onWeShipChange: (value: string) => void
  hint?: string
  /** Optional control rendered beside the hint, e.g. a mode toggle. */
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">The pitch</span>

      {/* No horizontal gap: the punctuation has to hug the inputs, so spacing
          lives on the word spans instead. */}
      <div className="flex flex-wrap items-center gap-y-2 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-sm font-semibold text-gray-600">
        <span className="mr-2">You ship</span>
        <input
          type="text"
          className="input-blank"
          placeholder="a game under 13kb"
          aria-label="What people build"
          value={youShip}
          onChange={e => onYouShipChange(e.target.value)}
          required
        />
        <span className="mr-2">, we ship</span>
        <input
          type="text"
          className="input-blank"
          placeholder="a handheld to play it on"
          aria-label="What they get for it"
          value={weShip}
          onChange={e => onWeShipChange(e.target.value)}
          required
        />
        <span>!</span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="field-hint">{hint}</p>
        {action}
      </div>
    </div>
  )
}
