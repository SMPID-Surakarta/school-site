<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { can } from '$lib/rbac';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import { Pin, PinOff, Plus, RotateCcw, Search, Tags, Trash2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusBadge: Record<string, string> = {
		DRAFT: 'preset-tonal',
		PUBLISHED: 'preset-tonal-success',
		ARCHIVED: 'preset-tonal-warning'
	};

	const statusText: Record<string, string> = {
		DRAFT: 'Draf',
		PUBLISHED: 'Diterbitkan',
		ARCHIVED: 'Arsip'
	};

	const numberFmt = new Intl.NumberFormat('id-ID');
	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

	const inTrash = $derived(data.filters.status === 'TRASH');

	/** Blogger-style status tabs with per-status counts. */
	const tabs = $derived([
		{ status: '', label: 'Semua', count: data.counts.all },
		{ status: 'PUBLISHED', label: 'Diterbitkan', count: data.counts.published },
		{ status: 'DRAFT', label: 'Draf', count: data.counts.draft },
		{ status: 'ARCHIVED', label: 'Arsip', count: data.counts.archived },
		{ status: 'TRASH', label: 'Sampah', count: data.counts.trash }
	]);

	let selected = $state<string[]>([]);

	// Reset selection whenever the visible rows change (pagination/tab/filter navigation),
	// so bulk actions can never target posts from a previous page.
	$effect(() => {
		void data.posts;
		selected = [];
	});

	const allSelected = $derived(
		data.posts.length > 0 && data.posts.every((p) => selected.includes(p.id))
	);

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
	}

	function toggleAll() {
		selected = allSelected ? [] : data.posts.map((p) => p.id);
	}

	function canEdit(authorId: string | null): boolean {
		return can(data.role, 'update', 'posts', { userId: data.userId, ownerId: authorId });
	}

	function canDelete(authorId: string | null): boolean {
		return can(data.role, 'delete', 'posts', { userId: data.userId, ownerId: authorId });
	}

	/** Query string that preserves the active filters; used by tabs + pagination. */
	function buildHref(overrides: { page?: number; status?: string }): string {
		const status = overrides.status ?? data.filters.status;
		const parts = [`page=${overrides.page ?? 1}`];
		if (data.filters.q) parts.push(`q=${encodeURIComponent(data.filters.q)}`);
		if (status) parts.push(`status=${status}`);
		if (data.filters.categoryId) parts.push(`categoryId=${data.filters.categoryId}`);
		return `?${parts.join('&')}`;
	}

	function rowDate(post: (typeof data.posts)[number]): string {
		if (post.deletedAt) return `Dihapus ${dateFmt.format(new Date(post.deletedAt))}`;
		if (post.status === 'PUBLISHED' && post.publishedAt) {
			return dateFmt.format(new Date(post.publishedAt));
		}
		return `Diperbarui ${dateFmt.format(new Date(post.updatedAt))}`;
	}

	/** Aksi destruktif ditunda sampai dikonfirmasi lewat modal; form disubmit manual. */
	type ConfirmRequest = {
		title: string;
		message: string;
		confirmLabel: string;
		form: HTMLFormElement;
	};

	let confirmRequest = $state<ConfirmRequest | null>(null);

	function askConfirm(
		e: MouseEvent & { currentTarget: HTMLButtonElement },
		req: Omit<ConfirmRequest, 'form'>
	) {
		const form = e.currentTarget.form;
		if (form) confirmRequest = { ...req, form };
	}

	function handleConfirm() {
		confirmRequest?.form.requestSubmit();
		confirmRequest = null;
	}
</script>

<svelte:head><title>Berita — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-5 px-4 py-10">
	<header class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="h2">Berita</h1>
			<p class="text-sm opacity-70">Kelola artikel seperti di Blogger</p>
		</div>
		<div class="flex items-center gap-2">
			<a href={resolve('/admin/categories')} class="btn preset-tonal">
				<Tags size={16} aria-hidden="true" /> Kategori
			</a>
			{#if data.canCreate}
				<a href={resolve('/admin/posts/new')} class="btn preset-filled-primary-500">
					<Plus size={16} aria-hidden="true" /> Berita Baru
				</a>
			{/if}
		</div>
	</header>

	<!-- Status tabs (Blogger-style) -->
	<nav class="flex flex-wrap gap-1 border-b border-surface-300-700" aria-label="Filter status">
		{#each tabs as tab (tab.status)}
			{@const active = data.filters.status === tab.status}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={buildHref({ status: tab.status, page: 1 })}
				class="-mb-px border-b-2 px-3 py-2 text-sm transition-colors {active
					? 'border-primary-500 font-semibold text-primary-500'
					: 'border-transparent opacity-70 hover:opacity-100'}"
				aria-current={active ? 'page' : undefined}
			>
				{tab.label}
				<span class="ml-1 text-xs tabular-nums opacity-60">{numberFmt.format(tab.count)}</span>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</nav>

	<!-- Search + category filter (GET form, navigates with query params) -->
	<form method="GET" class="flex flex-wrap items-center gap-3">
		<input type="hidden" name="status" value={data.filters.status} />
		<label class="input-group flex-1 min-w-[14rem] grid-cols-[auto_1fr]">
			<span class="ig-cell" aria-hidden="true"><Search size={16} /></span>
			<input
				class="ig-input"
				type="search"
				name="q"
				value={data.filters.q}
				placeholder="Cari judul berita…"
				aria-label="Cari judul"
			/>
		</label>
		<select
			class="select max-w-48"
			name="categoryId"
			value={data.filters.categoryId}
			aria-label="Kategori"
		>
			<option value="">Semua kategori</option>
			{#each data.categories as cat (cat.id)}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
		<button type="submit" class="btn preset-tonal-primary">Terapkan</button>
	</form>

	<!-- Bulk actions -->
	{#if selected.length > 0 && !inTrash}
		<form
			method="POST"
			action="?/bulkDelete"
			use:enhance={() => {
				return async ({ update }) => {
					selected = [];
					await update();
				};
			}}
			class="card flex items-center justify-between gap-3 p-3 preset-tonal-primary"
		>
			<span class="text-sm">{selected.length} berita dipilih</span>
			{#each selected as id (id)}
				<input type="hidden" name="ids" value={id} />
			{/each}
			<button
				type="button"
				class="btn btn-sm preset-filled-error-500"
				onclick={(e) =>
					askConfirm(e, {
						title: 'Pindahkan ke Sampah',
						message: `Pindahkan ${selected.length} berita terpilih ke sampah?`,
						confirmLabel: 'Pindahkan'
					})}
			>
				<Trash2 size={14} aria-hidden="true" /> Pindahkan ke Sampah
			</button>
		</form>
	{/if}

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					{#if !inTrash}
						<th class="w-10">
							<input
								type="checkbox"
								class="checkbox"
								checked={allSelected}
								onchange={toggleAll}
								aria-label="Pilih semua"
							/>
						</th>
					{/if}
					<th>Judul</th>
					<th>Kategori</th>
					<th>Penulis</th>
					<th class="text-right">Dilihat</th>
					<th class="text-right">Tanggal</th>
				</tr>
			</thead>
			<tbody>
				{#each data.posts as post (post.id)}
					<tr class="group">
						{#if !inTrash}
							<td>
								<input
									type="checkbox"
									class="checkbox"
									checked={selected.includes(post.id)}
									onchange={() => toggle(post.id)}
									aria-label="Pilih {post.title}"
								/>
							</td>
						{/if}
						<td>
							<div class="font-medium">
								{#if post.isPinned}<span class="badge preset-tonal-primary mr-1">Pin</span>{/if}
								{#if canEdit(post.authorId) && !inTrash}
									<a href={resolve(`/admin/posts/${post.id}`)} class="hover:text-primary-500">
										{post.title}
									</a>
								{:else}
									{post.title}
								{/if}
								{#if !inTrash && data.filters.status === ''}
									<span class="badge ml-1 {statusBadge[post.status]}"
										>{statusText[post.status]}</span
									>
								{/if}
							</div>
							<!-- Quick actions: muncul saat hover/fokus, seperti Blogger -->
							<div
								class="mt-1 flex flex-wrap items-center gap-3 text-xs transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
							>
								{#if inTrash}
									{#if canEdit(post.authorId)}
										<form method="POST" action="?/restore" use:enhance>
											<input type="hidden" name="id" value={post.id} />
											<button type="submit" class="anchor flex items-center gap-1">
												<RotateCcw size={12} aria-hidden="true" /> Pulihkan
											</button>
										</form>
									{/if}
									{#if canDelete(post.authorId)}
										<form method="POST" action="?/hardDelete" use:enhance>
											<input type="hidden" name="id" value={post.id} />
											<button
												type="button"
												class="anchor text-error-500"
												onclick={(e) =>
													askConfirm(e, {
														title: 'Hapus Permanen',
														message: `Hapus permanen "${post.title}"? Tindakan ini tidak bisa dibatalkan.`,
														confirmLabel: 'Hapus Permanen'
													})}>Hapus Permanen</button
											>
										</form>
									{/if}
								{:else}
									{#if canEdit(post.authorId)}
										<a href={resolve(`/admin/posts/${post.id}`)} class="anchor">Edit</a>
										<form method="POST" action="?/togglePin" use:enhance>
											<input type="hidden" name="id" value={post.id} />
											<input type="hidden" name="pinned" value={(!post.isPinned).toString()} />
											<button type="submit" class="anchor flex items-center gap-1">
												{#if post.isPinned}
													<PinOff size={12} aria-hidden="true" /> Lepas Sematan
												{:else}
													<Pin size={12} aria-hidden="true" /> Sematkan
												{/if}
											</button>
										</form>
									{/if}
									{#if post.status === 'PUBLISHED'}
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
										<a href={`/berita/${post.slug}`} target="_blank" rel="noopener" class="anchor">
											Lihat
										</a>
									{/if}
									{#if canDelete(post.authorId)}
										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={post.id} />
											<button
												type="button"
												class="anchor text-error-500"
												onclick={(e) =>
													askConfirm(e, {
														title: 'Pindahkan ke Sampah',
														message: `Pindahkan "${post.title}" ke sampah?`,
														confirmLabel: 'Hapus'
													})}>Hapus</button
											>
										</form>
									{/if}
								{/if}
							</div>
						</td>
						<td class="opacity-80">
							{#if post.categoryName}
								<span class="badge preset-tonal">{post.categoryName}</span>
							{:else}
								—
							{/if}
						</td>
						<td class="opacity-80">{post.authorName ?? '—'}</td>
						<td class="text-right tabular-nums opacity-80">{numberFmt.format(post.viewCount)}</td>
						<td class="text-right text-sm whitespace-nowrap opacity-70">{rowDate(post)}</td>
					</tr>
				{:else}
					<tr>
						<td colspan={inTrash ? 5 : 6} class="py-8 text-center opacity-60">
							{#if inTrash}
								Sampah kosong.
							{:else if data.filters.q || data.filters.categoryId || data.filters.status}
								Tidak ada berita yang cocok dengan filter.
							{:else}
								Belum ada berita. {#if data.canCreate}<a
										href={resolve('/admin/posts/new')}
										class="anchor">Tulis berita pertama →</a
									>{/if}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.totalPages > 1}
		<nav class="flex items-center justify-center gap-2" aria-label="Navigasi halaman">
			{#if data.page > 1}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={buildHref({ page: data.page - 1 })} class="btn btn-sm preset-tonal">← Sebelumnya</a
				>
			{/if}
			<span class="text-sm opacity-70">Halaman {data.page} dari {data.totalPages}</span>
			{#if data.page < data.totalPages}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={buildHref({ page: data.page + 1 })} class="btn btn-sm preset-tonal">Berikutnya →</a
				>
			{/if}
		</nav>
	{/if}

	<ConfirmDialog
		open={confirmRequest !== null}
		title={confirmRequest?.title ?? ''}
		message={confirmRequest?.message ?? ''}
		confirmLabel={confirmRequest?.confirmLabel ?? 'Hapus'}
		onconfirm={handleConfirm}
		oncancel={() => (confirmRequest = null)}
	/>
</section>
