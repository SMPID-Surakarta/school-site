<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import { ArrowLeft, Pencil, Plus, X } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const {
		form,
		errors,
		message,
		submitting,
		enhance: formEnhance,
		reset
	} = superForm(data.form, {
		resetForm: true
	});

	const editing = $derived(Boolean($form.id));
	const numberFmt = new Intl.NumberFormat('id-ID');

	/** Isi form dengan kategori terpilih untuk rename (ala edit label Blogger). */
	function startEdit(cat: (typeof data.categories)[number]) {
		$form.id = cat.id;
		$form.name = cat.name;
		$form.slug = cat.slug;
	}

	function cancelEdit() {
		reset();
	}

	/** Hapus ditunda sampai dikonfirmasi lewat modal; form disubmit manual. */
	let confirmRequest = $state<{ message: string; form: HTMLFormElement } | null>(null);

	function askDelete(e: MouseEvent & { currentTarget: HTMLButtonElement }, name: string) {
		const form = e.currentTarget.form;
		if (form) {
			confirmRequest = {
				message: `Hapus kategori "${name}"? Berita yang memakainya tidak ikut terhapus.`,
				form
			};
		}
	}

	function handleConfirm() {
		confirmRequest?.form.requestSubmit();
		confirmRequest = null;
	}
</script>

<svelte:head><title>Kategori — Admin</title></svelte:head>

<section class="mx-auto max-w-4xl space-y-6 px-4 py-10">
	<header class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="h2">Kategori</h1>
			<p class="text-sm opacity-70">Kelola kategori berita seperti label di Blogger</p>
		</div>
		<a href={resolve('/admin/posts')} class="btn preset-tonal">
			<ArrowLeft size={16} aria-hidden="true" /> Kembali ke Berita
		</a>
	</header>

	{#if $message}
		<div class="card preset-tonal-success p-3 text-sm">{$message}</div>
	{/if}

	{#if data.canWrite}
		<form method="POST" action="?/save" use:formEnhance class="card space-y-3 p-4">
			<h2 class="font-semibold">{editing ? 'Ubah Kategori' : 'Tambah Kategori'}</h2>
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex flex-wrap items-start gap-3">
				<label class="label flex-1 min-w-[12rem]">
					<span class="text-sm">Nama</span>
					<input
						class="input"
						type="text"
						name="name"
						bind:value={$form.name}
						placeholder="mis. Pengumuman"
						aria-invalid={$errors.name ? 'true' : undefined}
					/>
					{#if $errors.name}<span class="text-sm text-error-500">{$errors.name}</span>{/if}
				</label>
				<label class="label flex-1 min-w-[12rem]">
					<span class="text-sm">Slug <span class="opacity-60">(opsional, otomatis)</span></span>
					<input
						class="input"
						type="text"
						name="slug"
						bind:value={$form.slug}
						placeholder="mis. pengumuman"
						aria-invalid={$errors.slug ? 'true' : undefined}
					/>
					{#if $errors.slug}<span class="text-sm text-error-500">{$errors.slug}</span>{/if}
				</label>
				<div class="flex gap-2 pt-6">
					<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
						{#if editing}Simpan{:else}<Plus size={16} aria-hidden="true" /> Tambah{/if}
					</button>
					{#if editing}
						<button type="button" class="btn preset-tonal" onclick={cancelEdit}>
							<X size={16} aria-hidden="true" /> Batal
						</button>
					{/if}
				</div>
			</div>
		</form>
	{/if}

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Nama</th>
					<th>Slug</th>
					<th class="text-right">Jumlah Berita</th>
					{#if data.canWrite}<th class="text-right">Aksi</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each data.categories as cat (cat.id)}
					<tr>
						<td class="font-medium">{cat.name}</td>
						<td class="opacity-70">{cat.slug}</td>
						<td class="text-right tabular-nums opacity-80">{numberFmt.format(cat.postCount)}</td>
						{#if data.canWrite}
							<td>
								<div class="flex justify-end gap-2">
									<button
										type="button"
										class="btn btn-sm preset-tonal"
										onclick={() => startEdit(cat)}
									>
										<Pencil size={14} aria-hidden="true" /> Ubah
									</button>
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={cat.id} />
										<button
											type="button"
											class="btn btn-sm preset-tonal-error"
											onclick={(e) => askDelete(e, cat.name)}>Hapus</button
										>
									</form>
								</div>
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan={data.canWrite ? 4 : 3} class="py-8 text-center opacity-60">
							Belum ada kategori. Tambahkan kategori pertama lewat form di atas.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<ConfirmDialog
		open={confirmRequest !== null}
		title="Hapus Kategori"
		message={confirmRequest?.message ?? ''}
		onconfirm={handleConfirm}
		oncancel={() => (confirmRequest = null)}
	/>
</section>
