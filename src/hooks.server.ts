import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from '$lib/server/auth';
import type { Role } from '$lib/rbac';

/** Admin sections that require a specific minimum role (server-side enforcement). */
const ADMIN_ONLY_PREFIXES = [
	'/admin/users',
	'/admin/settings',
	'/admin/landing-page',
	'/admin/menu',
	'/admin/banner'
];
const EDITOR_OR_ADMIN_PREFIXES = ['/admin/contacts'];

const authorization: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/admin')) {
		const session = await event.locals.auth();

		if (!session?.user) {
			throw redirect(303, `/login?redirectTo=${encodeURIComponent(pathname)}`);
		}

		const role = session.user.role as Role;

		if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && role !== 'ADMIN') {
			throw redirect(303, '/admin');
		}

		if (
			EDITOR_OR_ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) &&
			role !== 'ADMIN' &&
			role !== 'EDITOR'
		) {
			throw redirect(303, '/admin');
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandle, authorization);
