<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const role = $derived(data.user?.role);
	const isAdmin = $derived(role === 'ADMIN');
	const isEditorOrAdmin = $derived(role === 'ADMIN' || role === 'EDITOR');
</script>

<svelte:head><title>Dashboard — Admin</title></svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-8">
	<header>
		<p class="eyebrow mb-1">Dashboard</p>
		<h1 class="font-display text-2xl font-bold">Selamat datang, {data.user?.name}</h1>
		<p class="mt-1 text-sm text-ink-muted">
			Kelola konten website sekolah melalui menu di samping atau pintasan di bawah.
		</p>
	</header>

	<div class="border border-line bg-bg p-6">
		<h2 class="mb-4 font-display text-lg font-bold">Konten</h2>
		<nav class="flex flex-wrap gap-3">
			<a href={resolve('/admin/posts')} class="btn preset-tonal-primary">Berita</a>
			<a href={resolve('/admin/teachers')} class="btn preset-tonal-primary">Guru &amp; Staf</a>
			<a href={resolve('/admin/achievements')} class="btn preset-tonal-primary">Prestasi</a>
			<a href={resolve('/admin/galleries')} class="btn preset-tonal-primary">Galeri</a>
			<a href={resolve('/admin/agendas')} class="btn preset-tonal-primary">Agenda</a>
			<a href={resolve('/admin/downloads')} class="btn preset-tonal-primary">Unduhan</a>
			<a href={resolve('/admin/faqs')} class="btn preset-tonal-primary">FAQ</a>
			<a href={resolve('/admin/pages')} class="btn preset-tonal-primary">Halaman</a>
		</nav>
	</div>

	{#if isEditorOrAdmin}
		<div class="border border-line bg-bg p-6">
			<h2 class="mb-4 font-display text-lg font-bold">Pesan</h2>
			<nav class="flex flex-wrap gap-3">
				<a href={resolve('/admin/contacts')} class="btn preset-tonal-primary">Pesan Masuk</a>
			</nav>
		</div>
	{/if}

	{#if isAdmin}
		<div class="border border-line bg-bg p-6">
			<h2 class="mb-4 font-display text-lg font-bold">Sistem</h2>
			<nav class="flex flex-wrap gap-3">
				<a href={resolve('/admin/users')} class="btn preset-tonal-primary">Pengguna</a>
				<a href={resolve('/admin/settings')} class="btn preset-tonal-primary">Pengaturan</a>
				<a href={resolve('/admin/menus')} class="btn preset-tonal-primary">Menu</a>
				<a href={resolve('/admin/banners')} class="btn preset-tonal-primary">Banner</a>
			</nav>
		</div>
	{/if}
</section>
