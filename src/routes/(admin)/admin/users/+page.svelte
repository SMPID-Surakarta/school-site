<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const roleBadge: Record<string, string> = {
		ADMIN: 'preset-tonal-primary',
		EDITOR: 'preset-tonal-secondary',
		STAFF: 'preset-tonal'
	};
</script>

<svelte:head><title>Pengguna — Admin</title></svelte:head>

<section class="mx-auto max-w-5xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Pengguna</h1>
			<p class="text-sm opacity-70">{data.users.length} akun</p>
		</div>
		<a href={resolve('/admin/users/new')} class="btn preset-filled-primary-500">Tambah Pengguna</a>
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Nama</th>
					<th>Email</th>
					<th>Peran</th>
					<th>Status</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as u (u.id)}
					<tr>
						<td class="font-medium">{u.name}</td>
						<td class="opacity-80">{u.email}</td>
						<td><span class="badge {roleBadge[u.role]}">{u.role}</span></td>
						<td>
							<span class="badge {u.isActive ? 'preset-tonal-success' : 'preset-tonal'}">
								{u.isActive ? 'Aktif' : 'Nonaktif'}
							</span>
						</td>
						<td>
							<div class="flex justify-end">
								<a href={resolve(`/admin/users/${u.id}`)} class="btn btn-sm preset-tonal">Edit</a>
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="py-8 text-center opacity-60">Belum ada pengguna.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
