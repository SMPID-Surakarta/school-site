import type { Role } from '$lib/rbac';
import type { DefaultSession } from '@auth/sveltekit';

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			id: string;
			role: Role;
		} & DefaultSession['user'];
	}

	interface User {
		role: Role;
	}
}

declare module '@auth/core/jwt' {
	interface JWT {
		id: string;
		role: Role;
	}
}

export {};
