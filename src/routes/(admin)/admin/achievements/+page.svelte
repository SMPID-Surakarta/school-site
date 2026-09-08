<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Prestasi — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Prestasi</h1>
			<p class="text-sm opacity-70">{data.achievements.length} data</p>
		</div>
		{#if data.canWrite}
			<a href={resolve('/admin/achievements/new')} class="btn preset-filled-primary-500"
				>Tambah Prestasi</a
			>
		{/if}
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Judul</th>
					<th>Siswa</th>
					<th>Jenis</th>
					<th>Tingkat</th>
					<th>Peringkat</th>
					<th>Tanggal</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.achievements as item (item.id)}
					<tr>
						<td class="font-medium">{item.title}</td>
						<td class="opacity-80">{item.studentName ?? '—'}</td>
						<td class="opacity-80">{item.category ?? '—'}</td>
						<td class="opacity-80">{item.level ?? '—'}</td>
						<td class="opacity-80">{item.rank ?? '—'}</td>
						<td class="opacity-80">{item.date ?? '—'}</td>
						<td>
							{#if data.canWrite}
								<div class="flex justify-end gap-2">
									<a
										href={resolve(`/admin/achievements/${item.id}`)}
										class="btn btn-sm preset-tonal">Edit</a
									>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm('Hapus prestasi ini?')) e.preventDefault();
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
					<tr><td colspan="7" class="py-8 text-center opacity-60">Belum ada prestasi.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
