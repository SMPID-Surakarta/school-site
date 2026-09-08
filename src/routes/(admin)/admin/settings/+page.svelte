<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		dataType: 'json'
	});

	let selectedMenuIds = $state<string[]>($form.footerSelectedMenuIds || []);
	let activeTab = $state<'general' | 'contact' | 'social' | 'integration' | 'footer'>('general');

	function toggleMenu(menuId: string) {
		if (selectedMenuIds.includes(menuId)) {
			selectedMenuIds = selectedMenuIds.filter((id) => id !== menuId);
		} else {
			selectedMenuIds = [...selectedMenuIds, menuId];
		}
		$form.footerSelectedMenuIds = selectedMenuIds;
	}

	const tabs = [
		{ id: 'general', label: 'Umum', icon: '⚙️' },
		{ id: 'contact', label: 'Kontak', icon: '📞' },
		{ id: 'social', label: 'Media Sosial', icon: '📱' },
		{ id: 'integration', label: 'Lokasi & Integrasi', icon: '🗺️' },
		{ id: 'footer', label: 'Footer', icon: '📍' }
	] as const;
</script>

<svelte:head><title>Pengaturan — Admin</title></svelte:head>

<section class="mx-auto max-w-4xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Pengaturan Situs</h1>
		<p class="text-sm opacity-70">
			Kelola informasi umum, kontak, media sosial, dan konfigurasi footer.
		</p>
	</header>

	<form method="POST" use:enhance class="space-y-6">
		{#if $message}
			<aside class="card preset-tonal-success p-3 text-sm" role="status">{$message}</aside>
		{/if}

		<!-- Tab Navigation -->
		<div class="card overflow-hidden">
			<div class="flex flex-wrap gap-1 border-b border-line bg-bg-subtle px-4 py-3" role="tablist">
				{#each tabs as tab (tab.id)}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						aria-controls={`tab-panel-${tab.id}`}
						onclick={() => (activeTab = tab.id)}
						class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
						tab.id
							? 'border-primary text-primary'
							: 'border-transparent text-ink-muted hover:text-ink'}"
					>
						<span class="text-base">{tab.icon}</span>
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>

			<!-- Tab Panels -->
			<div class="p-6">
				<!-- Umum Tab -->
				{#if activeTab === 'general'}
					<div
						id="tab-panel-general"
						role="tabpanel"
						aria-labelledby="tab-general"
						class="space-y-4"
					>
						<div class="space-y-4">
							<label class="label">
								<span>Nama Sekolah</span>
								<input class="input" name="schoolName" bind:value={$form.schoolName} />
								{#if $errors.schoolName}<span class="text-sm text-error-500"
										>{$errors.schoolName}</span
									>{/if}
							</label>
							<label class="label">
								<span>Tagline</span>
								<input class="input" name="tagline" bind:value={$form.tagline} />
								{#if $errors.tagline}<span class="text-sm text-error-500">{$errors.tagline}</span
									>{/if}
							</label>
							<label class="label">
								<span>Deskripsi</span>
								<textarea
									class="textarea"
									rows="4"
									name="description"
									bind:value={$form.description}></textarea>
								{#if $errors.description}<span class="text-sm text-error-500"
										>{$errors.description}</span
									>{/if}
							</label>
						</div>
					</div>
				{/if}

				<!-- Kontak Tab -->
				{#if activeTab === 'contact'}
					<div
						id="tab-panel-contact"
						role="tabpanel"
						aria-labelledby="tab-contact"
						class="space-y-4"
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<label class="label sm:col-span-2">
								<span>Alamat</span>
								<textarea class="textarea" rows="3" name="address" bind:value={$form.address}
								></textarea>
								{#if $errors.address}<span class="text-sm text-error-500">{$errors.address}</span
									>{/if}
							</label>
							<label class="label">
								<span>Telepon</span>
								<input class="input" name="phone" bind:value={$form.phone} />
								{#if $errors.phone}<span class="text-sm text-error-500">{$errors.phone}</span>{/if}
							</label>
							<label class="label">
								<span>Email</span>
								<input class="input" type="email" name="email" bind:value={$form.email} />
								{#if $errors.email}<span class="text-sm text-error-500">{$errors.email}</span>{/if}
							</label>
						</div>
					</div>
				{/if}

				<!-- Media Sosial Tab -->
				{#if activeTab === 'social'}
					<div id="tab-panel-social" role="tabpanel" aria-labelledby="tab-social" class="space-y-4">
						<div class="grid gap-4 sm:grid-cols-2">
							<label class="label">
								<span>Instagram</span>
								<input class="input" name="instagram" bind:value={$form.instagram} />
								{#if $errors.instagram}<span class="text-sm text-error-500"
										>{$errors.instagram}</span
									>{/if}
							</label>
							<label class="label">
								<span>YouTube</span>
								<input class="input" name="youtube" bind:value={$form.youtube} />
								{#if $errors.youtube}<span class="text-sm text-error-500">{$errors.youtube}</span
									>{/if}
							</label>
							<label class="label">
								<span>Facebook</span>
								<input class="input" name="facebook" bind:value={$form.facebook} />
								{#if $errors.facebook}<span class="text-sm text-error-500">{$errors.facebook}</span
									>{/if}
							</label>
							<label class="label">
								<span>TikTok</span>
								<input class="input" name="tiktok" bind:value={$form.tiktok} />
								{#if $errors.tiktok}<span class="text-sm text-error-500">{$errors.tiktok}</span
									>{/if}
							</label>
						</div>
						<p class="rounded bg-primary-50 px-3 py-2 text-xs text-ink">
							💡 Masukkan URL lengkap profile media sosial Anda (contoh:
							https://instagram.com/namasekolah)
						</p>
					</div>
				{/if}

				<!-- Lokasi & Integrasi Tab -->
				{#if activeTab === 'integration'}
					<div
						id="tab-panel-integration"
						role="tabpanel"
						aria-labelledby="tab-integration"
						class="space-y-4"
					>
						<label class="label">
							<span>URL Google Maps Embed</span>
							<textarea
								class="textarea"
								rows="3"
								name="googleMapsEmbed"
								placeholder="https://www.google.com/maps/embed?pb=..."
								bind:value={$form.googleMapsEmbed}></textarea>
							<p class="text-xs text-ink-muted">
								Gunakan URL pada atribut <code class="font-mono">src</code> dari Google Maps Embed, bukan
								seluruh kode iframe.
							</p>
							{#if $errors.googleMapsEmbed}<span class="text-sm text-error-500"
									>{$errors.googleMapsEmbed}</span
								>{/if}
						</label>
						{#if $form.googleMapsEmbed?.startsWith('http')}
							<div class="space-y-2 border-t border-line pt-4">
								<p class="text-sm font-semibold">Pratinjau peta</p>
								<iframe
									src={$form.googleMapsEmbed}
									title="Pratinjau Google Maps"
									loading="lazy"
									referrerpolicy="no-referrer-when-downgrade"
									class="h-48 w-full border border-line"
								></iframe>
							</div>
						{/if}
						<label class="label">
							<span>Google Analytics ID</span>
							<input class="input" name="googleAnalyticsId" bind:value={$form.googleAnalyticsId} />
							<p class="text-xs text-ink-muted">Contoh: G-XXXXXXXXXX</p>
							{#if $errors.googleAnalyticsId}<span class="text-sm text-error-500"
									>{$errors.googleAnalyticsId}</span
								>{/if}
						</label>
					</div>
				{/if}

				<!-- Footer Tab -->
				{#if activeTab === 'footer'}
					<div id="tab-panel-footer" role="tabpanel" aria-labelledby="tab-footer" class="space-y-4">
						<label class="label">
							<span>Teks Branding Footer</span>
							<textarea
								class="textarea"
								rows="2"
								name="footerBrandingText"
								placeholder="Deskripsi singkat tentang sekolah untuk footer..."
								bind:value={$form.footerBrandingText}></textarea>
							<p class="text-xs text-ink-muted">
								Opsional. Jika kosong, footer hanya menampilkan nama sekolah.
							</p>
							{#if $errors.footerBrandingText}<span class="text-sm text-error-500"
									>{$errors.footerBrandingText}</span
								>{/if}
						</label>
						<label class="label">
							<span>Teks Copyright Kustom</span>
							<input
								class="input"
								name="footerCopyrightText"
								placeholder="© 2026 · Nama Sekolah"
								bind:value={$form.footerCopyrightText}
							/>
							<p class="text-xs text-ink-muted">
								Opsional. Jika kosong, akan menampilkan format default: © [tahun] · [nama sekolah]
							</p>
							{#if $errors.footerCopyrightText}<span class="text-sm text-error-500"
									>{$errors.footerCopyrightText}</span
								>{/if}
						</label>

						<div class="border-t border-line pt-4">
							<p class="mb-3 text-sm font-semibold">Elemen yang Ditampilkan di Footer</p>
							<div class="space-y-2">
								<label class="label cursor-pointer">
									<input type="checkbox" bind:checked={$form.footerShowContactSection} />
									<span>Tampilkan Bagian Kontak (alamat, telepon, email)</span>
								</label>
								<label class="label cursor-pointer">
									<input type="checkbox" bind:checked={$form.footerShowQuickLinksSection} />
									<span>Tampilkan Tautan Cepat</span>
								</label>
								<label class="label cursor-pointer">
									<input type="checkbox" bind:checked={$form.footerShowLocationSection} />
									<span>Tampilkan Peta Lokasi (Google Maps Embed)</span>
								</label>
								<label class="label cursor-pointer">
									<input type="checkbox" bind:checked={$form.footerShowSocialMedia} />
									<span>Tampilkan Ikon Media Sosial</span>
								</label>
							</div>
						</div>

						{#if $form.footerShowQuickLinksSection && data.menus.length > 0}
							<div class="border-t border-line pt-4">
								<p class="mb-3 text-sm font-semibold">Tautan untuk Ditampilkan di Footer</p>
								<p class="mb-3 text-xs text-ink-muted">
									Pilih menu/tautan mana yang ingin ditampilkan di bagian "Tautan Cepat" footer.
									Kosong = tampilkan semua menu utama.
								</p>
								<div class="space-y-2">
									{#each data.menus as menu (menu.id)}
										<label class="label cursor-pointer">
											<input
												type="checkbox"
												checked={selectedMenuIds.includes(menu.id)}
												onchange={() => toggleMenu(menu.id)}
											/>
											<span>{menu.title}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center justify-end gap-2">
			<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
				{$submitting ? 'Menyimpan…' : 'Simpan Pengaturan'}
			</button>
		</div>
	</form>
</section>
