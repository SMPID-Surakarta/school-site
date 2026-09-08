<script lang="ts">
	import AgendaForm from '$lib/components/admin/AgendaForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tambah Agenda — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah Agenda</h1>
	</header>

	<AgendaForm data={data.form} submitLabel="Simpan" />
</section>
