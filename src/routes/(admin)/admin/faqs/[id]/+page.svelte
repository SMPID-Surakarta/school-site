<script lang="ts">
	import FaqForm from '$lib/components/admin/FaqForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit FAQ — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Edit FAQ</h1>
		<p class="text-sm opacity-70">{data.question}</p>
	</header>

	<FaqForm data={data.form} submitLabel="Perbarui" />
</section>
