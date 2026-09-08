<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		dataType: 'json'
	});
</script>

<svelte:head><title>Tambah Pengguna — Admin</title></svelte:head>

<section class="mx-auto max-w-2xl space-y-6 px-4 py-10">
	<header>
		<h1 class="h2">Tambah Pengguna</h1>
	</header>

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
				<span>Email</span>
				<input class="input" type="email" name="email" bind:value={$form.email} />
				{#if $errors.email}<span class="text-sm text-error-500">{$errors.email}</span>{/if}
			</label>

			<label class="label sm:col-span-2">
				<span>Password</span>
				<input
					class="input"
					type="password"
					name="password"
					autocomplete="new-password"
					bind:value={$form.password}
				/>
				{#if $errors.password}<span class="text-sm text-error-500">{$errors.password}</span>{/if}
			</label>

			<label class="label">
				<span>Peran</span>
				<select class="select" name="role" bind:value={$form.role}>
					<option value="ADMIN">ADMIN</option>
					<option value="EDITOR">EDITOR</option>
					<option value="STAFF">STAFF</option>
				</select>
				{#if $errors.role}<span class="text-sm text-error-500">{$errors.role}</span>{/if}
			</label>

			<label class="flex items-center gap-2 pt-6">
				<input class="checkbox" type="checkbox" name="isActive" bind:checked={$form.isActive} />
				<span>Aktif</span>
			</label>
		</div>

		<div class="flex items-center justify-end gap-3">
			<a href={resolve('/admin/users')} class="btn preset-tonal-surface">Batal</a>
			<button type="submit" class="btn preset-filled-primary-500" disabled={$submitting}>
				{$submitting ? 'Menyimpan…' : 'Simpan'}
			</button>
		</div>
	</form>
</section>
