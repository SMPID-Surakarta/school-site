<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { CreateAgendaInput } from '$lib/server/validators/agendas';

	type Props = {
		data: SuperValidated<CreateAgendaInput>;
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

		<label class="label">
			<span>Mulai</span>
			<input class="input" type="datetime-local" name="startDate" bind:value={$form.startDate} />
			{#if $errors.startDate}<span class="text-sm text-error-500">{$errors.startDate}</span>{/if}
		</label>

		<label class="label">
			<span>Selesai <span class="opacity-60">(opsional)</span></span>
			<input class="input" type="datetime-local" name="endDate" bind:value={$form.endDate} />
		</label>

		<label class="label sm:col-span-2">
			<span>Lokasi</span>
			<input class="input" name="location" bind:value={$form.location} />
		</label>

		<label class="label sm:col-span-2">
			<span>Deskripsi</span>
			<textarea class="textarea" rows="4" name="description" bind:value={$form.description}
			></textarea>
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/agendas')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
