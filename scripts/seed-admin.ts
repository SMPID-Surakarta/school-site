/**
 * Seed an initial ADMIN account.
 *
 * Self-contained (does not import `$lib`/`$env`, which only resolve inside Vite) so it can
 * run via `bun run scripts/seed-admin.ts`. Bun auto-loads `.env`.
 *
 * Configure via env vars (optional):
 *   SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const name = process.env.SEED_ADMIN_NAME ?? 'Administrator';
const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@sekolah.test').toLowerCase().trim();
const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

if (!process.env.SEED_ADMIN_PASSWORD) {
	console.warn(
		'⚠  SEED_ADMIN_PASSWORD not set — using default "admin12345" (change it after login).'
	);
}

const sql = postgres(url, { max: 1 });

try {
	const existing = await sql`select id from users where email = ${email} limit 1`;
	if (existing.length > 0) {
		console.log(`User ${email} already exists (id: ${existing[0].id}). Nothing to do.`);
	} else {
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			parallelism: 1
		});
		const [row] = await sql`
			insert into users (name, email, password_hash, role, is_active)
			values (${name}, ${email}, ${passwordHash}, 'ADMIN', true)
			returning id`;
		console.log(`✓ Created ADMIN user ${email} (id: ${row.id})`);
	}
} catch (e) {
	console.error('Seed failed:', e instanceof Error ? e.message : e);
	process.exitCode = 1;
} finally {
	await sql.end({ timeout: 1 });
}
