<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { CreateGalleryInput } from '$lib/server/validators/galleries';

	type ExistingPhoto = {
		id: string;
		mediaId: string;
		url: string;
		altText: string | null;
	};

	type PendingPhoto = {
		mediaId: string;
		url: string;
		altText: string | null;
	};

	type Props = {
		data: SuperValidated<CreateGalleryInput>;
		submitLabel: string;
		existingPhotos?: ExistingPhoto[];
		uploadEnabled?: boolean;
	};

	let { data, submitLabel, existingPhotos = [], uploadEnabled = true }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data, {
		dataType: 'json'
	});

	let fileInput = $state<HTMLInputElement>();
	let uploading = $state(false);
	let progress = $state('');
	let uploadError = $state<string | null>(null);
	let pendingPhotos = $state<PendingPhoto[]>([]);

	async function onFilesPicked(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		target.value = '';
		if (!files.length) return;

		uploading = true;
		uploadError = null;
		let done = 0;
		for (const file of files) {
			progress = `Mengunggah ${done + 1}/${files.length}...`;
			try {
				const body = new FormData();
				body.set('file', file);
				body.set('kind', 'image');
				body.set('altText', $form.title || file.name);
				const res = await fetch('/admin/api/media', { method: 'POST', body });
				if (!res.ok) {
					uploadError = 'Sebagian foto gagal diunggah';
					continue;
				}
				const media = (await res.json()) as { id: string; url: string; altText: string | null };
				pendingPhotos = [
					...pendingPhotos,
					{ mediaId: media.id, url: media.url, altText: media.altText }
				];
				$form.photoMediaIds = [...$form.photoMediaIds, media.id];
				if (!$form.coverMediaId) $form.coverMediaId = media.id;
			} catch {
				uploadError = 'Sebagian foto gagal diunggah';
			}
			done += 1;
		}
		uploading = false;
		progress = '';
	}

	function removePending(mediaId: string) {
		pendingPhotos = pendingPhotos.filter((photo) => photo.mediaId !== mediaId);
		$form.photoMediaIds = $form.photoMediaIds.filter((id) => id !== mediaId);
		if ($form.coverMediaId === mediaId) {
			$form.coverMediaId = existingPhotos[0]?.mediaId ?? pendingPhotos[0]?.mediaId;
		}
	}
</script>

<form method="POST" use:enhance class="space-y-6">
	{#if $message}
		<aside class="card preset-tonal-error p-3 text-sm">{$message}</aside>
	{/if}

	<div class="card grid gap-4 p-6 sm:grid-cols-2">
		<label class="label sm:col-span-2">
			<span>Nama album</span>
			<input class="input" name="title" bind:value={$form.title} />
			{#if $errors.title}<span class="text-sm text-error-500">{$errors.title}</span>{/if}
		</label>

		<label class="label">
			<span>Tanggal kegiatan</span>
			<input class="input" type="date" name="eventDate" bind:value={$form.eventDate} />
			{#if $errors.eventDate}<span class="text-sm text-error-500">{$errors.eventDate}</span>{/if}
		</label>

		<label class="label sm:col-span-2">
			<span>Deskripsi singkat</span>
			<textarea
				class="textarea min-h-28"
				name="description"
				bind:value={$form.description}
				placeholder="Ringkasan kegiatan untuk halaman galeri"></textarea>
			{#if $errors.description}<span class="text-sm text-error-500">{$errors.description}</span
				>{/if}
		</label>
	</div>

	<div class="card space-y-4 p-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="h5">Foto album</h2>
				<p class="text-sm opacity-70">Unggah beberapa foto, lalu pilih satu sebagai cover.</p>
			</div>
			{#if uploadEnabled}
				<button
					type="button"
					class="btn preset-tonal"
					onclick={() => fileInput?.click()}
					disabled={uploading}
				>
					{uploading ? progress : 'Unggah Foto'}
				</button>
			{/if}
		</div>

		{#if !uploadEnabled}
			<p class="text-sm opacity-60">Unggah media sedang dinonaktifkan.</p>
		{/if}
		{#if uploadError}<aside class="card preset-tonal-error p-3 text-sm">{uploadError}</aside>{/if}

		{#if existingPhotos.length === 0 && pendingPhotos.length === 0}
			<div
				class="rounded border border-dashed border-surface-300-700 p-8 text-center text-sm opacity-60"
			>
				Belum ada foto album.
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each existingPhotos as photo (photo.id)}
					<div class="space-y-2 rounded border border-surface-200-800 p-2">
						<img
							src={photo.url}
							alt={photo.altText ?? $form.title}
							class="aspect-square w-full rounded object-cover"
							loading="lazy"
						/>
						<label class="flex items-center gap-2 text-xs">
							<input type="radio" bind:group={$form.coverMediaId} value={photo.mediaId} />
							<span>Cover</span>
						</label>
					</div>
				{/each}

				{#each pendingPhotos as photo (photo.mediaId)}
					<div class="space-y-2 rounded border border-primary-200-800 p-2">
						<img
							src={photo.url}
							alt={photo.altText ?? $form.title}
							class="aspect-square w-full rounded object-cover"
							loading="lazy"
						/>
						<label class="flex items-center gap-2 text-xs">
							<input type="radio" bind:group={$form.coverMediaId} value={photo.mediaId} />
							<span>Cover</span>
						</label>
						<button
							type="button"
							class="btn btn-sm preset-tonal-error w-full"
							onclick={() => removePending(photo.mediaId)}
						>
							Batal
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={onFilesPicked}
		/>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/galleries')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan...' : submitLabel}
		</button>
	</div>
</form>

{#if existingPhotos.length > 0}
	<div class="card space-y-4 p-6">
		<h2 class="h5">Hapus foto dari album</h2>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each existingPhotos as photo (photo.id)}
				<form
					method="POST"
					action="?/removePhoto"
					class="space-y-2 rounded border border-surface-200-800 p-2"
				>
					<img
						src={photo.url}
						alt={photo.altText ?? 'Foto album'}
						class="aspect-square w-full rounded object-cover"
						loading="lazy"
					/>
					<input type="hidden" name="photoId" value={photo.id} />
					<button
						type="submit"
						class="btn btn-sm preset-tonal-error w-full"
						onclick={(event) => {
							if (!confirm('Hapus foto ini dari album?')) event.preventDefault();
						}}
					>
						Hapus
					</button>
				</form>
			{/each}
		</div>
	</div>
{/if}
