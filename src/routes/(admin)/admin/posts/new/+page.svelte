<script lang="ts">
	import PostForm from '$lib/components/admin/PostForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tulis Berita — Admin</title></svelte:head>

<section class="mx-auto max-w-4xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tulis Berita</h1>
	</header>

	<PostForm
		data={data.form}
		categories={data.categories}
		storageEnabled={data.storageEnabled}
		submitLabel="Simpan"
	/>
</section>
