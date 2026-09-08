import * as postsRepo from '$lib/server/repositories/posts.repository';
import * as categoriesRepo from '$lib/server/repositories/categories.repository';
import * as tagsRepo from '$lib/server/repositories/tags.repository';
import * as teachersRepo from '$lib/server/repositories/teachers.repository';
import * as achievementsRepo from '$lib/server/repositories/achievements.repository';
import * as galleriesRepo from '$lib/server/repositories/galleries.repository';
import * as agendasRepo from '$lib/server/repositories/agendas.repository';
import * as downloadsRepo from '$lib/server/repositories/downloads.repository';
import * as faqsRepo from '$lib/server/repositories/faqs.repository';
import * as pagesRepo from '$lib/server/repositories/pages.repository';
import * as bannersRepo from '$lib/server/repositories/banners.repository';
import * as menusRepo from '$lib/server/repositories/menus.repository';
import * as settingsRepo from '$lib/server/repositories/settings.repository';
import * as mediaRepo from '$lib/server/repositories/media.repository';
import * as contactsRepo from '$lib/server/repositories/contacts.repository';
import { forwardContactToWhatsApp } from '$lib/server/services/whatsapp.service';
import { renderPostContent } from '$lib/server/html';
import { publicNewsFiltersSchema } from '$lib/server/validators/public-news';
import type { ContactMessageInput } from '$lib/server/validators/contacts';
import {
	defaultLandingPage,
	landingPageSchema,
	type LandingPageInput
} from '$lib/server/validators/landing-page';
import type { Agenda, Category, Contact, Faq, Page, Settings } from '$lib/db/schema';

/**
 * Public read service — aggregates published/visible data for the public site.
 * No RBAC (public), but every query is scoped to published, non-deleted rows via
 * the repositories' public methods.
 */

/** Number of posts per page on public listings/search. */
export const PAGE_SIZE = 9;

export type Paginated<T> = {
	items: T[];
	page: number;
	pageCount: number;
	total: number;
};

export type PublicFacility = LandingPageInput['facilities'][number] & {
	imageUrl: string | null;
	imageAltText: string | null;
	imageWidth: number | null;
	imageHeight: number | null;
};

function toPage(value: string | null): number {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : 1;
}

export async function getSiteSettings(): Promise<Settings | undefined> {
	return settingsRepo.get();
}

export type PublicNavChild = { id: string; title: string; url: string };
export type PublicNavItem = PublicNavChild & { children: PublicNavChild[] };

/** Visible navigation tree (children of hidden parents are excluded too). */
export async function getNavigation(): Promise<PublicNavItem[]> {
	const rows = await menusRepo.listVisible();
	const parents = rows.filter((r) => !r.parentId);
	return parents.map((p) => ({
		id: p.id,
		title: p.title,
		url: p.url,
		children: rows
			.filter((c) => c.parentId === p.id)
			.map((c) => ({ id: c.id, title: c.title, url: c.url }))
	}));
}

/** Data for the public home page. */
export async function getHomeData(): Promise<{
	landingPage: LandingPageInput;
	facilities: PublicFacility[];
	banners: bannersRepo.PublicBanner[];
	pinnedPosts: postsRepo.PublicPostCard[];
	latestPosts: postsRepo.PublicPostCard[];
	achievements: Awaited<ReturnType<typeof achievementsRepo.list>>;
	agendas: Agenda[];
	stats: { teachers: number; achievements: number; agendas: number };
}> {
	const settings = await settingsRepo.get();
	const landingPage = settings?.landingPage
		? landingPageSchema.parse(settings.landingPage)
		: defaultLandingPage;
	const facilityMediaPromise = landingPage.showFacilities
		? mediaRepo.getByIds(
				landingPage.facilities.flatMap((facility) =>
					facility.imageMediaId ? [facility.imageMediaId] : []
				)
			)
		: Promise.resolve([]);
	const [banners, pinnedPosts, latestPosts, achievements, agendas, teachers, facilityMedia] =
		await Promise.all([
			bannersRepo.listActive(),
			landingPage.showPinnedPosts ? postsRepo.listPinned(3) : Promise.resolve([]),
			landingPage.showLatestPosts
				? postsRepo.listPublished(landingPage.latestPostsLimit, 0)
				: Promise.resolve([]),
			achievementsRepo.list(),
			agendasRepo.list(),
			teachersRepo.listActive(),
			facilityMediaPromise
		]);
	const facilityMediaById = new Map(facilityMedia.map((item) => [item.id, item]));
	return {
		landingPage,
		facilities: landingPage.showFacilities
			? landingPage.facilities.map((facility) => {
					const image = facility.imageMediaId
						? facilityMediaById.get(facility.imageMediaId)
						: undefined;
					return {
						...facility,
						imageUrl: image?.url ?? null,
						imageAltText: image?.altText ?? facility.title,
						imageWidth: image?.width ?? null,
						imageHeight: image?.height ?? null
					};
				})
			: [],
		banners,
		pinnedPosts,
		latestPosts,
		achievements: landingPage.showAchievements
			? achievements.slice(0, landingPage.achievementsLimit)
			: [],
		agendas: landingPage.showAgendas ? agendas.slice(0, landingPage.agendasLimit) : [],
		stats: {
			teachers: teachers.length,
			achievements: achievements.length,
			agendas: agendas.length
		}
	};
}

export async function listNews(
	pageParam: string | null,
	categoryParam: string | null = null
): Promise<Paginated<postsRepo.PublicPostCard> & { category: Category | undefined }> {
	const page = toPage(pageParam);
	const { categoryId } = publicNewsFiltersSchema.parse({
		categoryId: categoryParam ?? undefined
	});
	const [items, total, category] = await Promise.all([
		postsRepo.listPublished(PAGE_SIZE, (page - 1) * PAGE_SIZE, categoryId),
		postsRepo.countPublished(categoryId),
		categoryId ? categoriesRepo.getById(categoryId) : undefined
	]);
	return { items, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, category };
}

export async function getNewsBySlug(slug: string) {
	const post = await postsRepo.getPublishedBySlug(slug);
	if (!post) return undefined;
	// Count the view (best-effort) and hand back render-ready, sanitized HTML.
	const [, relatedPosts, categories, tags] = await Promise.all([
		postsRepo.incrementViewCount(post.id),
		post.categoryId ? postsRepo.listRelated(post.categoryId, post.id, 4) : [],
		categoriesRepo.listAll(),
		tagsRepo.listForPost(post.id)
	]);
	return {
		...post,
		contentHtml: renderPostContent(post.content),
		imageCaption: post.thumbnailAltText?.trim() ?? '',
		relatedPosts,
		categories,
		tags
	};
}

export async function searchNews(
	query: string,
	pageParam: string | null
): Promise<Paginated<postsRepo.PublicPostCard>> {
	const page = toPage(pageParam);
	const trimmed = query.trim();
	if (!trimmed) return { items: [], page: 1, pageCount: 1, total: 0 };

	const [items, total] = await Promise.all([
		postsRepo.search(trimmed, PAGE_SIZE, (page - 1) * PAGE_SIZE),
		postsRepo.countSearch(trimmed)
	]);
	return { items, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), total };
}

export async function listTeachers(): Promise<teachersRepo.PublicTeacher[]> {
	return teachersRepo.listActivePublic();
}

export async function listAchievements(
	pageParam: string | null = null
): Promise<Paginated<achievementsRepo.PublicAchievementCard>> {
	const page = toPage(pageParam);
	const [items, total] = await Promise.all([
		achievementsRepo.listPaginated(PAGE_SIZE, (page - 1) * PAGE_SIZE),
		achievementsRepo.count()
	]);
	return { items, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), total };
}

export async function listGalleries(): Promise<galleriesRepo.GalleryAlbumCard[]> {
	return galleriesRepo.listAlbums();
}

export async function getGalleryAlbum(
	id: string
): Promise<galleriesRepo.GalleryAlbumDetail | undefined> {
	return galleriesRepo.getAlbumById(id);
}

export async function listAgendas(): Promise<Agenda[]> {
	return agendasRepo.list();
}

export async function listDownloads() {
	return downloadsRepo.list();
}

export async function listFaqs(): Promise<Faq[]> {
	return faqsRepo.list();
}

export async function getPage(slug: string): Promise<(Page & { contentHtml: string }) | undefined> {
	const page = await pagesRepo.getPublishedBySlug(slug);
	if (!page) return undefined;
	return { ...page, contentHtml: renderPostContent(page.content) };
}

export async function submitContact(input: ContactMessageInput): Promise<Contact> {
	const contact = await contactsRepo.create({
		name: input.name,
		email: input.email?.trim() ? input.email.trim() : null,
		phone: input.phone?.trim() ? input.phone.trim() : null,
		message: input.message
	});

	try {
		await forwardContactToWhatsApp(input);
	} catch (error) {
		console.error('Failed to forward contact message to WhatsApp', error);
	}

	return contact;
}

// Feed/sitemap data (shares the same published scope as public listings).
export async function getFeedPosts() {
	return postsRepo.listPublishedForFeed();
}

export async function listPublishedPages(): Promise<Page[]> {
	return pagesRepo.listPublished();
}
