<script lang="ts">
	import AchievementForm from '$lib/components/admin/AchievementForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tambah Prestasi — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah Prestasi</h1>
	</header>

	<AchievementForm data={data.form} submitLabel="Simpan" storageEnabled={data.storageEnabled} />
</section>
