import type { AppError } from '$lib/server/errors';

/**
 * Lightweight discriminated-union Result type (PRD §3). Services may return
 * `Result<T, AppError>` for expected/recoverable outcomes, or throw `AppError`
 * for exceptional ones — both patterns are supported across the codebase.
 */
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
	return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
	return !result.ok;
}
