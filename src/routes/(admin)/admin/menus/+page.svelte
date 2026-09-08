<script lang="ts">
	import {
		ChevronDown,
		ChevronUp,
		CornerDownRight,
		CornerUpLeft,
		GripVertical,
		Pencil,
		Plus,
		Save,
		Trash2
	} from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { DEFAULT_NAV_ITEMS, STANDARD_LINKS, type NavLink } from '$lib/utils/navigation';
	import type { SaveMenuTreeInput } from '$lib/server/validators/menus';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type EditorChild = { key: string; id?: string; title: string; url: string; visible: boolean };
	type EditorItem = EditorChild & { children: EditorChild[] };

	function withKeys(input: SaveMenuTreeInput['items']): EditorItem[] {
		return input.map((item) => ({
			key: crypto.randomUUID(),
			id: item.id,
			title: item.title,
			url: item.url,
			visible: item.visible,
			children: item.children.map((child) => ({
				key: crypto.randomUUID(),
				id: child.id,
				title: child.title,
				url: child.url,
				visible: child.visible
			}))
		}));
	}

	// svelte-ignore state_referenced_locally
	let items = $state(withKeys(data.form.data.items));
	let openKeys = $state<Record<string, boolean>>({});
	let addTitle = $state('');
	let addUrl = $state('');

	function serialize(): SaveMenuTreeInput {
		return {
			items: items.map(({ key: _key, children, ...item }) => ({
				...item,
				children: children.map(({ key: _childKey, ...child }) => child)
			}))
		};
	}

	// svelte-ignore state_referenced_locally
	const { enhance, submitting, message } = superForm(data.form, {
		dataType: 'json',
		onSubmit({ jsonData }) {
			jsonData(serialize());
		},
		onUpdated({ form }) {
			// Server returns the fresh tree (with generated ids) after save.
			if (form.valid) {
				items = withKeys(form.data.items);
				openKeys = {};
			}
		}
	});

	const itemCount = $derived(items.reduce((n, item) => n + 1 + item.children.length, 0));

	function toggleOpen(key: string) {
		openKeys[key] = !openKeys[key];
	}

	function addLink(link: NavLink) {
		items.push({
			key: crypto.randomUUID(),
			title: link.title,
			url: link.url,
			visible: true,
			children: []
		});
	}

	function addCustom() {
		if (!addTitle.trim() || !addUrl.trim()) return;
		addLink({ title: addTitle.trim(), url: addUrl.trim() });
		addTitle = '';
		addUrl = '';
	}

	function loadDefaults() {
		items = withKeys(DEFAULT_NAV_ITEMS.map((item) => ({ ...item, visible: true, children: [] })));
	}

	function moveTop(i: number, delta: number) {
		const j = i + delta;
		if (j < 0 || j >= items.length) return;
		[items[i], items[j]] = [items[j], items[i]];
	}

	function moveChild(pi: number, ci: number, delta: number) {
		const siblings = items[pi].children;
		const j = ci + delta;
		if (j < 0 || j >= siblings.length) return;
		[siblings[ci], siblings[j]] = [siblings[j], siblings[ci]];
	}

	/** Make item i a submenu of the item above it (WordPress indent). */
	function indent(i: number) {
		if (i === 0 || items[i].children.length > 0) return;
		const { children: _children, ...link } = items[i];
		items[i - 1].children.push(link);
		items.splice(i, 1);
	}

	/** Pull a child out of its parent, placing it right after the parent. */
	function outdent(pi: number, ci: number) {
		const [child] = items[pi].children.splice(ci, 1);
		items.splice(pi + 1, 0, { ...child, children: [] });
	}

	function removeTop(i: number) {
		items.splice(i, 1);
	}

	function removeChild(pi: number, ci: number) {
		items[pi].children.splice(ci, 1);
	}
</script>

<svelte:head><title>Menu Navigasi — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<form method="POST" use:enhance class="space-y-6">
		<header class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="h2">Menu Navigasi</h1>
				<p class="text-sm opacity-70">
					Susun menu utama website — tambah, urutkan, dan buat dropdown (submenu).
				</p>
			</div>
			<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
				<Save size={16} />
				{$submitting ? 'Menyimpan…' : 'Simpan Menu'}
			</button>
		</header>

		{#if $message}
			<aside class="card preset-tonal-success p-3 text-sm">{$message}</aside>
		{/if}

		<div class="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
			<div class="space-y-4">
				<div class="card space-y-3 p-4">
					<h2 class="font-display font-bold">Tautan Kustom</h2>
					<label class="label">
						<span class="text-sm">Judul</span>
						<input
							class="input"
							bind:value={addTitle}
							placeholder="Profil Sekolah"
							maxlength="120"
						/>
					</label>
					<label class="label">
						<span class="text-sm">URL</span>
						<input
							class="input"
							bind:value={addUrl}
							placeholder="/profil atau https://…"
							maxlength="300"
						/>
					</label>
					<button
						type="button"
						class="btn w-full preset-tonal-primary"
						disabled={!addTitle.trim() || !addUrl.trim()}
						onclick={addCustom}
					>
						<Plus size={16} /> Tambah ke Menu
					</button>
				</div>

				<div class="card space-y-2 p-4">
					<h2 class="font-display font-bold">Tautan Bawaan</h2>
					<ul class="divide-y divide-surface-200-800">
						{#each STANDARD_LINKS as link (link.url)}
							<li class="flex items-center justify-between gap-2 py-1.5 text-sm">
								<span class="min-w-0">
									<span class="block truncate">{link.title}</span>
									<span class="block truncate text-xs opacity-60">{link.url}</span>
								</span>
								<button
									type="button"
									class="btn-icon btn-icon-sm preset-tonal"
									aria-label="Tambah {link.title} ke menu"
									onclick={() => addLink(link)}
								>
									<Plus size={14} />
								</button>
							</li>
						{/each}
					</ul>
				</div>

				{#if data.pageLinks.length}
					<div class="card space-y-2 p-4">
						<h2 class="font-display font-bold">Halaman</h2>
						<ul class="divide-y divide-surface-200-800">
							{#each data.pageLinks as link (link.url)}
								<li class="flex items-center justify-between gap-2 py-1.5 text-sm">
									<span class="min-w-0">
										<span class="block truncate">{link.title}</span>
										<span class="block truncate text-xs opacity-60">{link.url}</span>
									</span>
									<button
										type="button"
										class="btn-icon btn-icon-sm preset-tonal"
										aria-label="Tambah {link.title} ke menu"
										onclick={() => addLink(link)}
									>
										<Plus size={14} />
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<div class="card space-y-3 p-4">
				<div class="flex items-center justify-between gap-2">
					<h2 class="font-display font-bold">Struktur Menu</h2>
					<span class="text-sm opacity-70">{itemCount} item</span>
				</div>

				{#if items.length === 0}
					<div class="space-y-3 py-10 text-center">
						<p class="text-sm opacity-70">
							Belum ada item menu. Tambahkan dari panel kiri, atau mulai dari menu bawaan.
						</p>
						<button type="button" class="btn preset-tonal-primary" onclick={loadDefaults}>
							Muat Menu Bawaan
						</button>
					</div>
				{:else}
					<ul class="space-y-2">
						{#each items as item, i (item.key)}
							<li class="space-y-2">
								<div class="border border-surface-300-700 bg-surface-50-950">
									<div class="flex items-center gap-2 px-3 py-2">
										<GripVertical size={16} class="shrink-0 opacity-40" aria-hidden="true" />
										<button
											type="button"
											class="flex min-w-0 flex-1 items-center gap-2 text-left"
											onclick={() => toggleOpen(item.key)}
											aria-expanded={openKeys[item.key] ?? false}
										>
											<span class="truncate font-medium">{item.title || '(tanpa judul)'}</span>
											{#if item.children.length}
												<span class="badge preset-tonal">{item.children.length} sub</span>
											{/if}
											{#if !item.visible}
												<span class="badge preset-tonal">Sembunyi</span>
											{/if}
											<Pencil size={13} class="shrink-0 opacity-50" aria-hidden="true" />
										</button>
										<div class="flex shrink-0 items-center gap-1">
											<button
												type="button"
												class="btn-icon btn-icon-sm preset-tonal"
												aria-label="Naikkan {item.title}"
												disabled={i === 0}
												onclick={() => moveTop(i, -1)}
											>
												<ChevronUp size={14} />
											</button>
											<button
												type="button"
												class="btn-icon btn-icon-sm preset-tonal"
												aria-label="Turunkan {item.title}"
												disabled={i === items.length - 1}
												onclick={() => moveTop(i, 1)}
											>
												<ChevronDown size={14} />
											</button>
											<button
												type="button"
												class="btn-icon btn-icon-sm preset-tonal"
												aria-label="Jadikan submenu dari item di atasnya"
												title={item.children.length
													? 'Pindahkan dulu submenu-nya sebelum menjadikan item ini submenu'
													: 'Jadikan submenu dari item di atasnya'}
												disabled={i === 0 || item.children.length > 0}
												onclick={() => indent(i)}
											>
												<CornerDownRight size={14} />
											</button>
											<button
												type="button"
												class="btn-icon btn-icon-sm preset-tonal-error"
												aria-label="Hapus {item.title}"
												onclick={() => removeTop(i)}
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>

									{#if openKeys[item.key]}
										<div class="grid gap-3 border-t border-surface-300-700 p-3 sm:grid-cols-2">
											<label class="label">
												<span class="text-sm">Judul</span>
												<input class="input" bind:value={item.title} maxlength="120" required />
											</label>
											<label class="label">
												<span class="text-sm">URL</span>
												<input class="input" bind:value={item.url} maxlength="300" required />
											</label>
											<label class="flex items-center gap-2 sm:col-span-2">
												<input class="checkbox" type="checkbox" bind:checked={item.visible} />
												<span class="text-sm">Tampilkan di navigasi</span>
											</label>
										</div>
									{/if}
								</div>

								{#if item.children.length}
									<ul class="ml-8 space-y-2">
										{#each item.children as child, ci (child.key)}
											<li class="border border-surface-300-700 bg-surface-50-950">
												<div class="flex items-center gap-2 px-3 py-2">
													<CornerDownRight
														size={14}
														class="shrink-0 opacity-40"
														aria-hidden="true"
													/>
													<button
														type="button"
														class="flex min-w-0 flex-1 items-center gap-2 text-left"
														onclick={() => toggleOpen(child.key)}
														aria-expanded={openKeys[child.key] ?? false}
													>
														<span class="truncate text-sm font-medium">
															{child.title || '(tanpa judul)'}
														</span>
														{#if !child.visible}
															<span class="badge preset-tonal">Sembunyi</span>
														{/if}
														<Pencil size={13} class="shrink-0 opacity-50" aria-hidden="true" />
													</button>
													<div class="flex shrink-0 items-center gap-1">
														<button
															type="button"
															class="btn-icon btn-icon-sm preset-tonal"
															aria-label="Naikkan {child.title}"
															disabled={ci === 0}
															onclick={() => moveChild(i, ci, -1)}
														>
															<ChevronUp size={14} />
														</button>
														<button
															type="button"
															class="btn-icon btn-icon-sm preset-tonal"
															aria-label="Turunkan {child.title}"
															disabled={ci === item.children.length - 1}
															onclick={() => moveChild(i, ci, 1)}
														>
															<ChevronDown size={14} />
														</button>
														<button
															type="button"
															class="btn-icon btn-icon-sm preset-tonal"
															aria-label="Keluarkan {child.title} dari submenu"
															onclick={() => outdent(i, ci)}
														>
															<CornerUpLeft size={14} />
														</button>
														<button
															type="button"
															class="btn-icon btn-icon-sm preset-tonal-error"
															aria-label="Hapus {child.title}"
															onclick={() => removeChild(i, ci)}
														>
															<Trash2 size={14} />
														</button>
													</div>
												</div>

												{#if openKeys[child.key]}
													<div
														class="grid gap-3 border-t border-surface-300-700 p-3 sm:grid-cols-2"
													>
														<label class="label">
															<span class="text-sm">Judul</span>
															<input
																class="input"
																bind:value={child.title}
																maxlength="120"
																required
															/>
														</label>
														<label class="label">
															<span class="text-sm">URL</span>
															<input
																class="input"
																bind:value={child.url}
																maxlength="300"
																required
															/>
														</label>
														<label class="flex items-center gap-2 sm:col-span-2">
															<input
																class="checkbox"
																type="checkbox"
																bind:checked={child.visible}
															/>
															<span class="text-sm">Tampilkan di navigasi</span>
														</label>
													</div>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}

				<p class="text-xs opacity-60">
					Perubahan hanya diterapkan setelah menekan <strong>Simpan Menu</strong>. Item dengan
					submenu tampil sebagai dropdown di navigasi utama.
				</p>
			</div>
		</div>
	</form>
</section>
