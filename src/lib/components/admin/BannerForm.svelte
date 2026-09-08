<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import ImageUpload from './ImageUpload.svelte';
	import type { CreateBannerInput } from '$lib/server/validators/banners';

	type Props = {
		data: SuperValidated<CreateBannerInput>;
		submitLabel: string;
		storageEnabled?: boolean;
		imageUrl?: string | null;
	};

	let { data, submitLabel, storageEnabled = false, imageUrl = null }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data, {
		dataType: 'json'
	});

	// svelte-ignore state_referenced_locally
	let imagePreview = $state(imageUrl);
</script>

<form method="POST" use:enhance class="space-y-6">
	{#if $message}
		<aside class="card preset-tonal-error p-3 text-sm">{$message}</aside>
	{/if}

	<div class="card grid gap-4 p-6 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<ImageUpload
				bind:value={$form.imageMediaId}
				bind:previewUrl={imagePreview}
				label="Background Banner"
				enabled={storageEnabled}
			/>
			{#if $errors.imageMediaId}<span class="text-sm text-error-500">{$errors.imageMediaId}</span
				>{/if}
			<p class="mt-2 text-xs text-ink-muted">
				Gunakan gambar lanskap beresolusi tinggi. Gambar ini menjadi background slide di beranda.
			</p>
		</div>

		<label class="label sm:col-span-2">
			<span>Judul</span>
			<input class="input" name="title" bind:value={$form.title} />
			{#if $errors.title}<span class="text-sm text-error-500">{$errors.title}</span>{/if}
		</label>

		<label class="label">
			<span>Ukuran Judul (px)</span>
			<input
				class="input"
				type="number"
				min="24"
				max="96"
				step="1"
				name="titleFontSize"
				bind:value={$form.titleFontSize}
			/>
			{#if $errors.titleFontSize}<span class="text-sm text-error-500">{$errors.titleFontSize}</span
				>{/if}
		</label>

		<label class="label sm:col-span-2">
			<span>Subjudul</span>
			<input class="input" name="subtitle" bind:value={$form.subtitle} />
		</label>

		<label class="label">
			<span>Teks Tombol</span>
			<input class="input" name="buttonText" bind:value={$form.buttonText} />
		</label>

		<label class="label">
			<span>URL Tombol</span>
			<input class="input" name="buttonUrl" bind:value={$form.buttonUrl} placeholder="/ppdb" />
			{#if $errors.buttonUrl}<span class="text-sm text-error-500">{$errors.buttonUrl}</span>{/if}
		</label>

		<label class="label">
			<span>Mulai <span class="opacity-60">(opsional)</span></span>
			<input class="input" type="datetime-local" name="startAt" bind:value={$form.startAt} />
		</label>

		<label class="label">
			<span>Selesai <span class="opacity-60">(opsional)</span></span>
			<input class="input" type="datetime-local" name="endAt" bind:value={$form.endAt} />
		</label>

		<label class="label">
			<span>Urutan</span>
			<input class="input" type="number" min="0" name="order" bind:value={$form.order} />
			{#if $errors.order}<span class="text-sm text-error-500">{$errors.order}</span>{/if}
		</label>

		<label class="flex items-center gap-2 pt-6">
			<input class="checkbox" type="checkbox" name="published" bind:checked={$form.published} />
			<span>Terbitkan</span>
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/banners')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
