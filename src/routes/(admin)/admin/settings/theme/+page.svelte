<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { ArrowRight, Check, ExternalLink, Palette, RotateCcw, Save } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import schoolLogo from '$lib/assets/school-logo.smk.png';
	import {
		defaultTheme,
		hexColorPattern,
		themePresets,
		themeStyle,
		whiteContrast
	} from '$lib/utils/theme';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { form, errors, enhance, submitting, message, tainted } = superForm(
		untrack(() => data.form),
		{
			resetForm: false,
			taintedMessage: 'Perubahan tema belum disimpan. Tinggalkan halaman?'
		}
	);
	const previewStyle = $derived(themeStyle($form));
	const primaryValid = $derived(whiteContrast($form.primaryColor) >= 4.5);
	const accentValid = $derived(hexColorPattern.test($form.accentColor));
	const hasChanges = $derived(Object.values($tainted ?? {}).some(Boolean));

	function applyPreset(preset: (typeof themePresets)[number]) {
		$form.primaryColor = preset.primaryColor;
		$form.accentColor = preset.accentColor;
		$message = undefined;
	}
</script>

<svelte:head><title>Tema &amp; Warna - Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-8">
	<header class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="mb-1 font-mono text-xs font-semibold text-primary uppercase">Tampilan Situs</p>
			<h1 class="flex items-center gap-3 font-display text-2xl font-bold">
				<Palette class="size-6 shrink-0" /> Tema &amp; Warna
			</h1>
		</div>
		<a class="btn preset-tonal" href={resolve('/')} target="_blank" rel="noreferrer">
			Lihat situs <ExternalLink class="size-4" />
		</a>
	</header>

	<form method="POST" use:enhance class="space-y-6">
		{#if $message}
			<p
				role={page.status >= 400 ? 'alert' : 'status'}
				class="border-l-4 p-3 text-sm text-ink {page.status >= 400
					? 'border-error-500 bg-error-50'
					: 'border-success bg-success-50'}"
			>
				{$message}
			</p>
		{/if}
		<div class="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			<div class="min-w-0 space-y-7">
				<fieldset>
					<legend class="mb-3 font-display text-base font-semibold">Palet Tema</legend>
					<div class="grid grid-cols-2 gap-3">
						{#each themePresets as preset (preset.name)}
							{@const selected =
								$form.primaryColor.toLowerCase() === preset.primaryColor &&
								$form.accentColor.toLowerCase() === preset.accentColor}
							<button
								type="button"
								aria-pressed={selected}
								onclick={() => applyPreset(preset)}
								class="min-w-0 overflow-hidden rounded border bg-bg text-left {selected
									? 'border-primary ring-1 ring-primary'
									: 'border-line hover:border-primary'}"
							>
								<span class="flex h-12" aria-hidden="true"
									><span class="w-2/3" style:background-color={preset.primaryColor}></span><span
										class="w-1/3"
										style:background-color={preset.accentColor}
									></span></span
								>
								<span
									class="flex min-h-12 items-center justify-between gap-2 px-3 py-2 text-sm font-semibold"
									><span>{preset.name}</span><Check
										class="size-4 shrink-0 {selected ? 'opacity-100' : 'opacity-0'}"
									/></span
								>
							</button>
						{/each}
					</div>
				</fieldset>

				<fieldset class="space-y-4 border-t border-line pt-5">
					<legend class="px-0 font-display text-base font-semibold">Warna Kustom</legend>
					<div>
						<label for="primaryColor" class="mb-2 block text-sm font-semibold">Warna utama</label>
						<div class="flex gap-3">
							<input
								type="color"
								aria-label="Pilih warna utama"
								bind:value={$form.primaryColor}
								class="size-11 shrink-0 cursor-pointer rounded border border-line bg-bg p-1"
							/>
							<input
								id="primaryColor"
								name="primaryColor"
								class="input min-w-0 font-mono"
								bind:value={$form.primaryColor}
								maxlength="7"
								required
								aria-invalid={!primaryValid}
								aria-describedby={!primaryValid || $errors.primaryColor
									? 'primary-error'
									: undefined}
							/>
						</div>
						{#if !primaryValid || $errors.primaryColor}
							<p id="primary-error" class="mt-2 text-sm text-error-700">
								{$errors.primaryColor?.[0] ??
									'Gunakan HEX 6 digit dengan warna lebih gelap agar teks putih terbaca.'}
							</p>
						{/if}
					</div>
					<div>
						<label for="accentColor" class="mb-2 block text-sm font-semibold">Warna aksen</label>
						<div class="flex gap-3">
							<input
								type="color"
								aria-label="Pilih warna aksen"
								bind:value={$form.accentColor}
								class="size-11 shrink-0 cursor-pointer rounded border border-line bg-bg p-1"
							/>
							<input
								id="accentColor"
								name="accentColor"
								class="input min-w-0 font-mono"
								bind:value={$form.accentColor}
								maxlength="7"
								required
								aria-invalid={!accentValid}
								aria-describedby={!accentValid || $errors.accentColor ? 'accent-error' : undefined}
							/>
						</div>
						{#if !accentValid || $errors.accentColor}
							<p id="accent-error" class="mt-2 text-sm text-error-700">
								{$errors.accentColor?.[0] ?? 'Gunakan kode warna HEX 6 digit.'}
							</p>
						{/if}
					</div>
				</fieldset>

				<div class="border-t border-line pt-5">
					<label for="fontFamily" class="mb-3 block font-display text-base font-semibold"
						>Font Teks</label
					>
					<select
						id="fontFamily"
						name="fontFamily"
						class="select w-full"
						bind:value={$form.fontFamily}
					>
						<option value="jakarta">Plus Jakarta Sans</option>
						<option value="grotesk">Space Grotesk</option>
					</select>
					{#if $errors.fontFamily}<p class="mt-2 text-sm text-error-700">
							{$errors.fontFamily}
						</p>{/if}
				</div>
			</div>

			<div class="min-w-0">
				<h2 class="mb-3 font-display text-base font-semibold">Pratinjau</h2>
				<div
					data-theme-preview
					style={previewStyle}
					class="overflow-hidden rounded border border-line bg-bg font-sans text-ink"
				>
					<div class="flex items-center gap-3 border-b border-line px-5 py-4">
						<img
							src={schoolLogo}
							alt=""
							width="40"
							height="40"
							class="size-10 shrink-0 object-contain"
						/>
						<span class="min-w-0 text-sm font-bold wrap-anywhere">{data.schoolName}</span>
					</div>
					<div class="blueprint-grid px-5 py-8 sm:px-6">
						<span class="mb-5 block h-1 w-10 bg-accent"></span>
						<h3
							class="max-w-sm font-display text-2xl leading-tight font-bold text-primary wrap-anywhere"
						>
							Belajar, Berkarya, Berprestasi.
						</h3>
						<p class="mt-3 text-sm leading-relaxed text-ink-muted">
							Membangun kompetensi dan karakter untuk masa depan.
						</p>
						<div class="mt-6 flex flex-wrap gap-3">
							<span
								class="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-white"
								>Profil sekolah <ArrowRight class="size-4" /></span
							>
							<span class="bg-accent px-4 py-2 text-sm font-semibold text-on-accent"
								>Pendaftaran</span
							>
						</div>
					</div>
					<div class="border-t border-line px-5 py-5">
						<p class="text-xs font-semibold text-primary">Kabar Sekolah</p>
						<p class="mt-2 text-sm font-semibold">Ruang tumbuh untuk setiap potensi</p>
						<div
							class="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink-muted"
						>
							<span>Informasi terbaru</span><ArrowRight class="size-4 text-primary" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
			<button
				type="button"
				class="btn preset-tonal"
				disabled={$submitting}
				onclick={() => {
					$form = { ...defaultTheme };
					$message = undefined;
				}}><RotateCcw class="size-4" /> Tema bawaan</button
			>
			<div class="flex flex-wrap items-center gap-4">
				{#if hasChanges}<span class="text-xs text-ink-muted" role="status"
						>Perubahan belum disimpan</span
					>{/if}
				<button
					type="submit"
					class="btn bg-primary text-white hover:bg-primary-700 disabled:opacity-50"
					disabled={$submitting || !primaryValid || !accentValid}
					><Save class="size-4" /> {$submitting ? 'Menyimpan...' : 'Simpan Tema'}</button
				>
			</div>
		</div>
	</form>
</section>
