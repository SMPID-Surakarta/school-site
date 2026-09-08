<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import { Camera, Images } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });
</script>

<Seo
	{siteName}
	title="Galeri"
	fullTitle={pageTitle('Galeri', siteName)}
	description="Dokumentasi kegiatan dan fasilitas {siteName}."
	canonical={`${origin}${resolve('/galeri')}`}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Dokumentasi sekolah</p>
		<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Galeri</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
			Album kegiatan yang merekam proses belajar, kebersamaan, dan karya siswa {siteName}.
		</p>
	</div>
</section>

<section>
	<div class="mx-auto max-w-public px-4 py-10 sm:py-14">
		<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
			<div>
				<p class="eyebrow">Catatan kegiatan</p>
				<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Album terbaru</h2>
			</div>
			<p class="font-mono text-xs text-ink-muted">
				{data.galleries.length.toString().padStart(2, '0')} ALBUM
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.galleries as item (item.id)}
				<a href={resolve(`/galeri/${item.id}`)} class="group block focus:outline-none">
					<article
						class="h-full overflow-hidden border border-line bg-bg shadow-sm transition-shadow hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary"
					>
						<div class="relative aspect-video border-b border-line bg-surface-200-800">
							<div class="absolute inset-3 border border-line bg-bg-subtle rotate-3"></div>
							<div class="absolute inset-1.5 border border-line bg-bg-subtle -rotate-2"></div>
							<div class="relative h-full overflow-hidden border border-line bg-surface-200-800">
								{#if item.coverUrl}
									<img
										src={item.coverUrl}
										alt={item.coverAltText ?? item.title}
										width={item.coverWidth ?? undefined}
										height={item.coverHeight ?? undefined}
										class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
										loading="lazy"
									/>
								{:else}
									<div class="flex h-full items-center justify-center text-ink-muted">
										<Camera size={42} strokeWidth={1.25} aria-hidden="true" />
									</div>
								{/if}
							</div>
						</div>
						<div class="flex min-w-0 flex-col gap-3 p-4">
							<div class="flex items-start justify-between gap-3">
								<span class="badge preset-tonal-primary px-2 py-1 text-xs">Album Kegiatan</span>
								<span class="whitespace-nowrap text-xs text-ink-muted">
									{dateFmt.format(new Date(item.eventDate))}
								</span>
							</div>
							<h2 class="text-base font-semibold leading-snug">{item.title}</h2>
							<div class="flex items-center gap-2 text-sm text-ink-muted">
								<Images size={16} aria-hidden="true" />
								<span>{item.photoCount} Foto</span>
							</div>
							{#if item.description}
								<p class="line-clamp-2 text-sm leading-relaxed text-ink-muted">
									{item.description}
								</p>
							{/if}
						</div>
					</article>
				</a>
			{:else}
				<div class="col-span-full flex flex-col items-center gap-2 py-12 opacity-60">
					<Images size={32} aria-hidden="true" />
					<p>Belum ada album kegiatan.</p>
				</div>
			{/each}
		</div>
	</div>
</section>
