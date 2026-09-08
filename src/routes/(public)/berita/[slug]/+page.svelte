<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import {
		ArrowUpRight,
		CalendarDays,
		Check,
		ChevronRight,
		Copy,
		Eye,
		MessageCircle,
		Search,
		Share2,
		UserRound
	} from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { Seo, articleJsonLd, pageTitle } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const url = $derived(new URL(resolve(`/berita/${data.post.slug}`), page.url).href);
	const description = $derived(data.post.seoDescription ?? data.post.excerpt ?? '');
	const shareText = $derived(encodeURIComponent(`${data.post.title}\n${url}`));
	let copyResult = $state<{ url: string; success: boolean } | null>(null);
	const copied = $derived(copyResult?.url === url && copyResult.success);
	const copyFailed = $derived(copyResult?.url === url && !copyResult.success);
	const { form: searchForm } = superForm(
		untrack(() => data.searchForm),
		{
			taintedMessage: false
		}
	);

	const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });
	const numberFmt = new Intl.NumberFormat('id-ID');

	async function copyLink() {
		const currentUrl = url;
		try {
			await navigator.clipboard.writeText(currentUrl);
			copyResult = { url: currentUrl, success: true };
		} catch {
			copyResult = { url: currentUrl, success: false };
		}
	}
</script>

<Seo
	{siteName}
	title={data.post.seoTitle ?? data.post.title}
	fullTitle={pageTitle(data.post.seoTitle ?? data.post.title, siteName)}
	{description}
	canonical={url}
	type="article"
	image={data.post.ogImage ?? data.post.thumbnailUrl}
	jsonLd={articleJsonLd({
		title: data.post.title,
		description,
		url,
		image: data.post.ogImage ?? data.post.thumbnailUrl,
		datePublished: data.post.publishedAt,
		dateModified: data.post.updatedAt,
		authorName: data.post.authorName,
		publisherName: siteName
	})}
/>

<div class="border-b border-line bg-bg-subtle">
	<nav aria-label="Breadcrumb" class="mx-auto max-w-public px-4 py-5">
		<ol
			class="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs leading-6 text-ink-muted"
		>
			<li><a href={resolve('/')} class="hover:text-primary hover:underline">Beranda</a></li>
			<li aria-hidden="true"><ChevronRight class="size-3.5" /></li>
			<li><a href={resolve('/berita')} class="hover:text-primary hover:underline">Berita</a></li>
			<li aria-hidden="true"><ChevronRight class="size-3.5" /></li>
			<li aria-current="page" class="min-w-0 text-ink [overflow-wrap:anywhere]">
				{data.post.title}
			</li>
		</ol>
	</nav>
</div>

<div class="mx-auto max-w-public px-4 py-8 sm:py-12">
	<div class="grid items-start gap-10 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] xl:gap-14">
		<article class="min-w-0" aria-labelledby="post-title">
			<header class="mb-7">
				<div class="mb-5 flex items-center gap-3">
					<span
						class="border border-primary/25 border-l-4 border-l-accent bg-bg-subtle px-3 py-1.5 font-mono text-xs uppercase text-primary"
					>
						{data.post.categoryName ?? 'Berita sekolah'}
					</span>
					<span class="h-px flex-1 border-t border-dashed border-primary/25" aria-hidden="true"
					></span>
				</div>
				<h1
					id="post-title"
					class="font-display text-3xl leading-tight font-bold tracking-normal text-ink [overflow-wrap:anywhere] sm:text-4xl"
				>
					{data.post.title}
				</h1>
				<div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs leading-6 text-ink-muted">
					{#if data.post.authorName}
						<span class="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]"
							><UserRound class="size-4 shrink-0" />{data.post.authorName}</span
						>
					{/if}
					{#if data.post.publishedAt}
						<span class="flex items-center gap-2"
							><CalendarDays class="size-4 shrink-0" /><time
								datetime={new Date(data.post.publishedAt).toISOString()}
								>{dateFmt.format(new Date(data.post.publishedAt))}</time
							></span
						>
					{/if}
					<span class="flex items-center gap-2"
						><Eye class="size-4 shrink-0" />{numberFmt.format(data.post.viewCount)} kali dilihat</span
					>
				</div>
			</header>

			{#if data.post.thumbnailUrl}
				<figure class="mb-6">
					<img
						src={data.post.thumbnailUrl}
						alt={data.post.thumbnailAltText ?? ''}
						width={data.post.thumbnailWidth ?? 1200}
						height={data.post.thumbnailHeight ?? 675}
						loading="eager"
						fetchpriority="high"
						class="h-auto w-full border border-line bg-bg-subtle"
					/>
					{#if data.post.imageCaption}
						<figcaption
							class="mt-3 border-l-2 border-accent pl-3 text-sm leading-6 text-ink-muted [overflow-wrap:anywhere]"
						>
							{data.post.imageCaption}
						</figcaption>
					{/if}
				</figure>
			{/if}

			<div class="mb-8 border-y border-line py-3">
				<div role="group" aria-label="Bagikan artikel" class="flex flex-wrap items-center gap-2">
					<span class="mr-2 font-mono text-xs uppercase text-ink-muted">Bagikan</span>
					<a
						href={`https://wa.me/?text=${shareText}`}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Bagikan ke WhatsApp"
						title="Bagikan ke WhatsApp"
						class="inline-flex min-h-11 items-center justify-center gap-2 border border-primary/25 px-3 text-sm text-primary hover:border-primary hover:bg-bg-subtle"
					>
						<MessageCircle class="size-4 shrink-0" /><span>WhatsApp</span>
					</a>
					<a
						href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Bagikan ke Facebook"
						title="Bagikan ke Facebook"
						class="inline-flex min-h-11 items-center justify-center gap-2 border border-primary/25 px-3 text-sm text-primary hover:border-primary hover:bg-bg-subtle"
					>
						<Share2 class="size-4 shrink-0" /><span>Facebook</span>
					</a>
					<button
						type="button"
						onclick={copyLink}
						aria-label="Salin tautan"
						title={copied ? 'Tautan tersalin' : 'Salin tautan'}
						class="inline-flex size-11 shrink-0 items-center justify-center border border-primary/25 text-primary hover:border-primary hover:bg-bg-subtle"
					>
						{#if copied}<Check class="size-4" />{:else}<Copy class="size-4" />{/if}
					</button>
					<span role="status" class="text-xs text-ink-muted"
						>{copied ? 'Tautan tersalin.' : copyFailed ? 'Gagal menyalin tautan.' : ''}</span
					>
				</div>
				{#if copyFailed}
					<input
						aria-label="Tautan artikel"
						readonly
						value={url}
						onfocus={(event) => event.currentTarget.select()}
						class="input mt-3 w-full text-sm"
					/>
				{/if}
			</div>

			<!-- Content is sanitized server-side (see $lib/server/html.ts) before rendering. -->
			<!-- eslint-disable svelte/no-at-html-tags -->
			<div
				class="post-content prose max-w-none text-ink [overflow-wrap:anywhere] prose-headings:font-display prose-headings:tracking-normal prose-headings:text-ink prose-p:leading-8 prose-a:text-primary prose-a:underline-offset-4 prose-img:mx-auto prose-img:h-auto prose-img:max-w-full prose-pre:overflow-x-auto prose-table:block prose-table:overflow-x-auto"
			>
				{@html data.post.contentHtml}
			</div>
			<!-- eslint-enable svelte/no-at-html-tags -->
		</article>

		<aside
			aria-label="Sidebar berita"
			class="min-w-0 space-y-8 lg:sticky lg:top-[calc(var(--public-header-height,5rem)+1.5rem)] lg:max-h-[calc(100dvh-var(--public-header-height,5rem)-3rem)] lg:overflow-y-auto lg:overscroll-contain"
		>
			<section aria-labelledby="news-search-title" class="border border-primary/30 p-5">
				<div class="mb-5 flex items-center gap-3">
					<h2
						id="news-search-title"
						class="border border-primary/30 bg-bg-subtle px-2 py-1 font-mono text-xs uppercase text-primary"
					>
						Cari berita
					</h2>
					<span class="flex-1 border-t border-dashed border-primary/30" aria-hidden="true"></span>
				</div>
				<form
					role="search"
					aria-label="Cari berita"
					method="GET"
					action={resolve('/search')}
					class="flex gap-2"
				>
					<label for="sidebar-news-search" class="sr-only">Kata kunci pencarian</label>
					<input
						id="sidebar-news-search"
						type="search"
						name="q"
						bind:value={$searchForm.q}
						maxlength="200"
						placeholder="Cari berita..."
						class="input min-w-0 flex-1 rounded-none border-primary/30 bg-bg text-sm"
					/>
					<button
						type="submit"
						aria-label="Cari"
						title="Cari"
						class="inline-flex size-11 shrink-0 items-center justify-center border border-primary bg-primary text-white hover:bg-primary-700"
						><Search class="size-5" /></button
					>
				</form>
			</section>

			<section aria-labelledby="sidebar-related-title" class="border border-primary/30 p-5">
				<div class="mb-2 flex items-center gap-3">
					<h2
						id="sidebar-related-title"
						class="border border-primary/30 bg-bg-subtle px-2 py-1 font-mono text-xs uppercase text-primary"
					>
						Artikel terkait
					</h2>
					<span class="flex-1 border-t border-dashed border-primary/30" aria-hidden="true"></span>
				</div>
				<ol class="divide-y divide-dashed divide-primary/20">
					{#each data.post.relatedPosts as related, index (related.id)}
						<li class="py-4">
							<a
								href={resolve(`/berita/${related.slug}`)}
								class="group grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3"
							>
								<span class="pt-1 font-mono text-xs text-ink-muted"
									>{String(index + 1).padStart(2, '0')}</span
								>
								<div>
									<h3
										class="font-display text-base leading-6 font-semibold text-ink group-hover:text-primary group-hover:underline [overflow-wrap:anywhere]"
									>
										{related.title}
									</h3>
									{#if related.publishedAt}<time
											datetime={new Date(related.publishedAt).toISOString()}
											class="mt-2 block font-mono text-xs text-ink-muted"
											>{dateFmt.format(new Date(related.publishedAt))}</time
										>{/if}
								</div>
							</a>
						</li>
					{:else}
						<li class="py-4 text-sm leading-6 text-ink-muted">Belum ada artikel terkait.</li>
					{/each}
				</ol>
			</section>

			<section aria-labelledby="news-categories-title" class="border border-primary/30 p-5">
				<div class="mb-4 flex items-center gap-3">
					<h2
						id="news-categories-title"
						class="border border-primary/30 bg-bg-subtle px-2 py-1 font-mono text-xs uppercase text-primary"
					>
						Kategori
					</h2>
					<span class="flex-1 border-t border-dashed border-primary/30" aria-hidden="true"></span>
				</div>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- resolved internal links with category query strings -->
				<ul class="divide-y divide-line">
					{#each data.post.categories as category (category.id)}
						<li>
							<a
								href={`${resolve('/berita')}?category=${encodeURIComponent(category.id)}`}
								class="flex min-h-11 items-center justify-between gap-3 py-2 text-sm hover:text-primary hover:underline {category.id ===
								data.post.categoryId
									? 'font-semibold text-primary'
									: 'text-ink-muted'}"
								><span class="min-w-0 [overflow-wrap:anywhere]">{category.name}</span><ArrowUpRight
									class="size-4 shrink-0"
								/></a
							>
						</li>
					{:else}
						<li class="text-sm text-ink-muted">Belum ada kategori.</li>
					{/each}
				</ul>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{#if data.post.tags.length}
					<h3
						class="mt-5 border-t border-dashed border-primary/30 pt-4 font-mono text-xs uppercase text-primary"
					>
						Tag
					</h3>
					<ul class="mt-3 flex flex-wrap gap-x-3 gap-y-2">
						{#each data.post.tags as tag (tag.id)}<li
								class="max-w-full font-mono text-xs leading-5 text-ink-muted [overflow-wrap:anywhere]"
							>
								#{tag.name}
							</li>{/each}
					</ul>
				{/if}
			</section>
		</aside>
	</div>

	<section
		aria-labelledby="related-posts-title"
		class="mt-12 border-t border-primary/30 pt-8 sm:mt-16"
	>
		<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="mb-2 font-mono text-xs uppercase text-primary">
					{data.post.categoryName ?? 'Berita sekolah'}
				</p>
				<h2 id="related-posts-title" class="font-display text-2xl font-semibold text-ink">
					Artikel Terkait
				</h2>
			</div>
			<a
				href={resolve('/berita')}
				class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
				>Semua berita<ArrowUpRight class="size-4" /></a
			>
		</div>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.post.relatedPosts as related (related.id)}
				<a
					href={resolve(`/berita/${related.slug}`)}
					class="group min-w-0 border-b-2 border-line pb-5 hover:border-accent"
				>
					{#if related.thumbnailUrl}
						<img
							src={related.thumbnailUrl}
							alt={related.thumbnailAltText ?? ''}
							width={related.thumbnailWidth ?? 1200}
							height={related.thumbnailHeight ?? 675}
							loading="lazy"
							class="mb-4 aspect-video w-full border border-line object-cover"
						/>
					{/if}
					{#if related.publishedAt}<time
							datetime={new Date(related.publishedAt).toISOString()}
							class="font-mono text-xs text-ink-muted"
							>{dateFmt.format(new Date(related.publishedAt))}</time
						>{/if}
					<h3
						class="mt-2 font-display text-lg leading-6 font-semibold text-ink group-hover:text-primary group-hover:underline [overflow-wrap:anywhere]"
					>
						{related.title}
					</h3>
					{#if related.excerpt}<p
							class="mt-3 line-clamp-3 text-sm leading-6 text-ink-muted [overflow-wrap:anywhere]"
						>
							{related.excerpt}
						</p>{/if}
				</a>
			{:else}
				<p class="text-sm text-ink-muted sm:col-span-2 lg:col-span-4">Belum ada artikel terkait.</p>
			{/each}
		</div>
	</section>
</div>

<style>
	/* Quill-authored layout classes survive sanitization; style them for public display. */
	.post-content :global(iframe) {
		width: 100%;
		aspect-ratio: 16 / 9;
		height: auto;
		border: 0;
	}
	.post-content :global(.ql-align-center) {
		text-align: center;
	}
	.post-content :global(.ql-align-right) {
		text-align: right;
	}
	.post-content :global(.ql-align-justify) {
		text-align: justify;
	}
	.post-content :global(.ql-indent-1) {
		padding-left: 2rem;
	}
	.post-content :global(.ql-indent-2) {
		padding-left: 4rem;
	}
	.post-content :global(.ql-indent-3) {
		padding-left: 6rem;
	}
	.post-content :global(.ql-indent-4) {
		padding-left: 8rem;
	}
</style>
