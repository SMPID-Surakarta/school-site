<script lang="ts">
	import DownloadForm from '$lib/components/admin/DownloadForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit: {data.title} — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Edit Berkas</h1>
		<p class="text-sm opacity-70">{data.title}</p>
	</header>

	<DownloadForm data={data.form} submitLabel="Perbarui" />
</section>
