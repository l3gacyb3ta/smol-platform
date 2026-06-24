import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      slackId?: string
      verificationStatus?: string
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
      session.user.slackId = token['slackId'] as string | undefined
      session.user.verificationStatus = token['verificationStatus'] as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
