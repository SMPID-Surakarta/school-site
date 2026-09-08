import { asc, eq, notInArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { menus, type Menu } from '$lib/db/schema';

/** Menus repository — pure CRUD/query for the `menus` table. */

export async function list(): Promise<Menu[]> {
	return db.select().from(menus).orderBy(asc(menus.order), asc(menus.title));
}

/** Visible menu items for the public navigation. */
export async function listVisible(): Promise<Menu[]> {
	return db
		.select()
		.from(menus)
		.where(eq(menus.visible, true))
		.orderBy(asc(menus.order), asc(menus.title));
}

export type MenuTreeChildInput = {
	id?: string;
	title: string;
	url: string;
	visible: boolean;
};

export type MenuTreeNodeInput = MenuTreeChildInput & {
	children: MenuTreeChildInput[];
};

/**
 * Replace the whole navigation tree in one transaction: rows with a known id
 * are updated, rows without id are inserted, rows missing from the payload
 * are deleted. Order/parentId are derived from the tree position.
 */
export async function saveTree(nodes: MenuTreeNodeInput[]): Promise<void> {
	await db.transaction(async (tx) => {
		const keepIds: string[] = [];

		async function upsert(
			node: MenuTreeChildInput,
			parentId: string | null,
			order: number
		): Promise<string> {
			const values = { title: node.title, url: node.url, parentId, order, visible: node.visible };
			if (node.id) {
				const [updated] = await tx
					.update(menus)
					.set(values)
					.where(eq(menus.id, node.id))
					.returning({ id: menus.id });
				if (updated) return updated.id;
			}
			const [inserted] = await tx.insert(menus).values(values).returning({ id: menus.id });
			return inserted.id;
		}

		for (const [i, node] of nodes.entries()) {
			const parentDbId = await upsert(node, null, i);
			keepIds.push(parentDbId);
			for (const [j, child] of node.children.entries()) {
				keepIds.push(await upsert(child, parentDbId, j));
			}
		}

		if (keepIds.length > 0) {
			await tx.delete(menus).where(notInArray(menus.id, keepIds));
		} else {
			await tx.delete(menus);
		}
	});
}
