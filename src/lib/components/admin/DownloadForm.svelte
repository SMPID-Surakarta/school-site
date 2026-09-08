<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { CreateDownloadInput } from '$lib/server/validators/downloads';

	type Props = {
		data: SuperValidated<CreateDownloadInput>;
		submitLabel: string;
	};

	let { data, submitLabel }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data, {
		dataType: 'json'
	});
</script>

<form method="POST" use:enhance class="space-y-6">
	{#if $message}
		<aside class="card preset-tonal-error p-3 text-sm">{$message}</aside>
	{/if}

	<div class="card grid gap-4 p-6 sm:grid-cols-2">
		<label class="label sm:col-span-2">
			<span>Judul</span>
			<input class="input" name="title" bind:value={$form.title} />
			{#if $errors.title}<span class="text-sm text-error-500">{$errors.title}</span>{/if}
		</label>

		<label class="label sm:col-span-2">
			<span>Link Unduhan</span>
			<input
				class="input"
				name="url"
				bind:value={$form.url}
				placeholder="https://contoh.id/formulir.pdf atau /uploads/formulir.pdf"
				type="text"
			/>
			{#if $errors.url}<span class="text-sm text-error-500">{$errors.url}</span>{/if}
		</label>

		<label class="label">
			<span>Kategori</span>
			<input
				class="input"
				name="category"
				bind:value={$form.category}
				placeholder="Formulir / Kalender"
			/>
		</label>

		<label class="label">
			<span>Ukuran</span>
			<input class="input" name="size" bind:value={$form.size} placeholder="mis. 1.2 MB" />
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/downloads')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
