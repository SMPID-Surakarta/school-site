<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(data.form);

	const authError = $derived(page.url.searchParams.get('error'));
</script>

<svelte:head><title>Login — Admin</title></svelte:head>

<div class="relative flex min-h-screen items-center justify-center bg-bg-subtle px-4">
	<div aria-hidden="true" class="blueprint-grid absolute inset-0 opacity-30"></div>
	<div class="crop-marks relative w-full max-w-md space-y-6 border border-line bg-bg p-8">
		<header class="space-y-1 text-center">
			<p class="eyebrow">Admin</p>
			<h1 class="font-display text-2xl font-bold">Masuk ke Dashboard</h1>
			<p class="text-sm text-ink-muted">Gunakan akun admin sekolah Anda.</p>
		</header>

		{#if authError}
			<aside class="card preset-tonal-error p-3 text-sm">Email atau password salah.</aside>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<label class="label">
				<span>Email</span>
				<input
					class="input"
					type="email"
					name="email"
					autocomplete="username"
					bind:value={$form.email}
					aria-invalid={$errors.email ? 'true' : undefined}
				/>
				{#if $errors.email}<span class="text-sm text-error-500">{$errors.email}</span>{/if}
			</label>

			<label class="label">
				<span>Password</span>
				<input
					class="input"
					type="password"
					name="password"
					autocomplete="current-password"
					bind:value={$form.password}
					aria-invalid={$errors.password ? 'true' : undefined}
				/>
				{#if $errors.password}<span class="text-sm text-error-500">{$errors.password}</span>{/if}
			</label>

			<button type="submit" class="btn preset-filled-primary-500 w-full" disabled={$submitting}>
				{$submitting ? 'Memproses…' : 'Masuk'}
			</button>
		</form>
	</div>
</div>
