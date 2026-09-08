/** Verifikasi pasca-impor + bersihkan '**' literal dari judul. Jalankan: bun run scripts/verify-import.ts */
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
try {
	await sql`update posts set title = replace(title, '**', '') where title like '%**%'`;
	const [wp] =
		await sql`select count(*)::int as c from posts where content like '%smkmuh1sambi.sch.id%'`;
	console.log('konten masih pakai URL WP:', wp.c);
	const rows = await sql`
		select slug, status, length(content) as len,
			(thumbnail_media_id is not null) as thumb, published_at::date as pub
		from posts order by published_at desc nulls last`;
	console.table(rows.map((r) => ({ ...r })));
} finally {
	await sql.end();
}
