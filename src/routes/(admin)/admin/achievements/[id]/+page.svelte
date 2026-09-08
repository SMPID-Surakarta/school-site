<script lang="ts">
	import AchievementForm from '$lib/components/admin/AchievementForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit: {data.title} — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Edit Prestasi</h1>
		<p class="text-sm opacity-70">{data.title}</p>
	</header>

	<AchievementForm
		data={data.form}
		submitLabel="Perbarui"
		storageEnabled={data.storageEnabled}
		imageUrl={data.imageUrl}
	/>
</section>
