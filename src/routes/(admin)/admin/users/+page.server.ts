import { type Role } from '$lib/rbac';
import * as usersService from '$lib/server/services/users.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const role = user.role as Role;

	const users = await usersService.listUsers(role);

	return { users, currentUserId: user.id };
};
