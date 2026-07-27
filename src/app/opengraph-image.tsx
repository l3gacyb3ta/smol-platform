import { ImageResponse } from 'next/og'
import { FORM_NUMBER, FORM_REVISION } from '@/lib/edition'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'smol — small programs, specific rewards'

/**
 * Link preview card, mostly for Slack unfurls. Same placard as the homepage
 * masthead: a red field, one white keyline frame inside it, the rule sitting
 * inside the type block rather than around it, and the form number in the corner.
 *
 * The copy says "small programs", not "small projects", and that distinction is
 * the whole point of the card. `smol` reads as a claim about what you build,
 * which is backwards: your project can be as ambitious as you like. What's small
 * is the *program* — a few weeks, one tight theme, one reward picked to match it,
 * rather than a months-long thing with a points shop at the end.
 *
 * It also doesn't spend a line on getting something in the mail. This unfurls in
 * the Hack Club Slack, where that part of You Ship We Ship is already understood;
 * the words are better spent on what makes a smol different from the others.
 *
 * Satori only supports flexbox and a subset of CSS, and only ships one font
 * weight — so this leans on scale and the frame for impact rather than bold type,
 * which would silently fall back to regular. No radii and no gradients here for
 * the same reason they're absent from the stylesheet.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#ec3750',
          color: '#ffffff',
          padding: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            border: '2px solid #ffffff',
            padding: '34px 48px 40px',
          }}
        >
          {/* The strap: who made it, on the left; which form, on the right. */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 26,
              letterSpacing: '0.08em',
              borderBottom: '2px solid #ffffff',
              paddingBottom: 16,
            }}
          >
            <div style={{ display: 'flex' }}>HACK CLUB · YOU SHIP WE SHIP</div>
            <div style={{ display: 'flex' }}>
              {FORM_NUMBER} · {FORM_REVISION}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 230,
              lineHeight: 1,
              letterSpacing: '-12px',
              marginTop: 18,
            }}
          >
            smol
          </div>

          {/* The separator lives between the wordmark and the strapline — inside
              the type block, which is what makes it read as a placard. */}
          <div
            style={{ display: 'flex', width: 300, height: 6, backgroundColor: '#ffffff', marginTop: 14 }}
          />

          <div style={{ display: 'flex', fontSize: 46, letterSpacing: '0.02em', marginTop: 20 }}>
            SMALL PROGRAMS. SPECIFIC REWARDS.
          </div>

          <div style={{ display: 'flex', fontSize: 32, marginTop: 'auto', maxWidth: 940 }}>
            Scrappy, short, and pointed at one particular thing to build — with a reward picked to
            match it. No points, no generic shop.
          </div>
        </div>
      </div>
    ),
    size
  )
}
