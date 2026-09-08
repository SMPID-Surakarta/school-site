<script lang="ts">
	import type { SeoData } from './meta';

	type Props = SeoData & { siteName: string; fullTitle: string };

	let {
		fullTitle,
		description,
		canonical,
		image,
		type = 'website',
		noindex = false,
		siteName,
		jsonLd
	}: Props = $props();

	const jsonLdList = $derived(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []);

	// Build the <script type="application/ld+json"> markup without a literal closing
	// tag in the template (which would confuse the HTML/Svelte parser). `<` is escaped
	// to `\u003c` so post content can never break out of the script element (XSS-safe).
	const OPEN = `<${'script'} type="application/ld+json">`;
	const CLOSE = `</${'script'}>`;
	const jsonLdMarkup = $derived(
		jsonLdList.map((ld) => OPEN + JSON.stringify(ld).replace(/</g, '\\u003c') + CLOSE)
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	{#if description}<meta name="description" content={description} />{/if}
	{#if noindex}<meta name="robots" content="noindex, nofollow" />{/if}
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	{#if description}<meta property="og:description" content={description} />{/if}
	<meta property="og:url" content={canonical} />
	{#if image}<meta property="og:image" content={image} />{/if}

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={fullTitle} />
	{#if description}<meta name="twitter:description" content={description} />{/if}
	{#if image}<meta name="twitter:image" content={image} />{/if}

	{#each jsonLdMarkup as markup (markup)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD is our own data, `<` escaped to \u003c -->
		{@html markup}
	{/each}
</svelte:head>
