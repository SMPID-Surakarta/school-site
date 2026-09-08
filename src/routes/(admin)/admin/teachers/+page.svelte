<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Guru — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Guru &amp; Staf</h1>
			<p class="text-sm opacity-70">{data.teachers.length} data</p>
		</div>
		{#if data.canWrite}
			<a href={resolve('/admin/teachers/new')} class="btn preset-filled-primary-500">Tambah Guru</a>
		{/if}
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Nama</th>
					<th>Jabatan</th>
					<th>Mapel</th>
					<th>Status</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.teachers as teacher (teacher.id)}
					<tr>
						<td class="font-medium">{teacher.name}</td>
						<td class="opacity-80">{teacher.position ?? '—'}</td>
						<td class="opacity-80">{teacher.subject ?? '—'}</td>
						<td>
							<span class="badge {teacher.isActive ? 'preset-tonal-success' : 'preset-tonal'}">
								{teacher.isActive ? 'Aktif' : 'Nonaktif'}
							</span>
						</td>
						<td>
							{#if data.canWrite}
								<div class="flex justify-end gap-2">
									<a href={resolve(`/admin/teachers/${teacher.id}`)} class="btn btn-sm preset-tonal"
										>Edit</a
									>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm('Hapus data guru ini?')) e.preventDefault();
										}}
									>
										<input type="hidden" name="id" value={teacher.id} />
										<button type="submit" class="btn btn-sm preset-tonal-error">Hapus</button>
									</form>
								</div>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="py-8 text-center opacity-60">Belum ada data guru.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
