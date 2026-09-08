<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import ImageUpload from './ImageUpload.svelte';
	import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS } from '$lib/utils/achievements';
	import type { CreateAchievementInput } from '$lib/server/validators/achievements';

	type Props = {
		data: SuperValidated<CreateAchievementInput>;
		submitLabel: string;
		storageEnabled?: boolean;
		imageUrl?: string | null;
	};

	let { data, submitLabel, storageEnabled = false, imageUrl = null }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data, {
		dataType: 'json'
	});

	// svelte-ignore state_referenced_locally
	let photoPreview = $state(imageUrl);
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
			<span>Nama Siswa</span>
			<input
				class="input"
				name="studentName"
				bind:value={$form.studentName}
				placeholder="mis. Budi Santoso"
			/>
			{#if $errors.studentName}<span class="text-sm text-error-500">{$errors.studentName}</span
				>{/if}
		</label>

		<div>
			<ImageUpload
				bind:value={$form.imageMediaId}
				bind:previewUrl={photoPreview}
				label="Foto Siswa"
				altText={$form.studentName ?? ''}
				enabled={storageEnabled}
			/>
			{#if $errors.imageMediaId}<span class="text-sm text-error-500">{$errors.imageMediaId}</span
				>{/if}
		</div>

		<label class="label">
			<span>Tanggal</span>
			<input class="input" type="date" name="date" bind:value={$form.date} />
			{#if $errors.date}<span class="text-sm text-error-500">{$errors.date}</span>{/if}
		</label>

		<label class="label">
			<span>Jenis Prestasi</span>
			<select class="select" name="category" bind:value={$form.category}>
				<option value="">— Pilih jenis —</option>
				{#each ACHIEVEMENT_CATEGORIES as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
			{#if $errors.category}<span class="text-sm text-error-500">{$errors.category}</span>{/if}
		</label>

		<label class="label">
			<span>Tingkat</span>
			<select class="select" name="level" bind:value={$form.level}>
				<option value="">— Pilih tingkat —</option>
				{#each ACHIEVEMENT_LEVELS as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
			{#if $errors.level}<span class="text-sm text-error-500">{$errors.level}</span>{/if}
		</label>

		<label class="label">
			<span>Peringkat</span>
			<input
				class="input"
				name="rank"
				bind:value={$form.rank}
				placeholder="mis. Juara 1 / Medali Emas"
			/>
			{#if $errors.rank}<span class="text-sm text-error-500">{$errors.rank}</span>{/if}
		</label>

		<label class="label sm:col-span-2">
			<span>Deskripsi Prestasi</span>
			<textarea class="textarea" rows="5" name="description" bind:value={$form.description}
			></textarea>
		</label>
	</div>

	<div class="flex items-center justify-end gap-3">
		<a href={resolve('/admin/achievements')} class="btn preset-tonal-surface">Batal</a>
		<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
			{$submitting ? 'Menyimpan…' : submitLabel}
		</button>
	</div>
</form>
