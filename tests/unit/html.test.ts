import { describe, it, expect } from 'vitest';
import {
	sanitizePostHtml,
	renderPostContent,
	htmlToPlainText,
	buildExcerpt
} from '$lib/server/html';

describe('sanitizePostHtml', () => {
	it('strips script tags and event handlers', () => {
		const dirty = '<p onclick="steal()">Hi</p><script>alert(1)</script>';
		const clean = sanitizePostHtml(dirty);
		expect(clean).toContain('<p>Hi</p>');
		expect(clean).not.toContain('script');
		expect(clean).not.toContain('onclick');
	});

	it('keeps allowed formatting tags', () => {
		const html = '<h2>Judul</h2><p><strong>tebal</strong> <em>miring</em></p><ul><li>a</li></ul>';
		expect(sanitizePostHtml(html)).toBe(html);
	});

	it('forces safe rel on links and drops javascript: URLs', () => {
		const clean = sanitizePostHtml('<a href="https://x.test">ok</a>');
		expect(clean).toContain('rel="noopener noreferrer"');

		const evil = sanitizePostHtml('<a href="javascript:alert(1)">x</a>');
		expect(evil).not.toContain('javascript:');
	});

	it('allows YouTube iframes but rejects arbitrary iframes', () => {
		const yt = sanitizePostHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>');
		expect(yt).toContain('youtube.com/embed/abc');

		const bad = sanitizePostHtml('<iframe src="https://evil.test/x"></iframe>');
		expect(bad).not.toContain('evil.test');
	});

	it('keeps Quill alignment/indent classes but strips unknown classes', () => {
		const html = '<p class="ql-align-center evil-class">tengah</p>';
		const clean = sanitizePostHtml(html);
		expect(clean).toContain('ql-align-center');
		expect(clean).not.toContain('evil-class');

		expect(sanitizePostHtml('<p class="ql-indent-2">masuk</p>')).toContain('ql-indent-2');
	});

	it('keeps text color and background-color styles on spans', () => {
		const html = '<p><span style="color:#e60000">merah</span></p>';
		expect(sanitizePostHtml(html)).toContain('color:#e60000');
	});

	it('keeps code blocks', () => {
		const html = '<pre><code>const a = 1;</code></pre>';
		expect(sanitizePostHtml(html)).toContain('<pre><code>const a = 1;</code></pre>');
	});
});

describe('renderPostContent', () => {
	it('wraps legacy plain text into paragraphs', () => {
		const out = renderPostContent('Baris satu\n\nBaris dua');
		expect(out).toBe('<p>Baris satu</p><p>Baris dua</p>');
	});

	it('escapes HTML-looking plain text safely', () => {
		const out = renderPostContent('a < b and c > d');
		expect(out).not.toContain('<b');
	});

	it('sanitizes content that already contains HTML', () => {
		const out = renderPostContent('<p>Hi</p><script>x</script>');
		expect(out).toContain('<p>Hi</p>');
		expect(out).not.toContain('script');
	});
});

describe('buildExcerpt', () => {
	it('strips markup and truncates on a word boundary', () => {
		const html = `<p>${'kata '.repeat(60)}</p>`;
		const excerpt = buildExcerpt(html, 40);
		expect(excerpt.length).toBeLessThanOrEqual(41);
		expect(excerpt.endsWith('…')).toBe(true);
	});

	it('returns full text when short', () => {
		expect(buildExcerpt('<p>Halo dunia</p>')).toBe('Halo dunia');
	});
});

describe('htmlToPlainText', () => {
	it('collapses whitespace and removes tags', () => {
		expect(htmlToPlainText('<p>Halo</p>\n<p>  dunia </p>')).toBe('Halo dunia');
	});
});
