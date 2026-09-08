<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Halaman — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Halaman</h1>
			<p class="text-sm opacity-70">{data.pages.length} halaman</p>
		</div>
		{#if data.canWrite}
			<a href={resolve('/admin/pages/new')} class="btn preset-filled-primary-500">Tambah Halaman</a>
		{/if}
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Judul</th>
					<th>Slug</th>
					<th>Status</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.pages as item (item.id)}
					<tr>
						<td class="font-medium">{item.title}</td>
						<td class="opacity-80">{item.slug}</td>
						<td>
							<span class="badge {item.published ? 'preset-tonal-success' : 'preset-tonal'}">
								{item.published ? 'Terbit' : 'Draft'}
							</span>
						</td>
						<td>
							{#if data.canWrite}
								<div class="flex justify-end gap-2">
									<a href={resolve(`/admin/pages/${item.id}`)} class="btn btn-sm preset-tonal"
										>Edit</a
									>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm('Hapus halaman ini?')) e.preventDefault();
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
					<tr><td colspan="4" class="py-8 text-center opacity-60">Belum ada halaman.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
