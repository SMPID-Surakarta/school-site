<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { Seo, pageTitle } from '$lib/seo';
	import { Mail, MapPin, Phone } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const settings = $derived(page.data.settings);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		resetForm: true
	});
</script>

<Seo
	{siteName}
	title="Kontak"
	fullTitle={pageTitle('Kontak', siteName)}
	description="Hubungi {siteName}."
	canonical={`${origin}${resolve('/kontak')}`}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Terhubung dengan sekolah</p>
		<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Kontak</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
			Punya pertanyaan tentang sekolah? Sampaikan pesan kepada tim kami.
		</p>
	</div>
</section>

<section class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
	<div class="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
		<div class="space-y-5">
			<div class="mb-6 border-b border-line pb-4">
				<p class="eyebrow">Informasi utama</p>
				<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Mari berbincang</h2>
			</div>
			{#if settings?.address}
				<div class="flex gap-3">
					<MapPin class="mt-0.5 shrink-0 text-primary-500" size={20} aria-hidden="true" />
					<div>
						<p class="font-semibold text-ink">Alamat</p>
						<p class="mt-1 text-sm leading-6 text-ink-muted">{settings.address}</p>
					</div>
				</div>
			{/if}
			{#if settings?.phone}
				<div class="flex gap-3">
					<Phone class="mt-0.5 shrink-0 text-primary-500" size={20} aria-hidden="true" />
					<div>
						<p class="font-semibold text-ink">Telepon</p>
						<p class="mt-1 text-sm text-ink-muted">{settings.phone}</p>
					</div>
				</div>
			{/if}
			{#if settings?.email}
				<div class="flex gap-3">
					<Mail class="mt-0.5 shrink-0 text-primary-500" size={20} aria-hidden="true" />
					<div>
						<p class="font-semibold text-ink">Email</p>
						<p class="mt-1 text-sm text-ink-muted">{settings.email}</p>
					</div>
				</div>
			{/if}
			{#if settings?.googleMapsEmbed?.startsWith('http')}
				<div class="space-y-3 border-t border-line pt-5">
					<div class="flex items-center gap-3">
						<MapPin class="shrink-0 text-primary-500" size={20} aria-hidden="true" />
						<h2 class="font-display text-lg font-semibold text-ink">Lokasi sekolah</h2>
					</div>
					<iframe
						src={settings.googleMapsEmbed}
						title="Peta lokasi {siteName}"
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						class="h-64 w-full border border-line bg-bg sm:h-72"
					></iframe>
				</div>
			{/if}
		</div>

		<form
			method="POST"
			use:enhance
			class="card space-y-4 border border-line bg-bg p-5 shadow-sm sm:p-7"
		>
			<div class="mb-2 border-b border-line pb-4">
				<p class="eyebrow">Kirim pesan</p>
				<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Hubungi kami</h2>
			</div>
			{#if $message}
				<aside class="card preset-tonal-success p-3 text-sm">
					<strong class="block font-semibold">Pesan berhasil dikirim</strong>
					<span class="mt-1 block">{$message}</span>
				</aside>
			{/if}

			<label class="label">
				<span>Nama</span>
				<input class="input" name="name" bind:value={$form.name} />
				{#if $errors.name}<span class="text-sm text-error-500">{$errors.name}</span>{/if}
			</label>

			<label class="label">
				<span>Email <span class="opacity-60">(opsional)</span></span>
				<input class="input" type="email" name="email" bind:value={$form.email} />
				{#if $errors.email}<span class="text-sm text-error-500">{$errors.email}</span>{/if}
			</label>

			<label class="label">
				<span>Nomor WhatsApp</span>
				<input class="input" name="phone" bind:value={$form.phone} />
				{#if $errors.phone}<span class="text-sm text-error-500">{$errors.phone}</span>{/if}
			</label>

			<label class="label">
				<span>Pesan</span>
				<textarea class="textarea" rows="5" name="message" bind:value={$form.message}></textarea>
				{#if $errors.message}<span class="text-sm text-error-500">{$errors.message}</span>{/if}
			</label>

			<button type="submit" class="btn preset-filled-primary-500 w-full" disabled={$submitting}>
				{$submitting ? 'Mengirim…' : 'Kirim Pesan'}
			</button>
		</form>
	</div>
</section>
