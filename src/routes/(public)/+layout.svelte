<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { ChevronDown, Menu, X } from '@lucide/svelte';
	import schoolLogo from '$lib/assets/school-logo.smk.png';
	import SocialIcon from '$lib/components/ui/SocialIcon.svelte';
	import { DEFAULT_NAV_ITEMS } from '$lib/utils/navigation';
	import { defaultTheme, themeStyle } from '$lib/utils/theme';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const social = $derived(data.settings?.socialMedia ?? {});
	const logoSrc = $derived(data.logoUrl || schoolLogo);
	const socialLinks = $derived(
		[
			{ key: 'instagram' as const, name: 'Instagram', url: social.instagram },
			{ key: 'youtube' as const, name: 'YouTube', url: social.youtube },
			{ key: 'facebook' as const, name: 'Facebook', url: social.facebook },
			{ key: 'tiktok' as const, name: 'TikTok', url: social.tiktok }
		].filter(
			(
				item
			): item is {
				key: 'instagram' | 'youtube' | 'facebook' | 'tiktok';
				name: string;
				url: string;
			} => Boolean(item.url)
		)
	);
	const mapsEmbed = $derived(data.settings?.googleMapsEmbed ?? '');
	const footerConfig = $derived(
		data.settings?.footerConfig ?? {
			showContactSection: true,
			showQuickLinksSection: true,
			showLocationSection: true,
			showSocialMedia: true,
			selectedMenuIds: []
		}
	);
	const year = new Date().getFullYear();

	let mobileOpen = $state(false);
	let mobileSubmenus = $state<Record<string, boolean>>({});
	let scrollY = $state(0);
	let viewportWidth = $state(0);
	let headerHeight = $state(80);
	let headerElement: HTMLElement;
	let menuButton: HTMLButtonElement;
	const scrolled = $derived(scrollY > 24);

	afterNavigate(closeMobile);

	$effect(() => {
		if (viewportWidth >= 1024) closeMobile();
	});

	// Menu dikelola admin lewat /admin/menus; fallback ke menu bawaan saat kosong.
	const navItems = $derived(
		data.navigation.length
			? data.navigation
			: DEFAULT_NAV_ITEMS.map((item) => ({
					id: item.url,
					title: item.title,
					url: item.url,
					children: []
				}))
	);

	// Filter menu items untuk footer berdasarkan footer config
	const footerMenuItems = $derived.by(() => {
		if (!footerConfig.selectedMenuIds || footerConfig.selectedMenuIds.length === 0) {
			return navItems;
		}
		return navItems.filter((item) => footerConfig.selectedMenuIds.includes(item.id));
	});

	const copyrightText = $derived(footerConfig.copyrightText || `© ${year} · ${data.siteName}`);

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function isCta(href: string): boolean {
		return href === '/ppdb';
	}

	function isBranchActive(item: (typeof navItems)[number]): boolean {
		return isActive(item.url) || item.children.some((child) => isActive(child.url));
	}

	function closeMobile() {
		mobileOpen = false;
		mobileSubmenus = {};
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !mobileOpen) return;
		closeMobile();
		menuButton?.focus();
	}

	function handleOutsideClick(event: MouseEvent) {
		if (mobileOpen && !event.composedPath().includes(headerElement)) {
			closeMobile();
		}
	}
</script>

<svelte:window
	bind:scrollY
	bind:innerWidth={viewportWidth}
	onkeydown={handleKeydown}
	onclick={handleOutsideClick}
/>

<div
	data-site-theme
	style={`${themeStyle(data.settings?.themeConfig ?? defaultTheme)}; --public-header-height: ${headerHeight}px`}
	class="flex min-h-screen flex-col bg-bg font-sans text-ink"
>
	<a
		href="#konten-utama"
		class="sr-only z-50 bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
	>
		Lewati ke konten utama
	</a>

	<header
		bind:this={headerElement}
		bind:clientHeight={headerHeight}
		data-scrolled={scrolled}
		class="sticky top-0 z-40 shrink-0 border-b transition-[background-color,box-shadow,border-color] duration-200 {scrolled
			? 'border-primary/15 bg-bg/95 shadow-md backdrop-blur-md'
			: 'border-line bg-bg'}"
	>
		<div class="mx-auto flex min-h-20 max-w-public items-center justify-between gap-4 px-4 py-3">
			<a href={resolve('/')} class="flex min-w-0 items-center gap-3">
				<img
					src={logoSrc}
					alt="Logo {data.siteName}"
					class="size-11 shrink-0 object-contain transition-transform duration-200 sm:size-13 {scrolled
						? 'scale-90'
						: 'scale-100'}"
					width="250"
					height="250"
				/>
				<span class="min-w-0 leading-tight">
					<span class="block font-display text-sm font-bold sm:text-base">{data.siteName}</span>
					{#if data.settings?.tagline}
						<span class="hidden text-xs text-ink-muted sm:block">{data.settings.tagline}</span>
					{/if}
				</span>
			</a>

			<nav aria-label="Navigasi utama" class="hidden items-center gap-5 text-sm lg:flex">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- URL menu dikelola admin -->
				{#each navItems as item (item.id)}
					{#if item.children.length}
						<div class="group relative">
							<a
								href={item.url}
								aria-current={isActive(item.url) ? 'page' : undefined}
								class="flex items-center gap-1 transition-colors {isCta(item.url)
									? 'bg-accent px-4 py-2 font-display font-bold text-on-accent hover:bg-primary hover:text-white'
									: `border-b-2 py-1 ${
											isBranchActive(item)
												? 'border-accent font-semibold text-primary'
												: 'border-transparent text-ink hover:border-line hover:text-primary'
										}`}"
							>
								{item.title}
								<ChevronDown
									aria-hidden="true"
									class="size-3.5 shrink-0 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
								/>
							</a>
							<div
								class="invisible absolute top-full left-0 z-20 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
							>
								<div class="min-w-48 border border-line bg-bg py-1 shadow-lg">
									{#each item.children as child (child.id)}
										<a
											href={child.url}
											aria-current={isActive(child.url) ? 'page' : undefined}
											class="block px-4 py-2 transition-colors hover:bg-bg-subtle hover:text-primary {isActive(
												child.url
											)
												? 'font-semibold text-primary'
												: 'text-ink'}"
										>
											{child.title}
										</a>
									{/each}
								</div>
							</div>
						</div>
					{:else}
						<a
							href={item.url}
							aria-current={isActive(item.url) ? 'page' : undefined}
							class="transition-colors {isCta(item.url)
								? 'bg-accent px-4 py-2 font-display font-bold text-on-accent hover:bg-primary hover:text-white'
								: `border-b-2 py-1 ${
										isActive(item.url)
											? 'border-accent font-semibold text-primary'
											: 'border-transparent text-ink hover:border-line hover:text-primary'
									}`}"
						>
							{item.title}
						</a>
					{/if}
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</nav>

			<div class="flex items-center gap-2">
				<button
					bind:this={menuButton}
					type="button"
					class="flex size-11 shrink-0 items-center justify-center lg:hidden"
					aria-expanded={mobileOpen}
					aria-controls="menu-mobile"
					aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
					onclick={() => (mobileOpen ? closeMobile() : (mobileOpen = true))}
				>
					{#if mobileOpen}<X aria-hidden="true" class="size-6" />{:else}<Menu
							aria-hidden="true"
							class="size-6"
						/>{/if}
				</button>
			</div>
		</div>

		{#if mobileOpen}
			<nav
				id="menu-mobile"
				aria-label="Navigasi utama (mobile)"
				class="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--public-header-height)-1rem)] overflow-y-auto overscroll-contain border-b border-line bg-bg shadow-lg lg:hidden"
			>
				<div class="mx-auto flex max-w-public flex-col px-4 py-2">
					<!-- eslint-disable svelte/no-navigation-without-resolve -- URL menu dikelola admin -->
					{#each navItems as item (item.id)}
						{#if item.children.length}
							<div class="border-b border-line">
								<div class="flex items-center">
									<a
										href={item.url}
										aria-current={isActive(item.url) ? 'page' : undefined}
										class="flex-1 py-3 text-sm {isCta(item.url)
											? 'bg-accent px-3 font-display font-bold text-on-accent'
											: isBranchActive(item)
												? 'font-semibold text-primary'
												: ''}"
										onclick={closeMobile}
									>
										{item.title}
									</a>
									<button
										type="button"
										class="p-3"
										aria-expanded={mobileSubmenus[item.id] ?? false}
										aria-label="{mobileSubmenus[item.id] ? 'Tutup' : 'Buka'} submenu {item.title}"
										onclick={() => (mobileSubmenus[item.id] = !mobileSubmenus[item.id])}
									>
										<svg
											aria-hidden="true"
											class="size-4 transition-transform {mobileSubmenus[item.id]
												? 'rotate-180'
												: ''}"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											viewBox="0 0 24 24"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="m6 9 6 6 6-6" />
										</svg>
									</button>
								</div>
								{#if mobileSubmenus[item.id]}
									<div class="flex flex-col border-t border-line/60 pb-2 pl-4">
										{#each item.children as child (child.id)}
											<a
												href={child.url}
												aria-current={isActive(child.url) ? 'page' : undefined}
												class="py-2 text-sm {isActive(child.url)
													? 'font-semibold text-primary'
													: 'text-ink-muted'}"
												onclick={closeMobile}
											>
												{child.title}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<a
								href={item.url}
								aria-current={isActive(item.url) ? 'page' : undefined}
								class="border-b border-line py-3 text-sm {isCta(item.url)
									? 'bg-accent px-3 font-display font-bold text-on-accent'
									: isActive(item.url)
										? 'font-semibold text-primary'
										: ''}"
								onclick={closeMobile}
							>
								{item.title}
							</a>
						{/if}
					{/each}
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
			</nav>
		{/if}
	</header>

	<main
		id="konten-utama"
		tabindex="-1"
		class="flex-1 scroll-mt-[calc(var(--public-header-height)+1rem)]"
	>
		{@render children()}
	</main>

	<footer class="mt-16 border-t border-line bg-bg-subtle">
		<div class="mx-auto grid max-w-public gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
			{#if footerConfig.showContactSection}
				<div class="space-y-2">
					<p class="eyebrow">Kontak</p>
					<p class="font-display font-bold">{data.siteName}</p>
					{#if footerConfig.brandingText}
						<p class="text-sm text-ink-muted">{footerConfig.brandingText}</p>
					{/if}
					{#if data.settings?.address}<p class="text-sm text-ink-muted">
							{data.settings.address}
						</p>{/if}
					{#if data.settings?.phone}<p class="text-sm text-ink-muted">
							Telp: {data.settings.phone}
						</p>{/if}
					{#if data.settings?.email}<p class="text-sm text-ink-muted">
							Email: {data.settings.email}
						</p>{/if}

					{#if footerConfig.showSocialMedia && socialLinks.length > 0}
						<div class="flex flex-wrap items-center gap-2 pt-2">
							<!-- eslint-disable svelte/no-navigation-without-resolve -- external social URLs -->
							{#each socialLinks as item (item.key)}
								<a
									href={item.url}
									target="_blank"
									rel="noreferrer noopener"
									title="{item.name} {data.siteName}"
									aria-label="{item.name} {data.siteName}"
									class="inline-flex size-9 items-center justify-center border border-line bg-bg text-ink-muted transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
								>
									<SocialIcon name={item.key} class="size-4.5" />
									<span class="sr-only">{item.name}</span>
								</a>
							{/each}
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</div>
					{/if}
				</div>
			{/if}

			{#if footerConfig.showQuickLinksSection}
				<div class="space-y-2">
					<p class="eyebrow">Tautan Cepat</p>
					<ul class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
						<!-- eslint-disable svelte/no-navigation-without-resolve -- URL menu dikelola admin -->
						{#each footerMenuItems as item (item.id)}
							<li><a href={item.url} class="text-ink-muted hover:text-primary">{item.title}</a></li>
						{/each}
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</ul>
				</div>
			{/if}

			{#if footerConfig.showLocationSection && mapsEmbed.startsWith('http')}
				<div class="space-y-2">
					<p class="eyebrow">Lokasi</p>
					<iframe
						src={mapsEmbed}
						title="Peta lokasi {data.siteName}"
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						class="h-44 w-full border border-line"
					></iframe>
				</div>
			{/if}
		</div>

		<div class="border-t border-line">
			<p
				class="mx-auto max-w-public px-4 py-4 text-center font-mono text-xs tracking-widest text-ink-muted uppercase"
			>
				{copyrightText}
			</p>
		</div>
	</footer>
</div>
