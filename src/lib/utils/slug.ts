/**
 * Convert an arbitrary string into a URL-safe slug.
 * Lowercases, strips diacritics, replaces non-alphanumerics with a single dash,
 * and trims leading/trailing dashes.
 */
export function slugify(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '') // remove combining diacritics
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
