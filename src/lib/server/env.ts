import { z } from 'zod';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * Runtime validation of required private environment variables (PRD §7 Phase 1).
 * Import this module from server-only code; it throws early at startup if the
 * environment is misconfigured, instead of failing deep inside a request.
 */

const envSchema = z.object({
	// Database
	DATABASE_URL: z.string().url(),

	// Auth.js
	AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

	// Local media storage directory (relative to the process cwd, or absolute).
	UPLOAD_DIR: z.preprocess(
		(v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
		z.string().min(1).default('uploads')
	),

	// Runtime
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

	// WhatsApp gateway. Forwarding is disabled when these are empty.
	WA_API_KEY: z.string().default(''),
	WA_SENDER: z.string().default(''),
	WA_RECIPIENT: z.string().default('')
});

const parsed = envSchema.safeParse(privateEnv);

if (!parsed.success) {
	const issues = parsed.error.issues
		.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
		.join('\n');
	throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
