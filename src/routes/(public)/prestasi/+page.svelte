<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import { normalizeAchievementCategory, normalizeAchievementLevel } from '$lib/utils/achievements';
	import { Award, BookOpen, Dumbbell, Leaf, Medal, Trophy } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

	function pageHref(n: number): string {
		return n <= 1 ? resolve('/prestasi') : `${resolve('/prestasi')}?page=${n}`;
	}

	function placeholderTone(category: string | null, title: string): string {
		const value = `${category ?? ''} ${title}`.toLowerCase();
		if (value.includes('olahraga') || value.includes('futsal') || value.includes('bola')) {
			return 'preset-tonal-success';
		}
		if (value.includes('lingkungan') || value.includes('adiwiyata')) return 'preset-tonal-warning';
		if (value.includes('keagamaan') || value.includes('mtq')) return 'preset-tonal-primary';
		return 'preset-tonal-primary';
	}
</script>

<Seo
	{siteName}
	title="Prestasi"
	fullTitle={pageTitle('Prestasi', siteName)}
	description="Capaian dan prestasi {siteName}."
	canonical={`${origin}${resolve('/prestasi')}`}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Rekam jejak siswa</p>
		<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Prestasi</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
			Apresiasi untuk kerja keras, keberanian berkompetisi, dan karya siswa {siteName}.
		</p>
	</div>
</section>

<section>
	<div class="mx-auto max-w-public px-4 py-10 sm:py-14">
		<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
			<div>
				<p class="eyebrow">Catatan pencapaian</p>
				<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Siswa berprestasi</h2>
			</div>
			<p class="font-mono text-xs text-ink-muted">
				HALAMAN {data.page.toString().padStart(2, '0')}
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.items as item (item.id)}
				<article
					class="overflow-hidden border border-line bg-bg shadow-sm transition-shadow hover:shadow-md"
				>
					{#if item.imageUrl}
						<img
							src={item.imageUrl}
							alt={item.imageAltText ?? item.studentName ?? item.title}
							class="aspect-video w-full border-b border-line object-cover"
							loading="lazy"
						/>
					{:else}
						<div
							class="flex aspect-video w-full items-center justify-center border-b border-line {placeholderTone(
								item.category,
								item.title
							)}"
							aria-label="Ilustrasi {item.category ?? 'prestasi'}"
						>
							{#if item.category === 'Olahraga' || item.title.toLowerCase().includes('futsal')}
								<Dumbbell size={54} strokeWidth={1.25} aria-hidden="true" />
							{:else if item.category === 'Lingkungan' || item.title
									.toLowerCase()
									.includes('adiwiyata')}
								<Leaf size={54} strokeWidth={1.25} aria-hidden="true" />
							{:else if item.category === 'Keagamaan' || item.title.toLowerCase().includes('mtq')}
								<Award size={54} strokeWidth={1.25} aria-hidden="true" />
							{:else if item.category === 'Akademik' || item.title.toLowerCase().includes('web')}
								<BookOpen size={54} strokeWidth={1.25} aria-hidden="true" />
							{:else}
								<Trophy size={54} strokeWidth={1.25} aria-hidden="true" />
							{/if}
						</div>
					{/if}
					<div class="flex min-w-0 flex-col gap-3 p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="flex min-w-0 flex-wrap items-center gap-1.5">
								{#if item.category}
									<span class="badge preset-tonal-primary px-2 py-1 text-xs">
										{normalizeAchievementCategory(item.category)}
									</span>
								{:else}
									<span class="badge preset-tonal px-2 py-1 text-xs">Prestasi</span>
								{/if}
								{#if item.level}
									<span class="badge preset-tonal-success px-2 py-1 text-xs">
										Tingkat {normalizeAchievementLevel(item.level)}
									</span>
								{:else}
									<span class="badge preset-tonal px-2 py-1 text-xs">Tingkat wilayah</span>
								{/if}
							</div>
							{#if item.date}
								<span class="text-xs whitespace-nowrap text-ink-muted">
									{dateFmt.format(new Date(item.date))}
								</span>
							{/if}
						</div>
						<h2 class="text-base leading-snug font-semibold">{item.title}</h2>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="min-w-0 truncate text-sm font-medium">
								{item.studentName ?? 'Pemenang/tim belum dicatat'}
							</p>
							{#if item.rank}
								<p
									class="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary-500"
								>
									<Medal size={16} aria-hidden="true" />
									{item.rank}
								</p>
							{/if}
						</div>
						{#if item.description}
							<p class="line-clamp-3 text-sm leading-relaxed text-ink-muted">{item.description}</p>
						{/if}
					</div>
				</article>
			{:else}
				<div class="col-span-full flex flex-col items-center gap-2 py-12 opacity-60">
					<Award size={32} aria-hidden="true" />
					<p>Belum ada prestasi.</p>
				</div>
			{/each}
		</div>

		{#if data.pageCount > 1}
			<nav class="mt-10 flex items-center justify-center gap-2" aria-label="Navigasi halaman">
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
	</div>
</section>
