<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { CreateTeacherInput } from '$lib/server/validators/teachers';

	type Props = {
		data: SuperValidated<CreateTeacherInput>;
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
			<span>Nama</span>
			<input class="input" name="name" bind:value={$form.name} />
			{#if $errors.name}<span class="text-sm text-error-500">{$errors.name}</span>{/if}
		</label>

		<label class="label sm:col-span-2">
			<span>Slug <span class="opacity-60">(opsional, otomatis dari nama)</span></span>
			<input class="input" name="slug" bind:value={$form.slug} placeholder="nama-guru" />
			{#if $errors.slug}<span class="text-sm text-error-500">{$errors.slug}</span>{/if}
		</label>

		<label class="label">
			<span>Jabatan</span>
			<input class="input" name="position" bind:value={$form.position} />
		</label>

		<label class="label">
			<span>Mapel</span>
			<input class="input" name="subject" bind:value={$form.subject} />
		</label>

		<label class="label sm:col-span-2">
			<span>NIP / NUPTK</span>
			<input class="input" name="nipNuptk" bind:value={$form.nipNuptk} />
		</label>

		<label class="label sm:col-span-2">
			<span>Bio</span>
			<textarea class="textarea" rows="5" name="bio" bind:value={$form.bio}></textarea>
		</label>

		<label class="flex items-center gap-2">
			<input class="checkbox" type="checkbox" name="isActive" bind:checked={$form.isActive} />
			<span>Aktif</span>
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/teachers')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
