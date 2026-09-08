import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$lib/server/env';
import { AppError } from '$lib/server/errors';

/**
 * Local-disk object storage (replaces Cloudflare R2). Files live under `UPLOAD_DIR`
 * (default `uploads/`, outside the build output) and are served by the
 * `/uploads/[...path]` route. Only the storage facade may call this module.
 */

const root = path.resolve(env.UPLOAD_DIR);

/** Resolve a storage key to an absolute path, rejecting traversal outside the upload dir. */
function resolvePath(key: string): string {
	const filePath = path.resolve(root, key);
	if (!filePath.startsWith(root + path.sep)) {
		throw AppError.validation('Kunci penyimpanan tidak valid');
	}
	return filePath;
}

/** Writes a buffer to the upload directory and returns the public URL for the object. */
export async function putObject(key: string, body: Buffer): Promise<string> {
	const filePath = resolvePath(key);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, body);
	return publicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
	try {
		await unlink(resolvePath(key));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
	}
}

/** Reads an object from disk; returns null when the file does not exist. */
export async function readObject(key: string): Promise<Buffer | null> {
	try {
		return await readFile(resolvePath(key));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}
}

export function publicUrl(key: string): string {
	return `/uploads/${key}`;
}
