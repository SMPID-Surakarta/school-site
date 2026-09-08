<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);

	function initials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	}
</script>

<Seo
	{siteName}
	title="Guru & Staf"
	fullTitle={pageTitle('Guru & Staf', siteName)}
	description="Daftar guru dan staf pengajar di {siteName}."
	canonical={`${origin}${resolve('/guru')}`}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Direktori tenaga pendidik</p>
		<div class="max-w-2xl">
			<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
				Guru &amp; Staf
			</h1>
			<p class="mt-4 max-w-xl text-base leading-7 text-ink-muted">
				Kenali para pendidik yang mendampingi siswa mengasah keahlian dan menyiapkan masa depan.
			</p>
		</div>
	</div>
</section>

<section class="mx-auto max-w-public px-4 py-10 sm:py-14">
	<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
		<div>
			<p class="eyebrow">Tim pengajar</p>
			<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Orang di balik pembelajaran</h2>
		</div>
		<p class="font-mono text-xs text-ink-muted">
			{data.teachers.length.toString().padStart(2, '0')} PERSONEL
		</p>
	</div>

	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.teachers as teacher (teacher.id)}
			<div
				class="crop-marks card overflow-hidden border border-line bg-bg shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
			>
				{#if teacher.photoUrl}
					<img
						src={teacher.photoUrl}
						alt={teacher.photoAltText ?? `Foto ${teacher.name}`}
						width={teacher.photoWidth ?? 600}
						height={teacher.photoHeight ?? 800}
						class="aspect-[4/5] w-full object-cover"
						loading="lazy"
					/>
				{:else}
					<div class="flex aspect-[4/5] items-center justify-center bg-primary-50 text-primary-500">
						<span class="font-display text-6xl font-semibold">{initials(teacher.name)}</span>
					</div>
				{/if}
				<div class="space-y-3 p-5">
					<div>
						<p class="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-primary">
							Tenaga pendidik
						</p>
						<h2 class="font-display text-xl font-semibold text-ink">{teacher.name}</h2>
					</div>
					<div class="space-y-1 border-t border-line pt-3 text-sm text-ink-muted">
						{#if teacher.position}<p>{teacher.position}</p>{/if}
						{#if teacher.subject}<p>
								<span class="font-medium text-ink">Mapel:</span>
								{teacher.subject}
							</p>{/if}
					</div>
				</div>
			</div>
		{:else}
			<p class="opacity-60">Belum ada data guru.</p>
		{/each}
	</div>
</section>
