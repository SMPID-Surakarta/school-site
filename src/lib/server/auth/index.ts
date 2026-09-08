import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import { accounts, sessions, users, verificationTokens } from '$lib/db/schema';
import { env } from '$lib/server/env';
import { authenticate } from '$lib/server/services/users.service';
import type { Role } from '$lib/rbac';

const config: SvelteKitAuthConfig = {
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	}),
	secret: env.AUTH_SECRET,
	trustHost: true,
	// Credentials provider requires stateless JWT sessions in Auth.js.
	session: { strategy: 'jwt' },
	pages: { signIn: '/login' },
	providers: [
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				const email = typeof credentials?.email === 'string' ? credentials.email : '';
				const password = typeof credentials?.password === 'string' ? credentials.password : '';
				if (!email || !password) return null;

				const user = await authenticate(email, password);
				if (!user) return null;

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					role: user.role
				};
			}
		})
	],
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id as string;
				token.role = (user as { role: Role }).role;
			}
			return token;
		},
		session({ session, token }) {
			if (session.user) {
				session.user.id = token.id;
				session.user.role = token.role;
			}
			return session;
		}
	}
};

export const { handle, signIn, signOut } = SvelteKitAuth(config);
