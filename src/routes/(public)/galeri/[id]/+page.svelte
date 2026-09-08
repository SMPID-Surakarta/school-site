<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import { ArrowLeft, Images } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });
	let activePhoto = $state<PageData['album']['photos'][number] | null>(null);
</script>

<Seo
	{siteName}
	title={data.album.title}
	fullTitle={pageTitle(data.album.title, siteName)}
	description={data.album.description ?? `Dokumentasi foto kegiatan ${data.album.title}.`}
	canonical={`${origin}${resolve(`/galeri/${data.album.id}`)}`}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<a
			href={resolve('/galeri')}
			class="inline-flex items-center gap-2 bg-accent px-4 py-2 font-display text-sm font-bold text-on-accent transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
		>
			<ArrowLeft size={16} aria-hidden="true" />
			Kembali ke Album
		</a>
		<div class="mt-8 max-w-3xl space-y-3">
			<p class="eyebrow">Album kegiatan</p>
			<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
				{data.album.title}
			</h1>
			<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
				<span>{dateFormatter.format(data.album.eventDate)}</span>
				<span>{data.album.photoCount} Foto</span>
			</div>
			{#if data.album.description}
				<p class="text-base leading-7 text-ink-muted">{data.album.description}</p>
			{/if}
		</div>
	</div>
</section>

<section class="bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-10 sm:py-14">
		<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
			<div>
				<p class="eyebrow">Dokumentasi visual</p>
				<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Foto kegiatan</h2>
			</div>
			<p class="flex items-center gap-2 font-mono text-xs text-ink-muted">
				<Images size={15} aria-hidden="true" />
				{data.album.photoCount.toString().padStart(2, '0')} FOTO
			</p>
		</div>

		{#if data.album.photos.length === 0}
			<div class="flex flex-col items-center gap-2 py-12 text-ink-muted">
				<Images size={32} aria-hidden="true" />
				<p>Belum ada foto dalam album ini.</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{#each data.album.photos as photo (photo.id)}
					<button
						type="button"
						class="group aspect-square overflow-hidden border border-line bg-bg p-0 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						onclick={() => (activePhoto = photo)}
					>
						<img
							src={photo.url}
							alt={photo.altText ?? data.album.title}
							width={photo.width ?? undefined}
							height={photo.height ?? undefined}
							class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
							loading="lazy"
						/>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#if activePhoto}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		role="presentation"
		onclick={() => (activePhoto = null)}
		onkeydown={(event) => {
			if (event.key === 'Escape') activePhoto = null;
		}}
	>
		<button
			type="button"
			class="absolute right-4 top-4 btn preset-filled-surface-100-900"
			onclick={() => (activePhoto = null)}
		>
			Tutup
		</button>
		<img
			src={activePhoto.url}
			alt={activePhoto.altText ?? data.album.title}
			width={activePhoto.width ?? undefined}
			height={activePhoto.height ?? undefined}
			class="max-h-[88vh] max-w-full rounded object-contain shadow-2xl"
		/>
	</div>
{/if}
