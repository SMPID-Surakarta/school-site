import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id password hashing (PRD §9). Parameters follow OWASP recommendations.
 * `@node-rs/argon2` defaults to the Argon2id variant.
 */
const OPTIONS = {
	memoryCost: 19456, // 19 MiB
	timeCost: 2,
	parallelism: 1
};

export function hashPassword(plain: string): Promise<string> {
	return hash(plain, OPTIONS);
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
	try {
		return await verify(digest, plain, OPTIONS);
	} catch {
		return false;
	}
}
