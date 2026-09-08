<script lang="ts">
	import FaqForm from '$lib/components/admin/FaqForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tambah FAQ — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah FAQ</h1>
	</header>

	<FaqForm data={data.form} submitLabel="Simpan" />
</section>
