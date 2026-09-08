import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Route protection is enforced in hooks.server.ts; session is guaranteed here.
	const session = await event.locals.auth();
	return { user: session?.user };
};
