/**
 * Role-Based Access Control — single source of truth for the PRD §6 matrix.
 *
 * Lives in shared `$lib` (no server-only imports) so the server can *enforce* it and
 * the client can *reuse* it purely for UX hiding. Enforcement MUST always happen
 * server-side (services / route `load` / actions).
 */

export type Role = 'ADMIN' | 'EDITOR' | 'STAFF';

export type Resource =
	| 'users'
	| 'settings'
	| 'menus'
	| 'banners'
	| 'posts'
	| 'teachers'
	| 'achievements'
	| 'galleries'
	| 'agendas'
	| 'downloads'
	| 'faqs'
	| 'pages'
	| 'contacts'
	| 'media';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'reply' | 'upload';

/** Resources managed by ADMIN + EDITOR (CRUD), read-only for STAFF. */
const CONTENT_RESOURCES: Resource[] = [
	'teachers',
	'achievements',
	'galleries',
	'agendas',
	'downloads',
	'faqs',
	'pages'
];

/** Context for ownership-sensitive checks (EDITOR on `posts` / `media`). */
export type AccessContext = {
	/** Id of the acting user. */
	userId?: string;
	/** Id of the resource owner (post author / media uploader), when applicable. */
	ownerId?: string | null;
};

/**
 * Returns whether `role` may perform `action` on `resource`.
 * Ownership-sensitive rules require `ctx.userId` and `ctx.ownerId`.
 */
export function can(
	role: Role,
	action: Action,
	resource: Resource,
	ctx: AccessContext = {}
): boolean {
	// ── ADMIN-only resources: users, settings, menus, banners ──────────────────
	if (
		resource === 'users' ||
		resource === 'settings' ||
		resource === 'menus' ||
		resource === 'banners'
	) {
		return role === 'ADMIN';
	}

	// ── Posts ──────────────────────────────────────────────────────────────────
	if (resource === 'posts') {
		if (action === 'read') return true; // ADMIN/EDITOR/STAFF may read
		if (role === 'ADMIN') return action !== 'reply' && action !== 'upload';
		if (role === 'EDITOR') {
			// CRUD own + publish own (no ADMIN approval needed).
			if (action === 'create') return true;
			if (action === 'update' || action === 'delete' || action === 'publish') {
				return isOwner(ctx);
			}
			return false;
		}
		return false; // STAFF read-only (handled above)
	}

	// ── Content resources: ADMIN + EDITOR CRUD, STAFF read-only ─────────────────
	if (CONTENT_RESOURCES.includes(resource)) {
		if (action === 'read') return true;
		return role === 'ADMIN' || role === 'EDITOR';
	}

	// ── Contacts: ADMIN + EDITOR read/reply, STAFF none ─────────────────────────
	if (resource === 'contacts') {
		if (action === 'read' || action === 'reply') {
			return role === 'ADMIN' || role === 'EDITOR';
		}
		return false;
	}

	// ── Media: ADMIN CRUD; EDITOR upload + delete own; STAFF none ────────────────
	if (resource === 'media') {
		if (role === 'ADMIN') return true;
		if (role === 'EDITOR') {
			if (action === 'upload' || action === 'create' || action === 'read') return true;
			if (action === 'delete') return isOwner(ctx);
			return false;
		}
		return false;
	}

	return false;
}

function isOwner(ctx: AccessContext): boolean {
	return Boolean(ctx.userId && ctx.ownerId && ctx.userId === ctx.ownerId);
}
