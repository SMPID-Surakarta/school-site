<script lang="ts">
	import { resolve } from '$app/paths';
	import { page as appPage } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(appPage.data.siteName as string);
	const origin = $derived(appPage.data.origin as string);
	const description = $derived(
		data.page.content
			.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 160)
	);
</script>

<Seo
	{siteName}
	title={data.page.title}
	fullTitle={pageTitle(data.page.title, siteName)}
	{description}
	canonical={`${origin}${resolve(`/${data.page.slug}`)}`}
/>

<article class="mx-auto max-w-3xl px-4 py-12">
	<h1 class="h1 mb-8">{data.page.title}</h1>
	<!-- Content is sanitized server-side (see $lib/server/html.ts) before rendering. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<div class="page-content prose max-w-none">{@html data.page.contentHtml}</div>
</article>

<style>
	/* Quill-authored layout classes survive sanitization; style them for public display. */
	.page-content :global(iframe) {
		width: 100%;
		aspect-ratio: 16 / 9;
		height: auto;
		border: 0;
	}
	.page-content :global(.ql-align-center) {
		text-align: center;
	}
	.page-content :global(.ql-align-right) {
		text-align: right;
	}
	.page-content :global(.ql-align-justify) {
		text-align: justify;
	}
	.page-content :global(.ql-indent-1) {
		padding-left: 2rem;
	}
	.page-content :global(.ql-indent-2) {
		padding-left: 4rem;
	}
	.page-content :global(.ql-indent-3) {
		padding-left: 6rem;
	}
	.page-content :global(.ql-indent-4) {
		padding-left: 8rem;
	}
</style>
