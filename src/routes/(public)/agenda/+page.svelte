<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import { CalendarDays, Clock3, MapPin } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' });
</script>

<Seo
	{siteName}
	title="Agenda"
	fullTitle={pageTitle('Agenda', siteName)}
	description="Agenda kegiatan {siteName}."
	canonical={`${origin}${resolve('/agenda')}`}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Kalender kegiatan</p>
		<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Agenda</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
			Temukan jadwal kegiatan sekolah, pertemuan, dan momen penting berikutnya.
		</p>
	</div>
</section>

<section class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
		<div>
			<p class="eyebrow">Jadwal mendatang</p>
			<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Jangan lewatkan</h2>
		</div>
		<CalendarDays class="text-primary-500" size={24} aria-hidden="true" />
	</div>

	<ul class="space-y-5">
		{#each data.agendas as item (item.id)}
			<li
				class="crop-marks card grid gap-5 border border-line bg-bg p-5 shadow-sm sm:grid-cols-[7rem_1fr] sm:p-6"
			>
				<div class="flex items-start gap-2 text-primary-500 sm:block">
					<CalendarDays class="mt-0.5 shrink-0 sm:mb-2" size={18} aria-hidden="true" />
					<p class="font-display text-lg font-semibold leading-tight sm:text-xl">
						{new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(
							new Date(item.startDate)
						)}
					</p>
				</div>
				<div class="space-y-3">
					<div>
						<h2 class="font-display text-xl font-semibold text-ink">{item.title}</h2>
						<p class="mt-1 flex items-center gap-2 text-sm text-ink-muted">
							<Clock3 size={15} aria-hidden="true" />{fmt.format(new Date(item.startDate))}
						</p>
					</div>
					{#if item.location}
						<p class="flex items-center gap-2 text-sm text-ink-muted">
							<MapPin size={15} aria-hidden="true" />{item.location}
						</p>
					{/if}
					{#if item.description}<p class="text-sm leading-6 text-ink-muted">
							{item.description}
						</p>{/if}
				</div>
			</li>
		{:else}
			<p class="opacity-60">Belum ada agenda.</p>
		{/each}
	</ul>
</section>
