<script lang="ts">
	import GalleryForm from '$lib/components/admin/GalleryForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tambah Galeri — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah Galeri</h1>
	</header>

	<GalleryForm data={data.form} submitLabel="Simpan" uploadEnabled={data.uploadEnabled} />
</section>
