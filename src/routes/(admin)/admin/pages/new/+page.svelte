<script lang="ts">
	import PageForm from '$lib/components/admin/PageForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tambah Halaman — Admin</title></svelte:head>

<section class="mx-auto max-w-4xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah Halaman</h1>
	</header>

	<PageForm data={data.form} storageEnabled={data.storageEnabled} submitLabel="Simpan" />
</section>
