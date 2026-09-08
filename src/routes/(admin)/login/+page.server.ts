import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/server/validators/auth';
import { signIn as authSignIn } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	if (session?.user) redirect(303, '/admin');

	return {
		form: await superValidate(zod4(loginSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod4(loginSchema));
		if (!form.valid) return fail(400, { form });

		const redirectTo = event.url.searchParams.get('redirectTo') ?? '/admin';

		// Hand the validated credentials to Auth.js. It sets the session cookie and
		// throws a redirect on success, or redirects back to /login?error=... on failure.
		const headers = new Headers(event.request.headers);
		headers.set('content-type', 'application/x-www-form-urlencoded');
		headers.delete('content-length');

		const body = new URLSearchParams({
			providerId: 'credentials',
			email: form.data.email,
			password: form.data.password,
			redirectTo
		});

		const request = new Request(event.request.url, { method: 'POST', headers, body });
		return authSignIn({ ...event, request });
	}
};
