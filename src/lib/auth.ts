import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { db } from './db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      try {
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, user.email))
        if (existing.length === 0) {
          await db.insert(users).values({
            id: createId(),
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          })
        }
        return true
      } catch (error) {
        console.error('[auth] signIn error', error)
        return false
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const [row] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, user.email))
          if (row) token.dbUserId = row.id
        } catch (error) {
          console.error('[auth] jwt error', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.dbUserId && typeof token.dbUserId === 'string') {
        session.user.id = token.dbUserId
      }
      return session
    },
  },
})
