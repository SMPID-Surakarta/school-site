import type { Settings } from '$lib/db/schema';

/** Absolute site origin fallback used when no request origin is available. */
export const DEFAULT_SITE_NAME = 'Website Sekolah';

export type SeoData = {
	/** Page-specific title (without the site-name suffix). */
	title: string;
	description?: string;
	/** Absolute canonical URL. */
	canonical: string;
	/** Absolute Open Graph image URL. */
	image?: string | null;
	type?: 'website' | 'article';
	noindex?: boolean;
	/** Optional JSON-LD structured-data object(s). */
	jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/** Compose the full document title: "Page — Site". */
export function pageTitle(title: string, siteName: string): string {
	if (!title || title === siteName) return siteName;
	return `${title} — ${siteName}`;
}

/** Organization JSON-LD built from site settings. */
export function organizationJsonLd(
	settings: Settings | undefined,
	origin: string
): Record<string, unknown> {
	const sameAs = settings?.socialMedia
		? Object.values(settings.socialMedia).filter((v): v is string => Boolean(v))
		: [];
	return {
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: settings?.schoolName || DEFAULT_SITE_NAME,
		url: origin,
		...(settings?.description ? { description: settings.description } : {}),
		...(settings?.address ? { address: settings.address } : {}),
		...(settings?.phone ? { telephone: settings.phone } : {}),
		...(settings?.email ? { email: settings.email } : {}),
		...(sameAs.length ? { sameAs } : {})
	};
}

/** Article JSON-LD for a news post. */
export function articleJsonLd(params: {
	title: string;
	description?: string | null;
	url: string;
	image?: string | null;
	datePublished?: Date | null;
	dateModified?: Date | null;
	authorName?: string | null;
	publisherName: string;
}): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'NewsArticle',
		headline: params.title,
		...(params.description ? { description: params.description } : {}),
		mainEntityOfPage: params.url,
		...(params.image ? { image: [params.image] } : {}),
		...(params.datePublished ? { datePublished: params.datePublished.toISOString() } : {}),
		...(params.dateModified ? { dateModified: params.dateModified.toISOString() } : {}),
		...(params.authorName ? { author: { '@type': 'Person', name: params.authorName } } : {}),
		publisher: { '@type': 'Organization', name: params.publisherName }
	};
}
