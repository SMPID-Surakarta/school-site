<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { can } from '$lib/rbac';
	import { Trash2, Upload, Copy, Check } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let fileInput = $state<HTMLInputElement>();
	let uploading = $state(false);
	let progress = $state('');
	let uploadError = $state<string | null>(null);
	let copiedId = $state<string | null>(null);

	const sizeFmt = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

	function canDelete(uploadedBy: string | null): boolean {
		return can(data.role, 'delete', 'media', { userId: data.userId, ownerId: uploadedBy });
	}

	async function onFilesPicked(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		target.value = '';
		if (!files.length) return;

		uploading = true;
		uploadError = null;
		let done = 0;
		for (const file of files) {
			progress = `Mengunggah ${done + 1}/${files.length}…`;
			try {
				const body = new FormData();
				body.set('file', file);
				body.set('kind', file.type.startsWith('image/') ? 'image' : 'file');
				const res = await fetch('/admin/api/media', { method: 'POST', body });
				if (!res.ok) uploadError = 'Sebagian berkas gagal diunggah';
			} catch {
				uploadError = 'Sebagian berkas gagal diunggah';
			}
			done += 1;
		}
		uploading = false;
		progress = '';
		await invalidateAll();
	}

	async function copyUrl(id: string, url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedId = id;
			setTimeout(() => (copiedId = null), 1500);
		} catch {
			copiedId = null;
		}
	}
</script>

<svelte:head><title>Media — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Media Library</h1>
			<p class="text-sm opacity-70">{data.media.length} berkas</p>
		</div>
		{#if data.uploadEnabled}
			<button
				type="button"
				class="btn preset-filled-primary-500"
				onclick={() => fileInput?.click()}
				disabled={uploading}
			>
				<Upload size={16} />
				<span>{uploading ? progress : 'Unggah'}</span>
			</button>
		{/if}
	</header>

	{#if !data.uploadEnabled}
		<aside class="card preset-tonal-warning p-4 text-sm">
			Fitur unggah media dinonaktifkan karena Cloudflare R2 belum dikonfigurasi.
		</aside>
	{/if}
	{#if uploadError}
		<aside class="card preset-tonal-error p-3 text-sm">{uploadError}</aside>
	{/if}

	{#if data.media.length === 0}
		<div class="card py-16 text-center opacity-60">Belum ada media.</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each data.media as item (item.id)}
				<div class="card space-y-2 overflow-hidden p-2">
					<div
						class="flex aspect-square items-center justify-center overflow-hidden rounded bg-surface-200-800"
					>
						{#if item.mime.startsWith('image/')}
							<img
								src={item.url}
								alt={item.altText ?? item.originalName}
								class="h-full w-full object-cover"
							/>
						{:else}
							<span class="p-2 text-center text-xs opacity-60">{item.mime}</span>
						{/if}
					</div>
					<p class="truncate text-xs" title={item.originalName}>{item.originalName}</p>
					<p class="text-xs opacity-60">{sizeFmt(item.size)}</p>
					<div class="flex items-center justify-between gap-1">
						<button
							type="button"
							class="btn btn-sm preset-tonal"
							title="Salin URL"
							onclick={() => copyUrl(item.id, item.url)}
						>
							{#if copiedId === item.id}<Check size={14} />{:else}<Copy size={14} />{/if}
						</button>
						{#if canDelete(item.uploadedBy)}
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									return async ({ update }) => update();
								}}
								onsubmit={(e) => {
									if (!confirm('Hapus media ini?')) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={item.id} />
								<button type="submit" class="btn btn-sm preset-tonal-error" title="Hapus">
									<Trash2 size={14} />
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	multiple
	class="hidden"
	onchange={onFilesPicked}
/>
