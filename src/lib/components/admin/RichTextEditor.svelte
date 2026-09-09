<script lang="ts">
	import { onMount } from 'svelte';
	import type Quill from 'quill';
	import 'quill/dist/quill.snow.css';
	import MediaPicker, { type SelectedMedia } from './MediaPicker.svelte';

	type Props = {
		value?: string;
		uploadEnabled?: boolean;
		placeholder?: string;
	};

	let {
		value = $bindable(''),
		uploadEnabled = false,
		placeholder = 'Tulis konten di sini...'
	}: Props = $props();

	let element = $state<HTMLDivElement>();
	let quillInstance = $state<Quill | null>(null);
	let pickerOpen = $state(false);
	let savedRange = $state<{ index: number; length: number } | null>(null);
	let uploadError = $state<string | null>(null);

	const toolbar = [
		[{ header: [2, 3, 4, false] }],
		['bold', 'italic', 'underline', 'strike'],
		[{ color: [] }, { background: [] }],
		[{ align: [] }],
		[{ list: 'ordered' }, { list: 'bullet' }],
		[{ indent: '-1' }, { indent: '+1' }],
		['blockquote', 'code-block'],
		['link', 'video'],
		['clean']
	];

	const toolbarWithImage = [...toolbar.slice(0, -2), ['link', 'image', 'video'], ['clean']];

	/** Convert YouTube watch/short/share URLs to an embeddable nocookie URL. */
	function toEmbedUrl(url: string): string | null {
		const match = url.match(
			/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i
		);
		return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
	}

	function addVideo(quill: Quill) {
		const url = window.prompt('URL video YouTube');
		if (!url) return;
		const embed = toEmbedUrl(url.trim());
		if (!embed) {
			uploadError = 'URL YouTube tidak valid';
			return;
		}
		uploadError = null;
		const range = quill.getSelection(true);
		const index = range?.index ?? quill.getLength();
		quill.insertEmbed(index, 'video', embed, 'user');
		quill.setSelection(index + 1, 0, 'silent');
	}

	function openMediaPicker(quill: Quill) {
		savedRange = quill.getSelection(true);
		pickerOpen = true;
	}

	function handleMediaSelect(media: SelectedMedia) {
		pickerOpen = false;
		if (quillInstance) {
			const index =
				savedRange?.index ?? quillInstance.getSelection(true)?.index ?? quillInstance.getLength();
			quillInstance.insertEmbed(index, 'image', media.url, 'user');
			quillInstance.setSelection(index + 1, 0, 'silent');
		}
	}

	onMount(() => {
		let cleanup = () => {};
		void (async () => {
			const { default: QuillEditor } = await import('quill');
			if (!element) return;
			const host = element;

			const instance = new QuillEditor(host, {
				theme: 'snow',
				placeholder,
				modules: {
					toolbar: {
						container: uploadEnabled ? toolbarWithImage : toolbar,
						handlers: {
							video: () => addVideo(instance),
							...(uploadEnabled ? { image: () => openMediaPicker(instance) } : {})
						}
					}
				}
			});

			quillInstance = instance;

			if (value) instance.clipboard.dangerouslyPasteHTML(value, 'silent');
			instance.on('text-change', () => {
				// Semantic export keeps lists/indent/align as portable HTML instead of Quill's internal DOM.
				value = instance.getSemanticHTML().replace(/&nbsp;/g, ' ');
			});

			cleanup = () => {
				instance.disable();
				host.innerHTML = '';
				quillInstance = null;
			};
		})();

		return () => cleanup();
	});
</script>

<div class="card overflow-hidden">
	<div bind:this={element}></div>
	{#if uploadError}
		<p class="border-t border-surface-200-800 px-4 py-2 text-sm text-error-500">{uploadError}</p>
	{/if}
</div>

<MediaPicker
	open={pickerOpen}
	kind="image"
	title="Sisipkan Gambar ke Konten"
	{uploadEnabled}
	onselect={handleMediaSelect}
	oncancel={() => (pickerOpen = false)}
/>

<style>
	:global(.ql-toolbar.ql-snow) {
		border-color: var(--color-surface-200, #d8e1e8);
		font-family: inherit;
	}
	:global(.ql-container.ql-snow) {
		border-color: var(--color-surface-200, #d8e1e8);
		font-family: inherit;
		font-size: 1rem;
	}
	:global(.ql-editor) {
		min-height: 18rem;
	}
	:global(.ql-editor img) {
		max-width: 100%;
		cursor: default;
	}
	:global(.ql-editor .ql-video) {
		width: 100%;
		aspect-ratio: 16 / 9;
		height: auto;
	}
</style>
