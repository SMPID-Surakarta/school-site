<script lang="ts">
	let {
		open = false,
		title = 'Konfirmasi',
		message = '',
		confirmLabel = 'Hapus',
		cancelLabel = 'Batal',
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

	// Sinkronkan prop `open` dengan state native <dialog> (showModal = fokus-trap + Esc).
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="card m-auto w-full max-w-md bg-bg p-0 shadow-xl backdrop:bg-ink/40"
	onclose={oncancel}
>
	<div class="space-y-4 p-6">
		<h2 class="font-display text-lg font-bold">{title}</h2>
		<p class="text-sm opacity-80">{message}</p>
		<div class="flex justify-end gap-2">
			<button type="button" class="btn preset-tonal" onclick={oncancel}>{cancelLabel}</button>
			<button type="button" class="btn preset-filled-error-500" onclick={onconfirm}>
				{confirmLabel}
			</button>
		</div>
	</div>
</dialog>
