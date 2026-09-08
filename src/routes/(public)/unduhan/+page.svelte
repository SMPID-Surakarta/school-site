<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
</script>

<Seo
	{siteName}
	title="Unduhan"
	fullTitle={pageTitle('Unduhan', siteName)}
	description="Berkas dan dokumen yang dapat diunduh dari {siteName}."
	canonical={`${origin}${resolve('/unduhan')}`}
/>

<section class="mx-auto max-w-4xl px-4 py-12">
	<h1 class="h1 mb-8">Unduhan</h1>

	<div class="table-wrap card">
		<table class="table">
			<thead>
				<tr>
					<th>Judul</th>
					<th>Kategori</th>
					<th>Ukuran</th>
					<th class="text-right">Unduh</th>
				</tr>
			</thead>
			<tbody>
				{#each data.downloads as item (item.id)}
					<tr>
						<td class="font-medium">{item.title}</td>
						<td class="opacity-70">{item.category ?? '—'}</td>
						<td class="opacity-70">{item.size ?? '—'}</td>
						<td class="text-right">
							{#if item.url}
								<!-- eslint-disable svelte/no-navigation-without-resolve -- URL berkas dikelola admin -->
								<a
									href={item.url}
									target="_blank"
									rel="noreferrer"
									class="btn btn-sm preset-tonal-primary">Unduh</a
								>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{:else}
								<span class="opacity-50">Belum tersedia</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="py-8 text-center opacity-60">Belum ada berkas.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
