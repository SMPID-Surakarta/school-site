<script lang="ts">
	import { resolve } from '$app/paths';
	import { Eye, Pencil } from '@lucide/svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import RichTextEditor from './RichTextEditor.svelte';
	import type { CreatePageInput } from '$lib/server/validators/pages';

	type Props = {
		data: SuperValidated<CreatePageInput>;
		submitLabel: string;
		storageEnabled?: boolean;
	};

	let { data, submitLabel, storageEnabled = false }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data, {
		dataType: 'json'
	});

	let previewMode = $state(false);
	const previewDocument = $derived(`<!doctype html><html><head><style>
		body { margin: 1.5rem; color: #14212e; font: 16px/1.7 'Plus Jakarta Sans', Arial, sans-serif; }
		h2, h3, h4 { font-family: 'Space Grotesk', Arial, sans-serif; line-height: 1.2; }
		img { max-width: 100%; height: auto; }
		iframe, .ql-video { width: 100%; aspect-ratio: 16 / 9; height: auto; border: 0; }
		table { border-collapse: collapse; width: 100%; }
		th, td { border: 1px solid #d8e1e8; padding: .5rem; text-align: left; }
		blockquote { border-left: 4px solid #1d4e89; margin-left: 0; padding-left: 1rem; }
		pre, .ql-code-block-container { background: #14212e; color: #f5f8fa; padding: .75rem 1rem; border-radius: .375rem; overflow-x: auto; font: 14px/1.6 'JetBrains Mono', monospace; }
		.ql-align-center { text-align: center; }
		.ql-align-right { text-align: right; }
		.ql-align-justify { text-align: justify; }
		${Array.from({ length: 8 }, (_, i) => `.ql-indent-${i + 1} { padding-left: ${(i + 1) * 2}rem; }`).join('\n')}
		a { color: #1d4e89; }
	</style></head><body>${$form.content || '<p>Belum ada konten.</p>'}</body></html>`);
</script>

<form method="POST" use:enhance class="space-y-6">
	{#if $message}
		<aside class="card preset-tonal-error p-3 text-sm">{$message}</aside>
	{/if}

	<div class="card space-y-4 p-6">
		<label class="label">
			<span>Judul</span>
			<input class="input" name="title" bind:value={$form.title} />
			{#if $errors.title}<span class="text-sm text-error-500">{$errors.title}</span>{/if}
		</label>

		<label class="label">
			<span>Slug <span class="opacity-60">(opsional, otomatis dari judul)</span></span>
			<input class="input" name="slug" bind:value={$form.slug} placeholder="profil-sekolah" />
			{#if $errors.slug}<span class="text-sm text-error-500">{$errors.slug}</span>{/if}
		</label>

		<div class="label">
			<div class="mb-2 flex items-center justify-between gap-3">
				<span>Konten</span>
				<button
					type="button"
					class="btn btn-sm preset-tonal-surface"
					onclick={() => (previewMode = !previewMode)}
					aria-pressed={previewMode}
				>
					{#if previewMode}
						<Pencil size={15} /> Edit
					{:else}
						<Eye size={15} /> Pratinjau
					{/if}
				</button>
			</div>
			{#if previewMode}
				<iframe
					class="h-[32rem] w-full rounded border border-surface-200-800 bg-white"
					title="Pratinjau halaman"
					sandbox=""
					srcdoc={previewDocument}
				></iframe>
			{:else}
				<RichTextEditor
					bind:value={$form.content}
					uploadEnabled={storageEnabled}
					placeholder="Tulis isi halaman di sini..."
				/>
			{/if}
			{#if $errors.content}<span class="text-sm text-error-500">{$errors.content}</span>{/if}
		</div>

		<label class="flex items-center gap-3">
			<input class="checkbox" type="checkbox" name="published" bind:checked={$form.published} />
			<span>Terbitkan <span class="opacity-60">(halaman dapat diakses publik)</span></span>
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/pages')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
