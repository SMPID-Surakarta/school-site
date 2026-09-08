/**
 * Shared navigation helpers — safe for client and server imports.
 * Default items are used as fallback on the public site when the `menus`
 * table is empty, and as prefill/suggestions in the admin menu builder.
 */

export type NavLink = { title: string; url: string };
export type NavItem = NavLink & { children: NavLink[] };

/** Default navigation (every public navigation link is editable in the admin). */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
	{ title: 'Beranda', url: '/', children: [] },
	{ title: 'Berita', url: '/berita', children: [] },
	{ title: 'Guru & Tendik', url: '/guru', children: [] },
	{ title: 'Prestasi', url: '/prestasi', children: [] },
	{ title: 'Galeri', url: '/galeri', children: [] },
	{ title: 'Agenda', url: '/agenda', children: [] },
	{ title: 'Unduhan', url: '/unduhan', children: [] },
	{ title: 'FAQ', url: '/faq', children: [] },
	{ title: 'Kontak', url: '/kontak', children: [] },
	{ title: 'SPMB', url: '/ppdb', children: [] },
	{ title: 'Cari', url: '/search', children: [] }
];

/** Built-in routes offered as quick links in the admin menu builder. */
export const STANDARD_LINKS: NavLink[] = DEFAULT_NAV_ITEMS.map(({ title, url }) => ({
	title,
	url
}));
