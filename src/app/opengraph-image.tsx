import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'smol — small build challenges, real rewards'

/**
 * Link preview card, mostly for Slack unfurls.
 *
 * Satori only supports flexbox and a subset of CSS, and only ships one font
 * weight — so this leans on a solid brand-red field and scale for impact rather
 * than bold type, which would silently fall back to regular.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ec3750',
          color: '#ffffff',
          padding: '70px',
        }}
      >
        <div
          style={{
            display: 'flex',
            border: '2px solid rgba(255,255,255,0.55)',
            borderRadius: 999,
            padding: '12px 30px',
            fontSize: 27,
            letterSpacing: '0.02em',
          }}
        >
          A You Ship We Ship project from Hack Club
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 250,
            lineHeight: 1,
            letterSpacing: '-10px',
            marginTop: 26,
          }}
        >
          smol
        </div>

        <div
          style={{
            display: 'flex',
            width: 90,
            height: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.6)',
            marginTop: 34,
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: 40,
            marginTop: 34,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Ship a tiny project. We ship you something real.
        </div>
      </div>
    ),
    size
  )
}
