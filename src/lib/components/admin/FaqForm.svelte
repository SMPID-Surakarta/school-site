<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { CreateFaqInput } from '$lib/server/validators/faqs';

	type Props = {
		data: SuperValidated<CreateFaqInput>;
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

	<div class="card space-y-4 p-6">
		<label class="label">
			<span>Pertanyaan</span>
			<input class="input" name="question" bind:value={$form.question} />
			{#if $errors.question}<span class="text-sm text-error-500">{$errors.question}</span>{/if}
		</label>

		<label class="label">
			<span>Jawaban</span>
			<textarea class="textarea" rows="5" name="answer" bind:value={$form.answer}></textarea>
			{#if $errors.answer}<span class="text-sm text-error-500">{$errors.answer}</span>{/if}
		</label>

		<label class="label max-w-40">
			<span>Urutan</span>
			<input class="input" type="number" min="0" name="order" bind:value={$form.order} />
			{#if $errors.order}<span class="text-sm text-error-500">{$errors.order}</span>{/if}
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/faqs')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
