<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Seo, pageTitle } from '$lib/seo';
	import { HelpCircle } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const siteName = $derived(page.data.siteName as string);
	const origin = $derived(page.data.origin as string);

	const faqJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: data.faqs.map((f) => ({
			'@type': 'Question',
			name: f.question,
			acceptedAnswer: { '@type': 'Answer', text: f.answer }
		}))
	});
</script>

<Seo
	{siteName}
	title="FAQ"
	fullTitle={pageTitle('FAQ', siteName)}
	description="Pertanyaan yang sering diajukan tentang {siteName}."
	canonical={`${origin}${resolve('/faq')}`}
	jsonLd={data.faqs.length ? faqJsonLd : undefined}
/>

<section class="blueprint-grid border-b border-line bg-bg-subtle">
	<div class="mx-auto max-w-public px-4 py-12 sm:py-16">
		<p class="eyebrow mb-3">Pusat informasi</p>
		<h1 class="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">FAQ</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
			Jawaban singkat untuk pertanyaan yang paling sering disampaikan tentang {siteName}.
		</p>
	</div>
</section>

<section>
	<div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
		<div class="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
			<div>
				<p class="eyebrow">Pertanyaan umum</p>
				<h2 class="mt-2 font-display text-2xl font-semibold text-ink">Yang ingin diketahui</h2>
			</div>
			<p class="flex items-center gap-2 font-mono text-xs text-ink-muted">
				<HelpCircle size={15} aria-hidden="true" />
				{data.faqs.length.toString().padStart(2, '0')} PERTANYAAN
			</p>
		</div>

		<div class="space-y-3">
			{#each data.faqs as item (item.id)}
				<details
					class="crop-marks border border-line bg-bg shadow-sm transition-shadow hover:shadow-md"
				>
					<summary
						class="cursor-pointer px-5 py-4 font-display text-base font-semibold text-ink marker:text-primary"
					>
						{item.question}
					</summary>
					<div class="border-t border-line px-5 py-4">
						<p class="whitespace-pre-wrap text-sm leading-7 text-ink-muted">{item.answer}</p>
					</div>
				</details>
			{:else}
				<div class="flex flex-col items-center gap-2 py-12 text-ink-muted">
					<HelpCircle size={32} aria-hidden="true" />
					<p>Belum ada FAQ.</p>
				</div>
			{/each}
		</div>
	</div>
</section>
