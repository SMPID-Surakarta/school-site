<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<svelte:head><title>Pesan Masuk — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Pesan Masuk</h1>
		<p class="text-sm opacity-70">{data.contacts.length} pesan</p>
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Nama</th>
					<th>Email</th>
					<th>Tanggal</th>
					<th>Status</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.contacts as item (item.id)}
					<tr class={item.read ? '' : 'font-semibold'}>
						<td>{item.name}</td>
						<td class="opacity-80">{item.email}</td>
						<td class="opacity-80">{fmt.format(new Date(item.createdAt))}</td>
						<td>
							{#if item.repliedAt}
								<span class="badge preset-tonal-success">Dibalas</span>
							{:else if item.read}
								<span class="badge preset-tonal">Dibaca</span>
							{:else}
								<span class="badge preset-tonal-warning">Baru</span>
							{/if}
						</td>
						<td>
							<div class="flex justify-end">
								<a href={resolve(`/admin/contacts/${item.id}`)} class="btn btn-sm preset-tonal"
									>Lihat</a
								>
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="py-8 text-center opacity-60">Belum ada pesan.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
