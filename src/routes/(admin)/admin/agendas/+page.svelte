<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
	function formatDate(value: string | Date | null): string {
		if (!value) return '—';
		return fmt.format(new Date(value));
	}

	let confirmRequest = $state<{ message: string; form: HTMLFormElement } | null>(null);

	function askDelete(e: MouseEvent & { currentTarget: HTMLButtonElement }, title: string) {
		const form = e.currentTarget.form;
		if (form) {
			confirmRequest = { message: `Hapus agenda "${title}"?`, form };
		}
	}

	function handleConfirm() {
		confirmRequest?.form.requestSubmit();
		confirmRequest = null;
	}
</script>

<svelte:head><title>Agenda — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<div>
			<h1 class="h2">Agenda</h1>
			<p class="text-sm opacity-70">{data.agendas.length} data</p>
		</div>
		{#if data.canWrite}
			<a href={resolve('/admin/agendas/new')} class="btn preset-filled-primary-500">Tambah Agenda</a
			>
		{/if}
	</header>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Judul</th>
					<th>Mulai</th>
					<th>Lokasi</th>
					<th class="text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.agendas as item (item.id)}
					<tr>
						<td class="font-medium">{item.title}</td>
						<td class="opacity-80">{formatDate(item.startDate)}</td>
						<td class="opacity-80">{item.location ?? '—'}</td>
						<td>
							{#if data.canWrite}
								<div class="flex justify-end gap-2">
									<a href={resolve(`/admin/agendas/${item.id}`)} class="btn btn-sm preset-tonal"
										>Edit</a
									>
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<button
											type="button"
											class="btn btn-sm preset-tonal-error"
											onclick={(e) => askDelete(e, item.title)}
										>
											Hapus
										</button>
									</form>
								</div>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="py-8 text-center opacity-60">Belum ada agenda.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<ConfirmDialog
		open={confirmRequest !== null}
		title="Hapus Agenda"
		message={confirmRequest?.message ?? ''}
		onconfirm={handleConfirm}
		oncancel={() => (confirmRequest = null)}
	/>
</section>
