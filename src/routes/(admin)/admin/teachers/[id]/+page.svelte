<script lang="ts">
	import TeacherForm from '$lib/components/admin/TeacherForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit: {data.name} — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Edit Guru</h1>
		<p class="text-sm opacity-70">{data.name}</p>
	</header>

	<TeacherForm data={data.form} submitLabel="Perbarui" />
</section>
