<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);
	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

	function pageHref(n: number): string {
		const base = `${resolve('/search')}?q=${encodeURIComponent(data.q)}`;
		return n > 1 ? `${base}&page=${n}` : base;
	}
</script>

<Seo
	{siteName}
	title="Pencarian"
	fullTitle={pageTitle('Pencarian', siteName)}
	description="Cari berita di {siteName}."
	canonical={`${origin}${resolve('/search')}`}
	noindex
/>

<section class="mx-auto max-w-4xl px-4 py-12">
	<h1 class="h1 mb-6">Pencarian</h1>

	<form method="GET" action={resolve('/search')} class="mb-8 flex gap-2">
		<input
			class="input"
			type="search"
			name="q"
			value={data.q}
			placeholder="Cari berita…"
			aria-label="Kata kunci pencarian"
		/>
		<button type="submit" class="btn preset-filled-primary-500">Cari</button>
	</form>

	{#if data.q}
		<p class="mb-4 text-sm opacity-70">
			{data.total} hasil untuk “{data.q}”
		</p>

		<div class="space-y-4">
			{#each data.items as post (post.id)}
				<a href={resolve(`/berita/${post.slug}`)} class="card block space-y-1 p-5 hover:shadow-lg">
					<h2 class="h5">{post.title}</h2>
					<p class="text-sm opacity-60">
						{#if post.categoryName}{post.categoryName} ·
						{/if}
						{#if post.publishedAt}{dateFmt.format(new Date(post.publishedAt))}{/if}
					</p>
				</a>
			{:else}
				<p class="opacity-60">Tidak ada hasil.</p>
			{/each}
		</div>

		{#if data.pageCount > 1}
			<nav class="mt-10 flex items-center justify-center gap-2">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links with query string -->
				{#each Array.from({ length: data.pageCount }, (_, i) => i + 1) as n (n)}
					<a
						href={pageHref(n)}
						class="btn btn-sm {n === data.page ? 'preset-filled-primary-500' : 'preset-tonal'}"
						>{n}</a
					>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</nav>
		{/if}
	{/if}
</section>
