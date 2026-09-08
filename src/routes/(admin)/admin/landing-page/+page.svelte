<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Building2,
		CalendarDays,
		ExternalLink,
		LayoutTemplate,
		Megaphone,
		Newspaper,
		Plus,
		Save,
		Star,
		Trash2,
		Trophy
	} from '@lucide/svelte';
	import ImageUpload from '$lib/components/admin/ImageUpload.svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		dataType: 'json'
	});

	const sections = [
		{ id: 'hero', label: 'Hero', icon: LayoutTemplate },
		{ id: 'announcement', label: 'Pengumuman', icon: Megaphone },
		{ id: 'pinnedPosts', label: 'Berita Unggulan', icon: Star },
		{ id: 'latestPosts', label: 'Berita Terbaru', icon: Newspaper },
		{ id: 'achievements', label: 'Prestasi', icon: Trophy },
		{ id: 'agendas', label: 'Agenda', icon: CalendarDays },
		{ id: 'facilities', label: 'Fasilitas', icon: Building2 }
	] as const;
	type SectionId = (typeof sections)[number]['id'];
	let activeSection = $state<SectionId>('hero');
	// svelte-ignore state_referenced_locally
	let facilityImagePreviews = $state([...data.facilityImageUrls]);

	function addFacility() {
		if ($form.facilities.length >= 6) return;
		$form.facilities = [...$form.facilities, { title: '', description: '' }];
		facilityImagePreviews = [...facilityImagePreviews, null];
	}

	function removeFacility(index: number) {
		if ($form.facilities.length <= 1) return;
		$form.facilities = $form.facilities.filter((_, itemIndex) => itemIndex !== index);
		facilityImagePreviews = facilityImagePreviews.filter((_, itemIndex) => itemIndex !== index);
	}
</script>

<svelte:head><title>Landing Page — Admin</title></svelte:head>

<section class="mx-auto max-w-5xl space-y-6 px-4 py-10">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="mb-1 font-mono text-xs font-semibold text-primary uppercase">Konten Situs</p>
			<h1 class="h2">Landing Page</h1>
			<p class="mt-1 text-sm text-ink-muted">Atur teks, susunan konten, dan bagian yang tampil.</p>
		</div>
		<a class="btn preset-tonal" href={resolve('/')} target="_blank" rel="noreferrer">
			Lihat halaman <ExternalLink class="size-4" />
		</a>
	</header>

	<form method="POST" use:enhance class="space-y-6">
		{#if $message}
			<aside class="card preset-tonal-success p-3 text-sm">{$message}</aside>
		{/if}

		<div class="card overflow-x-auto">
			<div
				class="flex min-w-max border-b border-line bg-bg"
				role="tablist"
				aria-label="Bagian landing page"
				aria-orientation="horizontal"
			>
				{#each sections as section (section.id)}
					{@const Icon = section.icon}
					<button
						type="button"
						role="tab"
						aria-selected={activeSection === section.id}
						aria-controls={`panel-${section.id}`}
						class="flex min-h-12 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-bg-subtle focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary {activeSection ===
						section.id
							? 'border-primary bg-bg-subtle text-primary'
							: 'border-transparent text-ink-muted'}"
						onclick={() => (activeSection = section.id)}
					>
						<Icon class="size-4 shrink-0" />
						<span>{section.label}</span>
					</button>
				{/each}
			</div>
		</div>

		{#if activeSection === 'hero'}
			<div class="card grid gap-4 p-6 sm:grid-cols-2" role="tabpanel" id="panel-hero">
				<div class="sm:col-span-2">
					<h2 class="h4">Hero</h2>
					<p class="mt-1 text-sm text-ink-muted">
						Kosongkan teks untuk memakai data situs atau banner aktif.
					</p>
				</div>
				<label class="label sm:col-span-2">
					<span>Label Atas</span>
					<input
						class="input"
						name="heroEyebrow"
						bind:value={$form.heroEyebrow}
						placeholder="Sekolah Menengah Kejuruan"
					/>
				</label>
				<label class="label sm:col-span-2">
					<span>Judul Utama</span>
					<input
						class="input"
						name="heroTitle"
						bind:value={$form.heroTitle}
						placeholder="Mengikuti banner aktif atau nama sekolah"
					/>
					{#if $errors.heroTitle}<span class="text-sm text-error-500">{$errors.heroTitle}</span
						>{/if}
				</label>
				<label class="label sm:col-span-2">
					<span>Deskripsi</span>
					<textarea
						class="textarea"
						rows="3"
						name="heroDescription"
						bind:value={$form.heroDescription}
						placeholder="Mengikuti subtitle banner atau deskripsi sekolah"></textarea>
				</label>
				<label class="label">
					<span>Teks Tombol</span>
					<input
						class="input"
						name="heroCtaText"
						bind:value={$form.heroCtaText}
						placeholder="Kenali Sekolah"
					/>
				</label>
				<label class="label">
					<span>Tujuan Tombol</span>
					<input
						class="input"
						name="heroCtaUrl"
						bind:value={$form.heroCtaUrl}
						placeholder="/kontak"
					/>
					{#if $errors.heroCtaUrl}<span class="text-sm text-error-500">{$errors.heroCtaUrl}</span
						>{/if}
				</label>
				<label class="flex items-center gap-3 sm:col-span-2">
					<input class="checkbox" type="checkbox" name="showStats" bind:checked={$form.showStats} />
					<span class="text-sm font-semibold">Tampilkan statistik sekolah di hero</span>
				</label>
			</div>
		{/if}

		{#if activeSection === 'announcement'}
			<div class="card grid gap-4 p-6 sm:grid-cols-2" role="tabpanel" id="panel-announcement">
				<label class="flex items-center gap-3 sm:col-span-2">
					<input
						class="checkbox"
						type="checkbox"
						name="showAnnouncement"
						bind:checked={$form.showAnnouncement}
					/>
					<span class="font-display font-bold">Tampilkan panel pengumuman</span>
				</label>
				<label class="label sm:col-span-2">
					<span>Label Panel</span>
					<input
						class="input"
						name="announcementLabel"
						bind:value={$form.announcementLabel}
						placeholder="PENGUMUMAN"
					/>
				</label>
				<label class="label sm:col-span-2">
					<span>Judul Pengumuman</span>
					<input
						class="input"
						name="announcementTitle"
						bind:value={$form.announcementTitle}
						placeholder="Informasi penting untuk warga sekolah"
					/>
				</label>
				<label class="label sm:col-span-2">
					<span>Deskripsi Pengumuman</span>
					<input
						class="input"
						name="announcementDescription"
						bind:value={$form.announcementDescription}
						placeholder="Tuliskan ringkasan pengumuman."
					/>
				</label>
				<label class="label">
					<span>Teks Tombol</span>
					<input
						class="input"
						name="announcementCtaText"
						bind:value={$form.announcementCtaText}
						placeholder="Lihat Selengkapnya"
					/>
				</label>
				<label class="label">
					<span>Tujuan Tombol</span>
					<input
						class="input"
						name="announcementCtaUrl"
						bind:value={$form.announcementCtaUrl}
						placeholder="/berita"
					/>
					{#if $errors.announcementCtaUrl}<span class="text-sm text-error-500"
							>{$errors.announcementCtaUrl}</span
						>{/if}
				</label>
			</div>
		{/if}

		{#if activeSection === 'pinnedPosts' || activeSection === 'latestPosts' || activeSection === 'achievements' || activeSection === 'agendas'}
			<div class="grid gap-6" role="tabpanel" id={`panel-${activeSection}`}>
				{#if activeSection === 'pinnedPosts'}
					<div class="card space-y-4 p-6">
						<label class="flex items-center gap-3">
							<input
								class="checkbox"
								type="checkbox"
								name="showPinnedPosts"
								bind:checked={$form.showPinnedPosts}
							/>
							<span class="font-display font-bold">Berita Unggulan</span>
						</label>
						<label class="label">
							<span>Judul Bagian</span>
							<input
								class="input"
								name="pinnedPostsTitle"
								bind:value={$form.pinnedPostsTitle}
								placeholder="Berita Unggulan"
							/>
						</label>
					</div>
				{/if}

				{#if activeSection === 'latestPosts'}
					<div class="card space-y-4 p-6">
						<label class="flex items-center gap-3">
							<input
								class="checkbox"
								type="checkbox"
								name="showLatestPosts"
								bind:checked={$form.showLatestPosts}
							/>
							<span class="font-display font-bold">Berita Terbaru</span>
						</label>
						<label class="label">
							<span>Judul Bagian</span>
							<input
								class="input"
								name="latestPostsTitle"
								bind:value={$form.latestPostsTitle}
								placeholder="Berita Terbaru"
							/>
						</label>
						<label class="label">
							<span>Jumlah Berita</span>
							<input
								class="input"
								type="number"
								min="2"
								max="8"
								name="latestPostsLimit"
								bind:value={$form.latestPostsLimit}
							/>
						</label>
					</div>
				{/if}

				{#if activeSection === 'achievements'}
					<div class="card space-y-4 p-6">
						<label class="flex items-center gap-3">
							<input
								class="checkbox"
								type="checkbox"
								name="showAchievements"
								bind:checked={$form.showAchievements}
							/>
							<span class="font-display font-bold">Prestasi</span>
						</label>
						<label class="label">
							<span>Judul Bagian</span>
							<input
								class="input"
								name="achievementsTitle"
								bind:value={$form.achievementsTitle}
								placeholder="Prestasi"
							/>
						</label>
						<label class="label">
							<span>Jumlah Prestasi</span>
							<input
								class="input"
								type="number"
								min="1"
								max="6"
								name="achievementsLimit"
								bind:value={$form.achievementsLimit}
							/>
						</label>
					</div>
				{/if}

				{#if activeSection === 'agendas'}
					<div class="card space-y-4 p-6">
						<label class="flex items-center gap-3">
							<input
								class="checkbox"
								type="checkbox"
								name="showAgendas"
								bind:checked={$form.showAgendas}
							/>
							<span class="font-display font-bold">Agenda</span>
						</label>
						<label class="label">
							<span>Judul Bagian</span>
							<input
								class="input"
								name="agendasTitle"
								bind:value={$form.agendasTitle}
								placeholder="Agenda"
							/>
						</label>
						<label class="label">
							<span>Jumlah Agenda</span>
							<input
								class="input"
								type="number"
								min="1"
								max="10"
								name="agendasLimit"
								bind:value={$form.agendasLimit}
							/>
						</label>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeSection === 'facilities'}
			<div class="card space-y-5 p-6" role="tabpanel" id="panel-facilities">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<label class="flex items-center gap-3">
						<input
							class="checkbox"
							type="checkbox"
							name="showFacilities"
							bind:checked={$form.showFacilities}
						/>
						<span class="font-display font-bold">Fasilitas</span>
					</label>
					<button
						type="button"
						class="btn preset-tonal-primary"
						onclick={addFacility}
						disabled={$form.facilities.length >= 6}
					>
						<Plus class="size-4" /> Tambah fasilitas
					</button>
				</div>

				<label class="label">
					<span>Judul Bagian</span>
					<input
						class="input"
						name="facilitiesTitle"
						bind:value={$form.facilitiesTitle}
						placeholder="Fasilitas Sekolah"
					/>
				</label>

				<div class="grid gap-4 lg:grid-cols-2">
					{#each $form.facilities as facility, index (facility)}
						<fieldset class="space-y-4 border border-line p-4">
							<legend class="px-2 font-mono text-xs font-semibold text-primary uppercase">
								Fasilitas {index + 1}
							</legend>
							<label class="label">
								<span>Nama Fasilitas</span>
								<input
									class="input"
									name={`facilities[${index}].title`}
									bind:value={facility.title}
									placeholder="Laboratorium Praktik"
								/>
								{#if $errors.facilities?.[index]?.title}<span class="text-sm text-error-500"
										>{$errors.facilities[index]?.title}</span
									>{/if}
							</label>
							<ImageUpload
								bind:value={facility.imageMediaId}
								bind:previewUrl={facilityImagePreviews[index]}
								label="Gambar Fasilitas"
								altText={facility.title}
								enabled={data.storageEnabled}
							/>
							{#if $errors.facilities?.[index]?.imageMediaId}<span class="text-sm text-error-500"
									>{$errors.facilities[index]?.imageMediaId}</span
								>{/if}
							<p class="text-xs text-ink-muted">
								Gunakan foto lanskap yang jelas. Gambar akan dipotong ke rasio 4:3.
							</p>
							<label class="label">
								<span>Deskripsi</span>
								<textarea
									class="textarea"
									rows="3"
									name={`facilities[${index}].description`}
									bind:value={facility.description}
									placeholder="Jelaskan kegunaan dan keunggulan fasilitas."></textarea>
							</label>
							<button
								type="button"
								class="btn preset-tonal-error"
								onclick={() => removeFacility(index)}
								disabled={$form.facilities.length <= 1}
								aria-label={`Hapus fasilitas ${index + 1}`}
							>
								<Trash2 class="size-4" /> Hapus
							</button>
						</fieldset>
					{/each}
				</div>
				{#if $errors.facilities && typeof $errors.facilities === 'string'}
					<p class="text-sm text-error-500">{$errors.facilities}</p>
				{/if}
			</div>
		{/if}

		<div class="flex justify-end">
			<button type="submit" class="btn preset-filled-primary-500 shadow-lg" disabled={$submitting}>
				<Save class="size-4" />
				{$submitting ? 'Menyimpan...' : 'Simpan Landing Page'}
			</button>
		</div>
	</form>
</section>
