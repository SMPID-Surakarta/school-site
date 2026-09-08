<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Seo, pageTitle } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const canonical = $derived.by(() => {
		const url = new URL(resolve('/berita'), page.url);
		if (data.category) url.searchParams.set('category', data.category.id);
		return url.href;
	});
	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

	function formattedDate(value: Date | string | null): string {
		return value ? dateFmt.format(new Date(value)) : 'Tanggal belum tersedia';
	}

	function pageHref(n: number): string {
		const params = new SvelteURLSearchParams();
		if (data.category) params.set('category', data.category.id);
		if (n > 1) params.set('page', String(n));
		return `${resolve('/berita')}${params.size ? `?${params}` : ''}`;
	}
</script>

<Seo
	{siteName}
	title="Berita"
	fullTitle={pageTitle('Berita', siteName)}
	description="Berita dan pengumuman terbaru dari {siteName}."
	{canonical}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Pusat informasi sekolah</p>
		<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Berita</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
			Cerita, kabar terbaru, dan kegiatan yang menghidupkan ruang belajar di {siteName}.
		</p>
	</div>
</section>

<section class="mx-auto max-w-public px-4 py-10 sm:py-14">
	<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
		<div>
			<p class="eyebrow">Edisi terbaru</p>
			<h2 class="mt-2 font-display text-2xl font-semibold text-ink">
				{data.category?.name ?? 'Kabar sekolah'}
			</h2>
			{#if data.category}<a
					href={resolve('/berita')}
					class="mt-2 inline-block text-sm text-primary underline underline-offset-4"
					>Semua kategori</a
				>{/if}
		</div>
		<p class="font-mono text-xs text-ink-muted">HALAMAN {data.page.toString().padStart(2, '0')}</p>
	</div>

	<div class="grid gap-5 lg:grid-cols-2">
		{#each data.items as post, index (post.id)}
			<a
				href={resolve(`/berita/${post.slug}`)}
				class="crop-marks card group block overflow-hidden border border-line bg-bg shadow-sm transition hover:-translate-y-1 hover:shadow-lg {index ===
				0
					? 'lg:col-span-2 lg:grid lg:grid-cols-[1.2fr_0.8fr]'
					: ''}"
			>
				{#if post.thumbnailUrl}
					<img
						src={post.thumbnailUrl}
						alt={post.thumbnailAltText ?? post.title}
						width={post.thumbnailWidth ?? 1200}
						height={post.thumbnailHeight ?? 675}
						class="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.03] {index ===
						0
							? 'lg:h-full'
							: ''}"
						loading="lazy"
					/>
				{:else}
					<div
						class="flex aspect-video items-center justify-center bg-primary-50 text-primary-500 {index ===
						0
							? 'lg:h-full'
							: ''}"
					>
						<span class="font-mono text-xs uppercase tracking-[0.18em]">SMK / NEWS</span>
					</div>
				{/if}
				<div class="flex flex-col justify-center gap-4 p-5 sm:p-6 {index === 0 ? 'lg:p-8' : ''}">
					<div class="flex items-center justify-between gap-3">
						{#if post.categoryName}<span class="badge preset-tonal">{post.categoryName}</span>{/if}
						<span class="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-muted"
							>{formattedDate(post.publishedAt)}</span
						>
					</div>
					<h2
						class="font-display text-xl font-semibold leading-tight text-ink {index === 0
							? 'lg:text-3xl'
							: ''}"
					>
						{post.title}
					</h2>
					{#if post.excerpt}
						<p class="line-clamp-3 text-sm leading-6 text-ink-muted">{post.excerpt}</p>
					{/if}
					<span class="font-mono text-xs uppercase tracking-[0.14em] text-primary"
						>Baca selengkapnya →</span
					>
				</div>
			</a>
		{:else}
			<p class="opacity-60">Belum ada berita.</p>
		{/each}
	</div>

	{#if data.pageCount > 1}
		<nav class="mt-10 flex items-center justify-center gap-2" aria-label="Navigasi halaman berita">
			<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links with query string -->
			{#each Array.from({ length: data.pageCount }, (_, i) => i + 1) as n (n)}
				<a
					href={pageHref(n)}
					class="btn btn-sm {n === data.page ? 'preset-filled-primary-500' : 'preset-tonal'}"
					aria-current={n === data.page ? 'page' : undefined}>{n}</a
				>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</nav>
	{/if}
</section>
