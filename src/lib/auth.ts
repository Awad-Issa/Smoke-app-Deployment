import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Login attempt:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              supermarket: true
            }
          })

          if (!user) {
            console.log('❌ User not found:', credentials.email);
            console.log('📋 Available users in database:');
            const allUsers = await prisma.user.findMany({
              where: { role: 'SUPERMARKET' },
              select: { email: true, role: true, supermarket: { select: { name: true, status: true } } }
            })
            allUsers.forEach(u => {
              console.log(`   📧 ${u.email} | ${u.role} | Market: ${u.supermarket?.name} (${u.supermarket?.status})`)
            })
            return null
          }

          console.log('✅ User found:', user.email, user.role);
          console.log('🏪 Associated supermarket:', user.supermarket?.name, user.supermarket?.status);

          // Check if supermarket user's market is active
          if (user.role === 'SUPERMARKET' && user.supermarket) {
            if (user.supermarket.status !== 'ACTIVE') {
              console.log('❌ Supermarket account is deactivated:', user.supermarket.name);
              return null
            }
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', credentials.email);
            console.log('🔍 Password length in DB:', user.password.length);
            return null
          }

          console.log('✅ Login successful for:', user.email);
          
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            supermarketId: user.supermarketId || undefined,
            supermarketName: user.supermarket?.name
          }
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.supermarketId = user.supermarketId
        token.supermarketName = user.supermarketName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.supermarketId = token.supermarketId as string
        session.user.supermarketName = token.supermarketName as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  }
}
