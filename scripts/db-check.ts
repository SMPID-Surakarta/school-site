import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const redacted = url.replace(/\/\/([^:]+):[^@]*@/, '//$1:****@');
console.log('Testing connection to:', redacted);

const sql = postgres(url, { connect_timeout: 5, max: 1 });

try {
	const rows = await sql`select version() as version, current_database() as db, now() as now`;
	console.log('CONNECTED');
	console.log('  version:', rows[0].version);
	console.log('  database:', rows[0].db);
	console.log('  server time:', rows[0].now);

	const tables = await sql`
		select table_name from information_schema.tables
		where table_schema = 'public' order by table_name`;
	console.log(
		'  public tables:',
		tables.length ? tables.map((t) => t.table_name).join(', ') : '(none)'
	);
} catch (e) {
	console.error('CONNECTION FAILED');
	console.error('  code:', e.code ?? '(none)');
	console.error('  message:', e.message);
	process.exitCode = 2;
} finally {
	await sql.end({ timeout: 1 });
}
