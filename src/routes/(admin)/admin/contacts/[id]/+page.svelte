<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' });
</script>

<svelte:head><title>Pesan dari {data.contact.name} — Admin</title></svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-10">
	<header class="flex items-center justify-between gap-4">
		<h1 class="h2">Detail Pesan</h1>
		<a href={resolve('/admin/contacts')} class="btn preset-tonal-surface">Kembali</a>
	</header>

	<div class="card space-y-4 p-6">
		<div class="grid gap-3 sm:grid-cols-2">
			<div>
				<p class="text-xs uppercase opacity-60">Nama</p>
				<p class="font-medium">{data.contact.name}</p>
			</div>
			<div>
				<p class="text-xs uppercase opacity-60">Email</p>
				<p class="font-medium">{data.contact.email}</p>
			</div>
			<div>
				<p class="text-xs uppercase opacity-60">Telepon</p>
				<p class="font-medium">{data.contact.phone ?? '—'}</p>
			</div>
			<div>
				<p class="text-xs uppercase opacity-60">Tanggal</p>
				<p class="font-medium">{fmt.format(new Date(data.contact.createdAt))}</p>
			</div>
		</div>

		<hr class="hr" />

		<div>
			<p class="text-xs uppercase opacity-60">Pesan</p>
			<p class="whitespace-pre-wrap">{data.contact.message}</p>
		</div>
	</div>

	<div class="flex items-center justify-between gap-4">
		<div>
			{#if data.contact.repliedAt}
				<span class="badge preset-tonal-success"
					>Dibalas {fmt.format(new Date(data.contact.repliedAt))}</span
				>
			{/if}
		</div>
		<form method="POST" action="?/reply" use:enhance>
			<a href="mailto:{data.contact.email}" class="btn preset-tonal-primary">Balas via Email</a>
			<button type="submit" class="btn preset-filled-primary-500">Tandai Dibalas</button>
		</form>
	</div>
</section>
