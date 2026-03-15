import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const demoPassword = process.env.AUTH_DEMO_PASSWORD || process.env.NEXTAUTH_SECRET
        if (demoPassword && credentials.password === demoPassword) {
          let user = await db.user.findUnique({ where: { email: credentials.email } })
          if (!user) {
            user = await db.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
              },
            })
          }
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
