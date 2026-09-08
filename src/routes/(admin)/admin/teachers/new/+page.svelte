<script lang="ts">
	import TeacherForm from '$lib/components/admin/TeacherForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Tambah Guru — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah Guru</h1>
	</header>

	<TeacherForm data={data.form} submitLabel="Simpan" />
</section>
