<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { can, type Resource, type Role } from '$lib/rbac';
	import {
		CalendarDays,
		CircleHelp,
		Download,
		ExternalLink,
		FileText,
		GraduationCap,
		ImagePlus,
		Images,
		Inbox,
		LayoutDashboard,
		ListTree,
		LogOut,
		Megaphone,
		Menu,
		Newspaper,
		Palette,
		PanelsTopLeft,
		Settings,
		Tags,
		Trophy,
		Users,
		X
	} from '@lucide/svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const role = $derived((data.user?.role ?? 'STAFF') as Role);

	let sidebarOpen = $state(false);

	type MenuItem = {
		href: string;
		label: string;
		resource: Resource;
		icon: typeof Newspaper;
	};

	const menuGroups: { label: string; items: MenuItem[] }[] = [
		{
			label: 'Konten',
			items: [
				{
					href: resolve('/admin/landing-page'),
					label: 'Landing Page',
					resource: 'settings',
					icon: PanelsTopLeft
				},
				{ href: resolve('/admin/posts'), label: 'Berita', resource: 'posts', icon: Newspaper },
				{
					href: resolve('/admin/categories'),
					label: 'Kategori',
					resource: 'posts',
					icon: Tags
				},
				{ href: resolve('/admin/media'), label: 'Media', resource: 'media', icon: ImagePlus },
				{
					href: resolve('/admin/teachers'),
					label: 'Guru & Staf',
					resource: 'teachers',
					icon: GraduationCap
				},
				{
					href: resolve('/admin/achievements'),
					label: 'Prestasi',
					resource: 'achievements',
					icon: Trophy
				},
				{ href: resolve('/admin/galleries'), label: 'Galeri', resource: 'galleries', icon: Images },
				{
					href: resolve('/admin/agendas'),
					label: 'Agenda',
					resource: 'agendas',
					icon: CalendarDays
				},
				{
					href: resolve('/admin/downloads'),
					label: 'Unduhan',
					resource: 'downloads',
					icon: Download
				},
				{ href: resolve('/admin/faqs'), label: 'FAQ', resource: 'faqs', icon: CircleHelp },
				{ href: resolve('/admin/pages'), label: 'Halaman', resource: 'pages', icon: FileText },
				{ href: resolve('/admin/banners'), label: 'Banner', resource: 'banners', icon: Megaphone }
			]
		},
		{
			label: 'Pesan',
			items: [
				{
					href: resolve('/admin/contacts'),
					label: 'Pesan Masuk',
					resource: 'contacts',
					icon: Inbox
				}
			]
		},
		{
			label: 'Sistem',
			items: [
				{ href: resolve('/admin/users'), label: 'Pengguna', resource: 'users', icon: Users },
				{
					href: resolve('/admin/settings'),
					label: 'Pengaturan',
					resource: 'settings',
					icon: Settings
				},
				{ href: resolve('/admin/menus'), label: 'Menu', resource: 'menus', icon: ListTree },
				{
					href: resolve('/admin/settings/theme'),
					label: 'Tema & Warna',
					resource: 'settings',
					icon: Palette
				}
			]
		}
	];

	// Item yang tidak diizinkan untuk role ini tidak ditampilkan sama sekali —
	// proteksi sebenarnya tetap di server (hooks.server.ts / services).
	const visibleGroups = $derived(
		menuGroups
			.map((group) => ({
				...group,
				items: group.items.filter((item) => can(role, 'read', item.resource))
			}))
			.filter((group) => group.items.length > 0)
	);

	function isActive(href: string): boolean {
		if (href === resolve('/admin/settings')) return page.url.pathname === href;
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	const SEGMENT_LABELS: Record<string, string> = {
		admin: 'Dashboard',
		'landing-page': 'Landing Page',
		posts: 'Berita',
		categories: 'Kategori',
		media: 'Media',
		teachers: 'Guru & Staf',
		achievements: 'Prestasi',
		galleries: 'Galeri',
		agendas: 'Agenda',
		downloads: 'Unduhan',
		faqs: 'FAQ',
		pages: 'Halaman',
		banners: 'Banner',
		users: 'Pengguna',
		settings: 'Pengaturan',
		theme: 'Tema & Warna',
		menus: 'Menu',
		contacts: 'Pesan Masuk',
		new: 'Tambah'
	};

	const breadcrumbs = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		return segments.map((segment, i) => ({
			label: SEGMENT_LABELS[segment] ?? 'Detail',
			href: '/' + segments.slice(0, i + 1).join('/'),
			last: i === segments.length - 1
		}));
	});

	/* Kelas item sidebar: mobile & desktop tampil penuh, tablet (md–lg) icon-only. */
	function itemClass(active: boolean): string {
		return `flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors md:justify-center lg:justify-start ${
			active
				? 'border-primary bg-primary-50 font-semibold text-primary'
				: 'border-transparent hover:bg-bg-subtle hover:text-primary'
		}`;
	}
</script>

<div class="min-h-screen bg-bg-subtle text-ink">
	{#if sidebarOpen}
		<!-- Overlay off-canvas (mobile) -->
		<button
			type="button"
			class="fixed inset-0 z-30 bg-ink/40 md:hidden"
			aria-label="Tutup menu samping"
			onclick={() => (sidebarOpen = false)}
		></button>
	{/if}

	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-line bg-bg transition-transform md:w-16 md:translate-x-0 lg:w-64 {sidebarOpen
			? 'translate-x-0'
			: ''}"
		aria-label="Menu admin"
	>
		<div
			class="flex items-center gap-3 border-b border-line px-4 py-4 md:justify-center md:px-2 lg:justify-start lg:px-4"
		>
			<span
				aria-hidden="true"
				class="flex size-8 shrink-0 items-center justify-center bg-primary font-display text-sm font-bold text-white"
			>
				A
			</span>
			<div class="min-w-0 leading-tight md:hidden lg:block">
				<a href={resolve('/admin')} class="block truncate font-display font-bold">Admin</a>
				<a
					href={resolve('/')}
					class="flex items-center gap-1 truncate text-xs text-ink-muted hover:text-primary"
				>
					<ExternalLink aria-hidden="true" class="size-3" /> Lihat situs
				</a>
			</div>
		</div>

		<nav class="flex-1 overflow-y-auto px-2 py-4">
			<a
				href={resolve('/admin')}
				aria-current={page.url.pathname === '/admin' ? 'page' : undefined}
				aria-label="Dashboard"
				title="Dashboard"
				class="mb-4 {itemClass(page.url.pathname === '/admin')}"
				onclick={() => (sidebarOpen = false)}
			>
				<LayoutDashboard aria-hidden="true" class="size-5 shrink-0" />
				<span class="md:hidden lg:inline">Dashboard</span>
			</a>

			{#each visibleGroups as group (group.label)}
				<p
					class="px-3 pb-1 font-mono text-[0.65rem] tracking-widest text-ink-muted uppercase md:hidden lg:block"
				>
					{group.label}
				</p>
				<hr class="mx-2 mb-2 hidden border-line md:block lg:hidden" />
				<ul class="mb-4">
					{#each group.items as item (item.href)}
						{@const Icon = item.icon}
						<li>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- href dibangun dari resolve() di menuGroups -->
							<a
								href={item.href}
								aria-current={isActive(item.href) ? 'page' : undefined}
								aria-label={item.label}
								title={item.label}
								class={itemClass(isActive(item.href))}
								onclick={() => (sidebarOpen = false)}
							>
								<Icon aria-hidden="true" class="size-5 shrink-0" />
								<span class="md:hidden lg:inline">{item.label}</span>
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</li>
					{/each}
				</ul>
			{/each}
		</nav>

		<div class="border-t border-line px-4 py-3 text-sm md:hidden lg:block">
			<p class="truncate font-semibold">{data.user?.name}</p>
			<p class="font-mono text-[0.65rem] tracking-widest text-ink-muted uppercase">
				{data.user?.role}
			</p>
		</div>
	</aside>

	<div class="flex min-h-screen flex-col md:pl-16 lg:pl-64">
		<header
			class="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-bg px-4 py-3"
		>
			<div class="flex min-w-0 items-center gap-3">
				<button
					type="button"
					class="p-1 md:hidden"
					aria-expanded={sidebarOpen}
					aria-label="Buka menu samping"
					onclick={() => (sidebarOpen = true)}
				>
					{#if sidebarOpen}
						<X aria-hidden="true" class="size-6" />
					{:else}
						<Menu aria-hidden="true" class="size-6" />
					{/if}
				</button>

				<nav aria-label="Breadcrumb" class="min-w-0">
					<ol class="flex items-center gap-1 truncate text-sm text-ink-muted">
						{#each breadcrumbs as crumb (crumb.href)}
							<li class="flex items-center gap-1">
								{#if crumb.last}
									<span aria-current="page" class="font-semibold text-ink">{crumb.label}</span>
								{:else}
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path built from current URL -->
									<a href={crumb.href} class="hover:text-primary">{crumb.label}</a>
									<span aria-hidden="true" class="text-line">/</span>
								{/if}
							</li>
						{/each}
					</ol>
				</nav>
			</div>

			<div class="flex shrink-0 items-center gap-3">
				<span class="hidden text-sm sm:block">
					{data.user?.name}
					<span class="badge preset-tonal ml-1 font-mono text-[0.65rem]">{data.user?.role}</span>
				</span>
				<form method="POST" action="/logout">
					<input type="hidden" name="redirectTo" value="/login" />
					<button
						type="submit"
						class="flex items-center gap-2 border border-line px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
					>
						<LogOut aria-hidden="true" class="size-4" /> Keluar
					</button>
				</form>
			</div>
		</header>

		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>
