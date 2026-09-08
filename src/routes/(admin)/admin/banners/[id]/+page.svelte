<script lang="ts">
	import BannerForm from '$lib/components/admin/BannerForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit Banner — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Edit Banner</h1>
		<p class="text-sm opacity-70">{data.title}</p>
	</header>

	<BannerForm
		data={data.form}
		submitLabel="Perbarui"
		storageEnabled={data.storageEnabled}
		imageUrl={data.imageUrl}
	/>
</section>
