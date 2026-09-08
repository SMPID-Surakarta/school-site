<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });
</script>

<svelte:head><title>Album Galeri — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Album Galeri</h1>
			<p class="text-sm opacity-70">{data.galleries.length} album kegiatan</p>
		</div>
		{#if data.canWrite}
			<a href={resolve('/admin/galleries/new')} class="btn preset-filled-primary-500"
				>Tambah Album</a
			>
		{/if}
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Album</th>
					<th>Tanggal</th>
					<th>Foto</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.galleries as item (item.id)}
					<tr>
						<td>
							<div class="flex items-center gap-3">
								{#if item.coverUrl}
									<img
										src={item.coverUrl}
										alt={item.coverAltText ?? item.title}
										class="h-14 w-20 rounded object-cover"
										loading="lazy"
									/>
								{:else}
									<div class="h-14 w-20 rounded bg-surface-200-800"></div>
								{/if}
								<div>
									<p class="font-medium">{item.title}</p>
									{#if item.description}<p class="line-clamp-1 text-sm opacity-70">
											{item.description}
										</p>{/if}
								</div>
							</div>
						</td>
						<td class="opacity-80">{dateFormatter.format(item.eventDate)}</td>
						<td class="opacity-80">{item.photoCount} foto</td>
						<td>
							{#if data.canWrite}
								<div class="flex justify-end gap-2">
									<a href={resolve(`/admin/galleries/${item.id}`)} class="btn btn-sm preset-tonal"
										>Edit</a
									>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm('Hapus galeri ini?')) e.preventDefault();
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
					<tr><td colspan="4" class="py-8 text-center opacity-60">Belum ada album galeri.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
