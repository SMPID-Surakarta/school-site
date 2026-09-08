<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Unduhan — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Unduhan</h1>
			<p class="text-sm opacity-70">{data.downloads.length} berkas</p>
		</div>
		{#if data.canWrite}
			<a href={resolve('/admin/downloads/new')} class="btn preset-filled-primary-500"
				>Tambah Berkas</a
			>
		{/if}
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Judul</th>
					<th>Link</th>
					<th>Kategori</th>
					<th>Ukuran</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.downloads as item (item.id)}
					<tr>
						<td class="font-medium">{item.title}</td>
						<td>
							{#if item.url}
								<!-- eslint-disable svelte/no-navigation-without-resolve -- URL berkas dikelola admin -->
								<a
									href={item.url}
									target="_blank"
									rel="noreferrer"
									class="text-primary-600 underline"
								>
									buka</a
								>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{:else}—{/if}
						</td>
						<td class="opacity-80">{item.category ?? '—'}</td>
						<td class="opacity-80">{item.size ?? '—'}</td>
						<td>
							{#if data.canWrite}
								<div class="flex justify-end gap-2">
									<a href={resolve(`/admin/downloads/${item.id}`)} class="btn btn-sm preset-tonal"
										>Edit</a
									>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm('Hapus berkas ini?')) e.preventDefault();
										}}
									>
										<input type="hidden" name="id" value={item.id} />
										<button type="submit" class="btn btn-sm preset-tonal-error">Hapus</button>
									</form>
								</div>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="py-8 text-center opacity-60">Belum ada berkas.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
