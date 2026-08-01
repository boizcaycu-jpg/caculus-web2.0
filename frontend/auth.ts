import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/db';
import { comparePassword } from '@/lib/auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        // 1. Check Admin accounts
        if (
          (email === 'admin@caculus.edu.vn' || email === 'admin') &&
          (password === 'admin123' || password === process.env.ADMIN_PASSWORD)
        ) {
          return {
            id: 'user-admin-1',
            email: 'admin@caculus.edu.vn',
            name: 'Quản trị viên 1',
            role: 'admin',
            studentId: 'ADMIN-001',
            isVip: true,
          };
        }

        if (
          email === 'admin2@caculus.edu.vn' &&
          (password === 'admin123' || password === process.env.ADMIN_PASSWORD)
        ) {
          return {
            id: 'user-admin-2',
            email: 'admin2@caculus.edu.vn',
            name: 'Quản trị viên 2',
            role: 'admin',
            studentId: 'ADMIN-002',
            isVip: true,
          };
        }

        // 2. Check Student accounts in DB
        const user = getUserByEmail(email);
        if (user) {
          const isValid =
            (password === 'student123' && (user.role === 'student' || !user.role)) ||
            (user.passwordHash ? await comparePassword(password, user.passwordHash) : false);

          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'student',
              studentId: user.studentId || ('CACULUS_' + String(user.id).slice(-6)),
              isVip: user.isVip ?? true,
            };
          }
        }

        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'student';
        token.studentId = (user as any).studentId || '';
        token.isVip = (user as any).isVip ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).studentId = token.studentId;
        (session.user as any).isVip = token.isVip;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'caculus_nextauth_secret_2026_super_secure',
});
