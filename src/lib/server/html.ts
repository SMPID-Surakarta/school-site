import sanitizeHtml from 'sanitize-html';

/**
 * Server-only HTML helpers for rich-text post content.
 *
 * Post content is authored with a WYSIWYG editor (Quill) that emits HTML. That HTML is
 * untrusted (it can be pasted from Word, or crafted), so it MUST be sanitized before it is
 * persisted and before it is rendered, to prevent stored XSS (OWASP A03).
 */

/** Tags the editor can produce that we allow through the sanitizer. */
const ALLOWED_TAGS = [
	'p',
	'br',
	'hr',
	'strong',
	'b',
	'em',
	'i',
	'u',
	's',
	'h2',
	'h3',
	'h4',
	'ul',
	'ol',
	'li',
	'blockquote',
	'a',
	'img',
	'figure',
	'figcaption',
	'table',
	'thead',
	'tbody',
	'tr',
	'th',
	'td',
	'colgroup',
	'col',
	'iframe',
	'span',
	'pre',
	'code'
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: ALLOWED_TAGS,
	allowedAttributes: {
		a: ['href', 'target', 'rel'],
		img: ['src', 'alt', 'title', 'width', 'height'],
		iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'class'],
		p: ['class', 'style'],
		li: ['class', 'style'],
		h2: ['class', 'style'],
		h3: ['class', 'style'],
		h4: ['class', 'style'],
		blockquote: ['class', 'style'],
		pre: ['class'],
		table: ['style'],
		td: ['colspan', 'rowspan', 'style'],
		th: ['colspan', 'rowspan', 'style'],
		col: ['span', 'style'],
		span: ['style']
	},
	// Quill layout classes only (alignment, indent, video embed, code block).
	allowedClasses: {
		'*': [/^ql-(?:align-(?:center|right|justify)|indent-[1-8]|video|code-block)/]
	},
	// Only allow inline styles the editor actually produces.
	allowedStyles: {
		'*': {
			'text-align': [/^(left|right|center|justify)$/],
			width: [/^\d+(?:\.\d+)?(?:px|%)$/],
			'min-width': [/^\d+(?:\.\d+)?(?:px|%)$/],
			color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
			'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
			'padding-left': [/^\d+(?:\.\d+)?(?:px|em|rem)$/]
		}
	},
	// Links and images may only use safe schemes.
	allowedSchemes: ['http', 'https', 'mailto'],
	allowProtocolRelative: false,
	// Only embed videos from YouTube.
	allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'youtube.com'],
	transformTags: {
		// Force safe rel + defensive noopener on links that open a new tab.
		a: (tagName, attribs) => {
			const rel = new Set((attribs.rel ?? '').split(/\s+/).filter(Boolean));
			rel.add('noopener');
			rel.add('noreferrer');
			return { tagName, attribs: { ...attribs, rel: [...rel].join(' ') } };
		}
	}
};

/** Sanitize post HTML for safe storage/render. Returns a trimmed HTML string. */
export function sanitizePostHtml(html: string): string {
	return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

/** Whether a string appears to contain HTML markup (vs. legacy plain text). */
function looksLikeHtml(value: string): boolean {
	return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Produce render-ready, sanitized HTML for public display.
 *
 * Legacy posts were stored as plain text. To keep them readable without a data migration,
 * plain-text content is escaped and split into paragraphs (blank line = new paragraph,
 * single newline = <br>). HTML content is sanitized defensively.
 */
export function renderPostContent(content: string): string {
	if (!content) return '';
	if (looksLikeHtml(content)) return sanitizePostHtml(content);

	const escaped = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
	return escaped
		.split(/\n{2,}/)
		.map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
		.join('');
}

/** Strip all markup and collapse whitespace to plain text (for excerpts/meta). */
export function htmlToPlainText(html: string): string {
	const stripped = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
	return stripped.replace(/\s+/g, ' ').trim();
}

/** Build an excerpt of at most `maxLength` characters from HTML content. */
export function buildExcerpt(html: string, maxLength = 160): string {
	const text = htmlToPlainText(html);
	if (text.length <= maxLength) return text;
	const truncated = text.slice(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}
