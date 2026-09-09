<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// Use custom favicon if available, otherwise use default
	const faviconUrl = $derived(data.faviconUrl);
	const faviconHref = $derived(
		faviconUrl ? `${faviconUrl}?v=${data.settings?.faviconMediaId}` : favicon
	);
</script>

<svelte:head>
	{#if faviconUrl}
		<link rel="icon" href={faviconHref} />
	{:else}
		<link rel="icon" href={favicon} type="image/svg+xml" />
	{/if}
</svelte:head>
{@render children()}
