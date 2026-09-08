import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/repositories/menus.repository');
vi.mock('$lib/server/repositories/pages.repository');

import * as menusRepo from '$lib/server/repositories/menus.repository';
import * as pagesRepo from '$lib/server/repositories/pages.repository';
import * as menusService from '$lib/server/services/menus.service';
import type { Menu } from '$lib/db/schema';

const ADMIN = { id: 'admin-1', role: 'ADMIN' as const };
const EDITOR = { id: 'editor-1', role: 'EDITOR' as const };
const STAFF = { id: 'staff-1', role: 'STAFF' as const };

function row(partial: Partial<Menu> & Pick<Menu, 'id' | 'title' | 'url'>): Menu {
	return { parentId: null, order: 0, visible: true, ...partial };
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe('menus.service.getMenuTree', () => {
	it('rejects non-ADMIN roles', async () => {
		await expect(menusService.getMenuTree(EDITOR)).rejects.toMatchObject({ code: 'FORBIDDEN' });
		await expect(menusService.getMenuTree(STAFF)).rejects.toMatchObject({ code: 'FORBIDDEN' });
		expect(menusRepo.list).not.toHaveBeenCalled();
	});

	it('groups children under their parent and keeps repo order', async () => {
		vi.mocked(menusRepo.list).mockResolvedValue([
			row({ id: 'a', title: 'Profil', url: '/profil' }),
			row({ id: 'b', title: 'Berita', url: '/berita', order: 1 }),
			row({ id: 'a1', title: 'Visi Misi', url: '/visi-misi', parentId: 'a', visible: false })
		]);

		const tree = await menusService.getMenuTree(ADMIN);
		expect(tree).toEqual([
			{
				id: 'a',
				title: 'Profil',
				url: '/profil',
				visible: true,
				children: [{ id: 'a1', title: 'Visi Misi', url: '/visi-misi', visible: false }]
			},
			{ id: 'b', title: 'Berita', url: '/berita', visible: true, children: [] }
		]);
	});

	it('promotes orphaned children (missing parent) to top level', async () => {
		vi.mocked(menusRepo.list).mockResolvedValue([
			row({ id: 'x', title: 'Yatim', url: '/yatim', parentId: 'hilang' })
		]);

		const tree = await menusService.getMenuTree(ADMIN);
		expect(tree).toEqual([{ id: 'x', title: 'Yatim', url: '/yatim', visible: true, children: [] }]);
	});
});

describe('menus.service.saveMenuTree', () => {
	const input = {
		items: [
			{
				id: undefined,
				title: 'Profil',
				url: '/profil',
				visible: true,
				children: [{ id: 'c1', title: 'Sejarah', url: '/sejarah', visible: true }]
			}
		]
	};

	it('rejects non-ADMIN roles', async () => {
		await expect(menusService.saveMenuTree(EDITOR, input)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(menusRepo.saveTree).not.toHaveBeenCalled();
	});

	it('passes the normalized tree to the repository', async () => {
		await menusService.saveMenuTree(ADMIN, input);
		expect(menusRepo.saveTree).toHaveBeenCalledWith([
			{
				id: undefined,
				title: 'Profil',
				url: '/profil',
				visible: true,
				children: [{ id: 'c1', title: 'Sejarah', url: '/sejarah', visible: true }]
			}
		]);
	});
});

describe('menus.service.listPageLinks', () => {
	it('rejects non-ADMIN roles', async () => {
		await expect(menusService.listPageLinks(STAFF)).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('maps published pages to nav links', async () => {
		vi.mocked(pagesRepo.listPublished).mockResolvedValue([
			{ title: 'PPDB', slug: 'ppdb' } as never
		]);
		await expect(menusService.listPageLinks(ADMIN)).resolves.toEqual([
			{ title: 'PPDB', url: '/ppdb' }
		]);
	});
});
