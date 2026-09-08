import { z } from 'zod';

const menuItemBase = {
	id: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	title: z.string().trim().min(1, 'Judul wajib diisi').max(120),
	url: z.string().trim().min(1, 'URL wajib diisi').max(300),
	visible: z.boolean().default(true)
};

/** Submenu item (one level deep, like a WordPress dropdown). */
export const menuChildSchema = z.object(menuItemBase);
export type MenuChildInput = z.infer<typeof menuChildSchema>;

/** Top-level menu item with optional dropdown children. */
export const menuNodeSchema = z.object({
	...menuItemBase,
	children: z.array(menuChildSchema).max(20).default([])
});
export type MenuNodeInput = z.infer<typeof menuNodeSchema>;

/** Whole navigation tree, saved in one submit (WordPress-style "Save Menu"). */
export const saveMenuTreeSchema = z.object({
	items: z.array(menuNodeSchema).max(30).default([])
});
export type SaveMenuTreeInput = z.infer<typeof saveMenuTreeSchema>;
