<script lang="ts">
	type Props = {
		/** Bound media id (FK to `media.id`). */
		value?: string;
		/** Bound preview URL for the current/just-uploaded media. */
		previewUrl?: string | null;
		label?: string;
		altText?: string;
		/** 'image' processes to WebP/AVIF; 'file' stores documents as-is. */
		kind?: 'image' | 'file';
		/** When false, upload controls are hidden. */
		enabled?: boolean;
	};

	let {
		// eslint-disable-next-line no-useless-assignment -- $bindable default; value is read in the template
		value = $bindable(),
		previewUrl = $bindable(null),
		label = 'Gambar',
		altText = '',
		kind = 'image',
		enabled = true
	}: Props = $props();

	let uploading = $state(false);
	let errorMsg = $state<string | null>(null);

	async function onChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		errorMsg = null;
		try {
			const body = new FormData();
			body.append('file', file);
			body.append('kind', kind);
			if (kind === 'image') body.append('altText', altText.trim() || label);
			const res = await fetch('/admin/api/media', { method: 'POST', body });
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { message?: string };
				throw new Error(data.message ?? 'Gagal mengunggah');
			}
			const media = (await res.json()) as { id: string; url: string };
			value = media.id;
			previewUrl = media.url;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Gagal mengunggah';
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	function clear() {
		value = undefined;
		previewUrl = null;
	}
</script>

<div class="label">
	<span>{label}</span>

	{#if !enabled}
		<p class="text-sm opacity-60">Unggah media sedang dinonaktifkan.</p>
	{:else}
		<div class="flex items-center gap-4">
			{#if previewUrl}
				{#if kind === 'image'}
					<img
						src={previewUrl}
						alt={label}
						class="border-surface-200-800 h-20 w-20 rounded border object-cover"
						loading="lazy"
					/>
				{:else}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external R2 URL -->
					<a href={previewUrl} target="_blank" rel="noreferrer" class="text-sm underline">
						Berkas tersimpan
					</a>
				{/if}
				<button type="button" class="btn btn-sm preset-tonal-error" onclick={clear}>Hapus</button>
			{/if}

			<label class="btn btn-sm preset-tonal cursor-pointer">
				{uploading ? 'Mengunggah…' : previewUrl ? 'Ganti' : 'Unggah'}
				<input
					type="file"
					class="hidden"
					accept={kind === 'image' ? 'image/*' : undefined}
					disabled={uploading}
					onchange={onChange}
				/>
			</label>
		</div>

		{#if errorMsg}<span class="text-sm text-error-500">{errorMsg}</span>{/if}
	{/if}
</div>
