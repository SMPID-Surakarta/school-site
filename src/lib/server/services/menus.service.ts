import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as menusRepo from '$lib/server/repositories/menus.repository';
import * as pagesRepo from '$lib/server/repositories/pages.repository';
import type { SaveMenuTreeInput } from '$lib/server/validators/menus';
import type { NavLink } from '$lib/utils/navigation';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

export type MenuTreeChild = {
	id: string;
	title: string;
	url: string;
	visible: boolean;
};

export type MenuTreeNode = MenuTreeChild & { children: MenuTreeChild[] };

/** Full menu tree (including hidden items) for the admin builder. */
export async function getMenuTree(actor: Actor): Promise<MenuTreeNode[]> {
	if (!can(actor.role, 'read', 'menus')) throw AppError.forbidden();

	const rows = await menusRepo.list();
	const ids = new Set(rows.map((r) => r.id));
	const nodes: MenuTreeNode[] = [];
	const byId = new Map<string, MenuTreeNode>();

	// Rows are ordered by (order, title); orphans are promoted to top level.
	for (const row of rows) {
		if (row.parentId && ids.has(row.parentId)) continue;
		const node: MenuTreeNode = {
			id: row.id,
			title: row.title,
			url: row.url,
			visible: row.visible,
			children: []
		};
		byId.set(row.id, node);
		nodes.push(node);
	}
	for (const row of rows) {
		if (!row.parentId) continue;
		const parent = byId.get(row.parentId);
		if (!parent) continue;
		parent.children.push({ id: row.id, title: row.title, url: row.url, visible: row.visible });
	}
	return nodes;
}

/** Replace the whole navigation tree (WordPress-style "Save Menu"). */
export async function saveMenuTree(actor: Actor, input: SaveMenuTreeInput): Promise<void> {
	if (!can(actor.role, 'update', 'menus')) throw AppError.forbidden();

	await menusRepo.saveTree(
		input.items.map((item) => ({
			id: item.id,
			title: item.title,
			url: item.url,
			visible: item.visible,
			children: item.children.map((child) => ({
				id: child.id,
				title: child.title,
				url: child.url,
				visible: child.visible
			}))
		}))
	);
}

/** Published CMS pages offered as quick links in the menu builder. */
export async function listPageLinks(actor: Actor): Promise<NavLink[]> {
	if (!can(actor.role, 'read', 'menus')) throw AppError.forbidden();
	const pages = await pagesRepo.listPublished();
	return pages.map((p) => ({ title: p.title, url: `/${p.slug}` }));
}
