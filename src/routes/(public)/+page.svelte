<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import headerBackground from '$lib/assets/header-background.jpg';
	import { Seo, organizationJsonLd, pageTitle } from '$lib/seo';
	import {
		ArrowRight,
		Building2,
		ChevronLeft,
		ChevronRight,
		Megaphone,
		Trophy
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const description = $derived(
		(page.data.settings?.description as string | undefined) ??
			'Informasi resmi, berita, prestasi, dan agenda sekolah.'
	);
	const tagline = $derived(page.data.settings?.tagline as string | undefined);

	const landing = $derived(data.landingPage);
	let activeSlide = $state(0);
	let sliderPaused = $state(false);
	let autoPlay = $state(false);
	let animKey = $state(0);
	let _timer: number | undefined;
	const banner = $derived(data.banners[activeSlide]);
	const heroTitle = $derived(banner?.title || landing.heroTitle || siteName);
	const heroDescription = $derived(banner?.subtitle || landing.heroDescription || description);
	const heroCtaText = $derived(banner?.buttonText || landing.heroCtaText || 'Kenali Sekolah');
	const heroCtaUrl = $derived(banner?.buttonUrl || landing.heroCtaUrl || resolve('/kontak'));

	function tick() {
		if (!sliderPaused) showSlide(activeSlide + 1);
	}

	function showSlide(index: number) {
		const total = data.banners.length;
		if (total < 2) return;
		activeSlide = (index + total) % total;
		animKey++;
		if (autoPlay) {
			clearInterval(_timer);
			_timer = window.setInterval(tick, 6000);
		}
	}

	function resumeSlider() {
		sliderPaused = false;
		if (autoPlay) {
			animKey++;
			clearInterval(_timer);
			_timer = window.setInterval(tick, 6000);
		}
	}

	onMount(() => {
		if (data.banners.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		autoPlay = true;
		_timer = window.setInterval(tick, 6000);
		return () => clearInterval(_timer);
	});

	const stats = $derived(
		[
			{ value: data.stats.teachers, label: 'Guru & Tendik' },
			{ value: data.stats.achievements, label: 'Prestasi' },
			{ value: data.stats.agendas, label: 'Agenda Kegiatan' }
		].filter((s) => s.value > 0)
	);

	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });
</script>

<Seo
	{siteName}
	fullTitle={pageTitle(siteName, siteName)}
	title={siteName}
	{description}
	canonical={origin || resolve('/')}
	jsonLd={organizationJsonLd(page.data.settings, origin)}
/>

<section
	class="relative min-h-[34rem] overflow-hidden bg-primary sm:min-h-[40rem]"
	aria-roledescription="carousel"
	aria-label="Banner utama"
	onmouseenter={() => (sliderPaused = true)}
	onmouseleave={resumeSlider}
	onfocusin={() => (sliderPaused = true)}
	onfocusout={resumeSlider}
>
	<img
		src={headerBackground}
		alt=""
		class="absolute inset-0 size-full object-cover object-[58%_center] sm:object-center"
		fetchpriority="high"
	/>
	{#each data.banners as slide, index (slide.id)}
		{#if slide.imageUrl}
			<img
				src={slide.imageUrl}
				alt={slide.imageAltText || ''}
				width={slide.imageWidth ?? undefined}
				height={slide.imageHeight ?? undefined}
				class="absolute inset-0 size-full object-cover object-center transition-opacity duration-700 {index ===
				activeSlide
					? 'opacity-100'
					: 'opacity-0'}"
				fetchpriority={index === 0 ? 'high' : 'auto'}
				loading={index === 0 ? 'eager' : 'lazy'}
			/>
		{/if}
	{/each}
	<div
		aria-hidden="true"
		class="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,39,0.94)_0%,rgba(7,22,39,0.78)_42%,rgba(7,22,39,0.16)_78%),linear-gradient(0deg,rgba(7,22,39,0.82)_0%,transparent_48%)]"
	></div>
	<div
		class="relative mx-auto flex min-h-[34rem] max-w-public flex-col justify-between px-4 py-10 sm:min-h-[40rem] sm:py-14"
	>
		<div class="max-w-2xl">
			<p
				class="mb-4 font-mono text-xs font-semibold tracking-[0.14em] text-accent-on-dark uppercase"
			>
				{landing.heroEyebrow || tagline || 'Sekolah Menengah Kejuruan'}
			</p>
			<h1
				class="font-display text-4xl font-bold text-balance text-white sm:text-6xl"
				style={banner ? `font-size: ${banner.titleFontSize}px` : undefined}
			>
				{heroTitle}
			</h1>
			<p class="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
				{heroDescription}
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- admin-defined URL -->
				<a
					href={heroCtaUrl}
					class="inline-flex items-center gap-2 border border-white/70 px-5 py-3 font-display text-sm font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-primary"
				>
					{heroCtaText}
					<ArrowRight class="size-4" />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>

		{#if data.banners.length > 1}
			<div class="absolute right-4 bottom-6 z-10 flex items-center gap-2 sm:right-8 sm:bottom-8">
				<button
					type="button"
					class="flex size-10 items-center justify-center border border-white/50 bg-ink/40 text-white transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
					aria-label="Banner sebelumnya"
					onclick={() => showSlide(activeSlide - 1)}
				>
					<ChevronLeft class="size-5" />
				</button>
				<div
					class="flex gap-1.5"
					aria-label={`Banner ${activeSlide + 1} dari ${data.banners.length}`}
				>
					{#each data.banners as slide, index (slide.id)}
						<button
							type="button"
							class="relative h-2.5 overflow-hidden transition-[width,background-color] {index ===
							activeSlide
								? 'w-8 ' + (autoPlay ? 'bg-accent/40' : 'bg-accent')
								: 'w-2.5 bg-white/60 hover:bg-white'}"
							aria-label={`Tampilkan banner ${index + 1}: ${slide.title}`}
							aria-current={index === activeSlide ? 'true' : undefined}
							onclick={() => showSlide(index)}
						>
							{#if index === activeSlide && autoPlay}
								{#key animKey}
									<span
										class="absolute inset-y-0 left-0 w-full origin-left bg-accent"
										style="animation: slider-progress 6s linear forwards; animation-play-state: {sliderPaused
											? 'paused'
											: 'running'}"
									></span>
								{/key}
							{/if}
						</button>
					{/each}
				</div>
				<button
					type="button"
					class="flex size-10 items-center justify-center border border-white/50 bg-ink/40 text-white transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
					aria-label="Banner berikutnya"
					onclick={() => showSlide(activeSlide + 1)}
				>
					<ChevronRight class="size-5" />
				</button>
			</div>
		{/if}

		{#if landing.showStats && stats.length}
			<dl class="mt-12 grid max-w-2xl grid-cols-2 border-y border-white/30 sm:grid-cols-3">
				{#each stats as stat (stat.label)}
					<div class="border-white/30 px-4 py-4 first:pl-0 sm:border-r sm:px-6 sm:last:border-r-0">
						<dd class="font-display text-3xl font-bold text-white">{stat.value}</dd>
						<dt class="mt-1 font-mono text-[0.65rem] tracking-widest text-white/70 uppercase">
							{stat.label}
						</dt>
					</div>
				{/each}
			</dl>
		{/if}
	</div>
</section>

{#if landing.showAnnouncement}
	<aside class="bg-accent text-on-accent" aria-label="Pengumuman penting">
		<div
			class="mx-auto flex max-w-public flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex items-start gap-3">
				<span class="flex size-10 shrink-0 items-center justify-center bg-ink text-white">
					<Megaphone class="size-5" />
				</span>
				<div>
					<p class="font-mono text-[0.68rem] font-bold tracking-widest uppercase">
						{landing.announcementLabel || 'PENGUMUMAN'}
					</p>
					<p class="font-display text-lg font-bold">
						{landing.announcementTitle || 'Informasi penting untuk warga sekolah'}
					</p>
					<p class="text-sm">
						{landing.announcementDescription || 'Simak informasi terbaru dari sekolah.'}
					</p>
				</div>
			</div>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- admin-defined URL -->
			<a
				href={landing.announcementCtaUrl || '/berita'}
				class="inline-flex shrink-0 items-center justify-center gap-2 bg-ink px-5 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-primary"
			>
				{landing.announcementCtaText || 'Lihat Selengkapnya'}
				<ArrowRight class="size-4" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	</aside>
{/if}

<div class="mx-auto max-w-public space-y-16 px-4 py-14">
	{#if data.facilities.length}
		<section>
			<div class="mb-6 max-w-2xl">
				<p class="eyebrow mb-1">Sarana Pembelajaran</p>
				<h2 class="font-display text-2xl font-bold sm:text-3xl">
					{landing.facilitiesTitle || 'Fasilitas Sekolah'}
				</h2>
			</div>
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
				{#each data.facilities as facility, index (facility.title)}
					<article
						class="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-bg shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
					>
						{#if facility.imageUrl}
							<div class="aspect-[4/3] overflow-hidden bg-bg-subtle">
								<img
									src={facility.imageUrl}
									alt={facility.imageAltText || facility.title}
									width={facility.imageWidth ?? undefined}
									height={facility.imageHeight ?? undefined}
									class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									loading="lazy"
								/>
							</div>
						{:else}
							<div
								class="blueprint-grid relative flex aspect-[4/3] items-center justify-center bg-bg-subtle text-primary"
							>
								<Building2 class="size-12" strokeWidth={1.25} />
							</div>
						{/if}
						<div class="flex flex-1 flex-col p-5 sm:p-6">
							<div class="flex items-start justify-between gap-4">
								<h3 class="font-display text-lg font-bold text-balance text-ink sm:text-xl">
									{facility.title}
								</h3>
								<span class="shrink-0 font-mono text-[0.68rem] text-primary">
									{String(index + 1).padStart(2, '0')}
								</span>
							</div>
							{#if facility.description}
								<p class="mt-3 text-sm leading-6 text-ink-muted">
									{facility.description}
								</p>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.pinnedPosts.length}
		<section>
			<div class="mb-6">
				<p class="eyebrow mb-1">Pengumuman Penting</p>
				<h2 class="font-display text-2xl font-bold sm:text-3xl">
					{landing.pinnedPostsTitle || 'Berita Unggulan'}
				</h2>
			</div>
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.pinnedPosts as post (post.id)}
					<a
						href={resolve(`/berita/${post.slug}`)}
						class="group block overflow-hidden border border-accent bg-bg transition-colors hover:border-primary"
					>
						{#if post.thumbnailUrl}
							<img
								src={post.thumbnailUrl}
								alt={post.title}
								class="aspect-video w-full object-cover"
								loading="lazy"
							/>
						{/if}
						<div class="p-5">
							<span class="font-mono text-[0.7rem] tracking-widest text-accent-on-light uppercase">
								📌 Unggulan{post.categoryName ? ` · ${post.categoryName}` : ''}
							</span>
							<h3 class="mt-2 font-display text-lg font-bold group-hover:text-primary">
								{post.title}
							</h3>
							{#if post.excerpt}
								<p class="mt-2 line-clamp-2 text-sm text-ink-muted">{post.excerpt}</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if landing.showLatestPosts}
		<section>
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<p class="eyebrow mb-1">Informasi Terkini</p>
					<h2 class="font-display text-2xl font-bold sm:text-3xl">
						{landing.latestPostsTitle || 'Berita Terbaru'}
					</h2>
				</div>
				<a
					href={resolve('/berita')}
					class="shrink-0 text-sm font-semibold text-primary hover:underline">Semua berita →</a
				>
			</div>
			<div class="grid gap-px overflow-hidden border border-line bg-line lg:grid-cols-2">
				{#each data.latestPosts as post, index (post.id)}
					<a
						href={resolve(`/berita/${post.slug}`)}
						class="group relative flex min-h-56 flex-col justify-end overflow-hidden {index === 0 &&
						!post.thumbnailUrl
							? 'bg-primary'
							: 'bg-bg'} {index === 0 ? 'lg:row-span-2 lg:min-h-[29rem]' : 'sm:min-h-64'}"
					>
						{#if post.thumbnailUrl}
							<img
								src={post.thumbnailUrl}
								alt={post.title}
								class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
								loading="lazy"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-transparent"
							></div>
						{:else}
							<div
								aria-hidden="true"
								class="blueprint-grid absolute inset-0 {index === 0 ? 'opacity-10' : 'opacity-35'}"
							></div>
							<span
								aria-hidden="true"
								class="absolute top-4 right-5 font-display text-7xl font-bold {index === 0
									? 'text-white/10'
									: 'text-primary/10'}"
							>
								{String(index + 1).padStart(2, '0')}
							</span>
						{/if}
						<div
							class="relative p-5 {post.thumbnailUrl || index === 0
								? 'text-white'
								: 'text-ink'} sm:p-6"
						>
							<div
								class="mb-3 flex flex-wrap items-center gap-3 font-mono text-[0.68rem] tracking-widest uppercase"
							>
								{#if post.categoryName}<span
										class={post.thumbnailUrl
											? 'text-accent-on-dark'
											: index === 0
												? 'text-accent-on-primary'
												: 'text-primary'}>{post.categoryName}</span
									>{/if}
								{#if post.publishedAt}<span
										class={post.thumbnailUrl || index === 0 ? 'text-white/70' : 'text-ink-muted'}
										>{dateFmt.format(new Date(post.publishedAt))}</span
									>{/if}
							</div>
							<h3
								class="font-display font-bold text-balance {index === 0
									? 'text-2xl sm:text-3xl'
									: 'text-xl'}"
							>
								{post.title}
							</h3>
							{#if post.excerpt}
								<p
									class="mt-2 line-clamp-2 text-sm {post.thumbnailUrl || index === 0
										? 'text-white/75'
										: 'text-ink-muted'}"
								>
									{post.excerpt}
								</p>
							{/if}
							<span
								class="mt-4 inline-flex items-center gap-1 text-sm font-bold group-hover:underline"
								>Baca berita <ArrowRight class="size-4" /></span
							>
						</div>
					</a>
				{:else}
					<p class="text-ink-muted">Belum ada berita.</p>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.achievements.length}
		<section>
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<p class="eyebrow mb-1">Capaian Siswa</p>
					<h2 class="font-display text-2xl font-bold sm:text-3xl">
						{landing.achievementsTitle || 'Prestasi'}
					</h2>
				</div>
				<a
					href={resolve('/prestasi')}
					class="shrink-0 text-sm font-semibold text-primary hover:underline">Semua prestasi →</a
				>
			</div>
			<div class="grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
				{#each data.achievements as item, index (item.id)}
					<div
						class="crop-marks flex min-h-44 flex-col justify-between border border-line p-5 {index ===
						0
							? 'bg-primary text-white lg:min-h-56'
							: 'bg-bg'}"
					>
						<div class="flex items-start justify-between gap-4">
							<span
								class="font-mono text-[0.68rem] tracking-widest uppercase {index === 0
									? 'text-accent-on-primary'
									: 'text-success'}"
							>
								{item.level ?? 'Capaian siswa'}
							</span>
							<Trophy
								class="size-5 shrink-0 {index === 0 ? 'text-accent-on-primary' : 'text-primary'}"
							/>
						</div>
						<div>
							<span
								class="mb-2 block font-mono text-xs {index === 0
									? 'text-white/55'
									: 'text-ink-muted'}">0{index + 1}</span
							>
							<h3
								class="font-display font-bold text-balance {index === 0 ? 'text-2xl' : 'text-lg'}"
							>
								{item.title}
							</h3>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.agendas.length}
		<section>
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<p class="eyebrow mb-1">Kegiatan Mendatang</p>
					<h2 class="font-display text-2xl font-bold sm:text-3xl">
						{landing.agendasTitle || 'Agenda'}
					</h2>
				</div>
				<a
					href={resolve('/agenda')}
					class="shrink-0 text-sm font-semibold text-primary hover:underline">Semua agenda →</a
				>
			</div>
			<ul class="divide-y divide-line border border-line bg-bg">
				{#each data.agendas as item (item.id)}
					<li class="flex items-center justify-between gap-4 px-5 py-4">
						<span class="font-medium">{item.title}</span>
						<span class="shrink-0 font-mono text-xs text-ink-muted">
							{dateFmt.format(new Date(item.startDate))}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	@keyframes slider-progress {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
</style>
