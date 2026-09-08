import { describe, it, expect } from 'vitest';
import { can } from '$lib/rbac';

/**
 * RBAC matrix (PRD §6). These tests are the single source of truth that unauthorized
 * roles are rejected — enforcement in services relies on this being correct.
 */
describe('rbac: can()', () => {
	describe('admin-only resources (users, settings, menus, banners)', () => {
		const resources = ['users', 'settings', 'menus', 'banners'] as const;
		for (const resource of resources) {
			it(`only ADMIN may create/update/delete ${resource}`, () => {
				expect(can('ADMIN', 'create', resource)).toBe(true);
				expect(can('ADMIN', 'update', resource)).toBe(true);
				expect(can('ADMIN', 'delete', resource)).toBe(true);
				expect(can('EDITOR', 'create', resource)).toBe(false);
				expect(can('EDITOR', 'read', resource)).toBe(false);
				expect(can('STAFF', 'read', resource)).toBe(false);
			});
		}
	});

	describe('posts', () => {
		it('every role may read', () => {
			expect(can('ADMIN', 'read', 'posts')).toBe(true);
			expect(can('EDITOR', 'read', 'posts')).toBe(true);
			expect(can('STAFF', 'read', 'posts')).toBe(true);
		});

		it('ADMIN may create/update/delete/publish any post', () => {
			expect(can('ADMIN', 'create', 'posts')).toBe(true);
			expect(can('ADMIN', 'update', 'posts')).toBe(true);
			expect(can('ADMIN', 'delete', 'posts')).toBe(true);
			expect(can('ADMIN', 'publish', 'posts')).toBe(true);
		});

		it('EDITOR may create, and mutate/publish only own posts', () => {
			expect(can('EDITOR', 'create', 'posts')).toBe(true);
			const own = { userId: 'u1', ownerId: 'u1' };
			const other = { userId: 'u1', ownerId: 'u2' };
			expect(can('EDITOR', 'update', 'posts', own)).toBe(true);
			expect(can('EDITOR', 'delete', 'posts', own)).toBe(true);
			expect(can('EDITOR', 'publish', 'posts', own)).toBe(true);
			expect(can('EDITOR', 'update', 'posts', other)).toBe(false);
			expect(can('EDITOR', 'delete', 'posts', other)).toBe(false);
			expect(can('EDITOR', 'publish', 'posts', other)).toBe(false);
		});

		it('STAFF may not write posts', () => {
			expect(can('STAFF', 'create', 'posts')).toBe(false);
			expect(can('STAFF', 'update', 'posts', { userId: 'u1', ownerId: 'u1' })).toBe(false);
			expect(can('STAFF', 'delete', 'posts', { userId: 'u1', ownerId: 'u1' })).toBe(false);
		});
	});

	describe('content resources (teachers, achievements, galleries, agendas, downloads, faqs, pages)', () => {
		const resources = [
			'teachers',
			'achievements',
			'galleries',
			'agendas',
			'downloads',
			'faqs',
			'pages'
		] as const;
		for (const resource of resources) {
			it(`ADMIN+EDITOR write, STAFF read-only for ${resource}`, () => {
				expect(can('ADMIN', 'create', resource)).toBe(true);
				expect(can('EDITOR', 'update', resource)).toBe(true);
				expect(can('EDITOR', 'delete', resource)).toBe(true);
				expect(can('STAFF', 'read', resource)).toBe(true);
				expect(can('STAFF', 'create', resource)).toBe(false);
				expect(can('STAFF', 'update', resource)).toBe(false);
				expect(can('STAFF', 'delete', resource)).toBe(false);
			});
		}
	});

	describe('contacts', () => {
		it('ADMIN+EDITOR may read/reply, STAFF none', () => {
			expect(can('ADMIN', 'read', 'contacts')).toBe(true);
			expect(can('ADMIN', 'reply', 'contacts')).toBe(true);
			expect(can('EDITOR', 'read', 'contacts')).toBe(true);
			expect(can('EDITOR', 'reply', 'contacts')).toBe(true);
			expect(can('STAFF', 'read', 'contacts')).toBe(false);
			expect(can('STAFF', 'reply', 'contacts')).toBe(false);
		});
	});

	describe('media', () => {
		it('ADMIN full access', () => {
			expect(can('ADMIN', 'upload', 'media')).toBe(true);
			expect(can('ADMIN', 'delete', 'media')).toBe(true);
		});

		it('EDITOR may upload and delete only own media', () => {
			expect(can('EDITOR', 'upload', 'media')).toBe(true);
			expect(can('EDITOR', 'delete', 'media', { userId: 'u1', ownerId: 'u1' })).toBe(true);
			expect(can('EDITOR', 'delete', 'media', { userId: 'u1', ownerId: 'u2' })).toBe(false);
		});

		it('STAFF has no media access', () => {
			expect(can('STAFF', 'upload', 'media')).toBe(false);
			expect(can('STAFF', 'read', 'media')).toBe(false);
		});
	});
});
