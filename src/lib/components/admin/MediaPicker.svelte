<script lang="ts">
	import { Check, Images, RefreshCw, Search, Upload, X } from '@lucide/svelte';

	export type SelectedMedia = {
		id: string;
		url: string;
		originalName: string;
		altText?: string | null;
		width?: number | null;
		height?: number | null;
		mime?: string;
		size?: number;
	};

	type Props = {
		open?: boolean;
		title?: string;
		kind?: 'image' | 'file' | 'all';
		uploadEnabled?: boolean;
		onselect: (media: SelectedMedia) => void;
		oncancel: () => void;
	};

	let {
		open = false,
		title = 'Pilih Media',
		kind = 'image',
		uploadEnabled = true,
		onselect,
		oncancel
	}: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	let activeTab = $state<'library' | 'upload'>('library');
	let mediaList = $state<SelectedMedia[]>([]);
	let loading = $state(false);
	let loadError = $state<string | null>(null);
	let searchQuery = $state('');
	let selected = $state<SelectedMedia | null>(null);

	// Upload state
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadAltText = $state('');
	let fileInput = $state<HTMLInputElement>();
	let isDragOver = $state(false);

	const sizeFmt = (bytes?: number) => {
		if (!bytes) return '';
		return bytes < 1024 * 1024
			? `${(bytes / 1024).toFixed(0)} KB`
			: `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	async function fetchMedia() {
		loading = true;
		loadError = null;
		try {
			const query = kind !== 'all' ? `?kind=${encodeURIComponent(kind)}` : '';
			const res = await fetch(`/admin/api/media${query}`);
			if (!res.ok) {
				throw new Error('Gagal memuat pustaka media');
			}
			mediaList = await res.json();
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Gagal memuat media';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!dialog) return;
		if (open) {
			if (!dialog.open) {
				dialog.showModal();
			}
			activeTab = 'library';
			selected = null;
			searchQuery = '';
			void fetchMedia();
		} else if (dialog.open) {
			dialog.close();
		}
	});

	const filteredList = $derived(
		mediaList.filter((item) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				item.originalName.toLowerCase().includes(q) ||
				(item.altText && item.altText.toLowerCase().includes(q))
			);
		})
	);

	function handleConfirm() {
		if (selected) {
			onselect(selected);
		}
	}

	function handleCardClick(item: SelectedMedia) {
		selected = item;
	}

	function handleCardDblClick(item: SelectedMedia) {
		selected = item;
		onselect(item);
	}

	async function handleUploadFile(file: File) {
		uploading = true;
		uploadError = null;
		try {
			const body = new FormData();
			body.set('file', file);
			body.set(
				'kind',
				kind === 'file' ? 'file' : file.type.startsWith('image/') ? 'image' : 'file'
			);
			if (uploadAltText.trim()) {
				body.set('altText', uploadAltText.trim());
			}

			const res = await fetch('/admin/api/media', { method: 'POST', body });
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { message?: string };
				throw new Error(data.message ?? 'Gagal mengunggah berkas');
			}

			const uploaded = (await res.json()) as SelectedMedia;
			uploadAltText = '';
			// Prepend to media list
			mediaList = [uploaded, ...mediaList];
			selected = uploaded;
			// Automatically select and return the uploaded media
			onselect(uploaded);
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Gagal mengunggah berkas';
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	function onFileInputChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void handleUploadFile(file);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) void handleUploadFile(file);
	}
</script>

<dialog
	bind:this={dialog}
	class="card m-auto w-[95vw] max-w-4xl border border-surface-200-800 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50"
	onclose={oncancel}
>
	<!-- Modal Header -->
	<header
		class="flex items-center justify-between border-b border-surface-200-800 px-6 py-4 dark:border-surface-700"
	>
		<div class="flex items-center gap-2">
			<Images size={20} class="text-primary-600" />
			<h2 class="font-display text-lg font-bold">{title}</h2>
		</div>
		<button
			type="button"
			class="btn-icon btn-icon-sm hover:preset-tonal"
			onclick={oncancel}
			aria-label="Tutup dialog"
		>
			<X size={18} />
		</button>
	</header>

	<!-- Tabs & Controls Bar -->
	<div
		class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200-800 bg-surface-50 px-6 py-2.5"
	>
		<div class="flex gap-2">
			<button
				type="button"
				class="btn btn-sm {activeTab === 'library'
					? 'preset-filled-primary-500'
					: 'preset-tonal-surface'}"
				onclick={() => (activeTab = 'library')}
			>
				<Images size={15} />
				<span>Pustaka Media</span>
			</button>
			{#if uploadEnabled}
				<button
					type="button"
					class="btn btn-sm {activeTab === 'upload'
						? 'preset-filled-primary-500'
						: 'preset-tonal-surface'}"
					onclick={() => (activeTab = 'upload')}
				>
					<Upload size={15} />
					<span>Unggah Baru</span>
				</button>
			{/if}
		</div>

		{#if activeTab === 'library'}
			<div class="flex items-center gap-2">
				<div class="relative">
					<Search size={15} class="absolute top-2.5 left-2.5 opacity-50" />
					<input
						type="search"
						class="input input-sm h-8 w-48 pl-8 sm:w-64"
						placeholder="Cari media..."
						bind:value={searchQuery}
					/>
				</div>
				<button
					type="button"
					class="btn-icon btn-icon-sm preset-tonal"
					title="Muat ulang"
					onclick={fetchMedia}
					disabled={loading}
				>
					<RefreshCw size={14} class={loading ? 'animate-spin' : ''} />
				</button>
			</div>
		{/if}
	</div>

	<!-- Modal Body -->
	<div class="h-[26rem] overflow-y-auto p-6">
		{#if activeTab === 'library'}
			{#if loading && mediaList.length === 0}
				<div class="flex h-full items-center justify-center">
					<div class="flex items-center gap-2 text-sm opacity-70">
						<RefreshCw size={18} class="animate-spin text-primary-600" />
						<span>Memuat pustaka media...</span>
					</div>
				</div>
			{:else if loadError}
				<div class="flex h-full flex-col items-center justify-center gap-3 text-center">
					<p class="text-sm text-error-500">{loadError}</p>
					<button type="button" class="btn btn-sm preset-tonal" onclick={fetchMedia}>
						Coba Lagi
					</button>
				</div>
			{:else if filteredList.length === 0}
				<div class="flex h-full flex-col items-center justify-center gap-3 text-center opacity-70">
					<p class="text-sm">
						{searchQuery ? 'Tidak ada media yang cocok.' : 'Belum ada media tersimpan.'}
					</p>
					{#if uploadEnabled && !searchQuery}
						<button
							type="button"
							class="btn btn-sm preset-filled-primary-500"
							onclick={() => (activeTab = 'upload')}
						>
							<Upload size={14} /> Unggah Sekarang
						</button>
					{/if}
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each filteredList as item (item.id)}
						{@const isSelected = selected?.id === item.id}
						<button
							type="button"
							class="group relative flex flex-col overflow-hidden rounded-lg border text-left transition {isSelected
								? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50/20'
								: 'border-surface-200-800 hover:border-surface-400 bg-white'}"
							onclick={() => handleCardClick(item)}
							ondblclick={() => handleCardDblClick(item)}
						>
							<div
								class="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-surface-100"
							>
								{#if item.mime?.startsWith('image/')}
									<img
										src={item.url}
										alt={item.altText ?? item.originalName}
										class="h-full w-full object-cover transition-transform group-hover:scale-105"
										loading="lazy"
									/>
								{:else}
									<span class="p-2 text-center text-xs opacity-70">{item.mime || 'Berkas'}</span>
								{/if}

								{#if isSelected}
									<div
										class="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow"
									>
										<Check size={14} strokeWidth={3} />
									</div>
								{/if}
							</div>
							<div class="p-2">
								<p class="truncate text-xs font-medium" title={item.originalName}>
									{item.originalName}
								</p>
								<div class="flex items-center justify-between text-[10px] opacity-60">
									<span>{sizeFmt(item.size)}</span>
									{#if item.width && item.height}
										<span>{item.width}×{item.height}</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'upload'}
			<div class="flex h-full flex-col justify-center gap-4">
				<div
					class="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition {isDragOver
						? 'border-primary-500 bg-primary-50/30'
						: 'border-surface-300 hover:border-surface-400'}"
					ondragover={(e) => {
						e.preventDefault();
						isDragOver = true;
					}}
					ondragleave={() => (isDragOver = false)}
					ondrop={onDrop}
					role="region"
					aria-label="Area drag and drop unggah berkas"
				>
					<Upload size={36} class="mb-3 text-primary-600 opacity-80" />
					<p class="text-base font-semibold">Tarik berkas ke sini</p>
					<p class="mb-4 text-xs opacity-60">
						{kind === 'image'
							? 'Format gambar JPG, PNG, WebP, GIF'
							: 'Format dokumen PDF, DOC, XLS, atau gambar'}
					</p>

					<label class="btn preset-filled-primary-500 cursor-pointer">
						<Upload size={16} />
						<span>{uploading ? 'Mengunggah...' : 'Pilih Berkas dari Komputer'}</span>
						<input
							bind:this={fileInput}
							type="file"
							class="hidden"
							accept={kind === 'image' ? 'image/*' : undefined}
							disabled={uploading}
							onchange={onFileInputChange}
						/>
					</label>
				</div>

				<div class="grid gap-2">
					<label class="label text-xs">
						<span>Teks Alternatif (Alt Text) / Deskripsi Singkat</span>
						<input
							type="text"
							class="input input-sm"
							placeholder="Mis. Gedung Utama Sekolah"
							bind:value={uploadAltText}
							disabled={uploading}
						/>
					</label>
				</div>

				{#if uploadError}
					<aside class="card preset-tonal-error p-3 text-xs">{uploadError}</aside>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Modal Footer -->
	<footer
		class="flex items-center justify-between border-t border-surface-200-800 bg-surface-50 px-6 py-3"
	>
		<div class="flex items-center gap-3 overflow-hidden">
			{#if selected}
				<div class="h-10 w-10 shrink-0 overflow-hidden rounded border bg-surface-200">
					{#if selected.mime?.startsWith('image/')}
						<img
							src={selected.url}
							alt={selected.originalName}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center text-[10px] font-bold">
							FILE
						</div>
					{/if}
				</div>
				<div class="min-w-0">
					<p class="truncate text-xs font-semibold">{selected.originalName}</p>
					<p class="text-[11px] opacity-60">
						{sizeFmt(selected.size)}
						{#if selected.width && selected.height}
							· {selected.width}×{selected.height}px
						{/if}
					</p>
				</div>
			{:else}
				<p class="text-xs opacity-60">Pilih salah satu media atau klik ganda untuk memilih.</p>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button type="button" class="btn btn-sm preset-tonal" onclick={oncancel}>Batal</button>
			<button
				type="button"
				class="btn btn-sm preset-filled-primary-500"
				disabled={!selected}
				onclick={handleConfirm}
			>
				Gunakan Media
			</button>
		</div>
	</footer>
</dialog>
