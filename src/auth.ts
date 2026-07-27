import NextAuth from 'next-auth'
import { isAdmin } from '@/lib/permissions'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      slackId?: string
      verificationStatus?: string
      /**
       * Whether this person is on the admin allowlist.
       *
       * **Display only.** Every route and page still calls `isAdmin(slackId)`
       * server-side before doing anything admin-gated; this exists so the UI can
       * *say* which role you're in rather than making you infer it from which
       * buttons failed to appear. Never authorize against it — it rides in a
       * session the client can read.
       */
      isAdmin?: boolean
    }
  }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: 'hackclub',
      name: 'Hack Club',
      type: 'oidc',
      issuer: 'https://auth.hackclub.com',
      clientId: process.env.HACKCLUB_CLIENT_ID,
      clientSecret: process.env.HACKCLUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email slack_id verification_status',
        },
      },
    },
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        const p = profile as Record<string, unknown>
        token['slackId'] = p.slack_id as string | undefined
        token['verificationStatus'] = p.verification_status as string | undefined
      }
      return token
    },
    session({ session, token }) {
      const slackId = token['slackId'] as string | undefined
      session.user.slackId = slackId
      session.user.verificationStatus = token['verificationStatus'] as string | undefined
      // Derived here rather than stored in the JWT: this callback runs on every
      // session read, so editing ADMIN_SLACK_IDS takes effect immediately instead
      // of waiting for everyone's token to age out. Display only — see above.
      session.user.isAdmin = isAdmin(slackId)
      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
