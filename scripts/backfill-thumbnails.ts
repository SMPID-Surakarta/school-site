/** Backfill thumbnail dari foto pertama dalam konten bila featured image kosong. */
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
try {
	const rows = await sql`
		update posts p
		set thumbnail_media_id = m.id
		from media m
		where p.thumbnail_media_id is null
			and m.url = substring(p.content from 'src="(/uploads/images/[^"]+)"')
		returning p.slug, m.url`;
	for (const r of rows) console.log(`✓ ${r.slug} → ${r.url}`);
	console.log(`${rows.length} thumbnail di-backfill.`);
} finally {
	await sql.end();
}
