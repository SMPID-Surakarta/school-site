/**
 * Application error taxonomy. Services throw `AppError` (never a raw `Error`) so route
 * handlers can map a stable `code`/`status` to HTTP responses consistently (PRD §3).
 */
export type AppErrorCode =
	| 'VALIDATION'
	| 'UNAUTHENTICATED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'RATE_LIMITED'
	| 'INTERNAL';

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
	VALIDATION: 400,
	UNAUTHENTICATED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	RATE_LIMITED: 429,
	INTERNAL: 500
};

export class AppError extends Error {
	readonly code: AppErrorCode;
	readonly status: number;
	readonly details?: unknown;

	constructor(code: AppErrorCode, message: string, details?: unknown) {
		super(message);
		this.name = 'AppError';
		this.code = code;
		this.status = STATUS_BY_CODE[code];
		this.details = details;
	}

	static validation(message = 'Validation failed', details?: unknown) {
		return new AppError('VALIDATION', message, details);
	}
	static unauthenticated(message = 'Authentication required') {
		return new AppError('UNAUTHENTICATED', message);
	}
	static forbidden(message = 'You do not have permission to perform this action') {
		return new AppError('FORBIDDEN', message);
	}
	static notFound(message = 'Resource not found') {
		return new AppError('NOT_FOUND', message);
	}
	static conflict(message = 'Resource conflict') {
		return new AppError('CONFLICT', message);
	}
	static rateLimited(message = 'Too many requests') {
		return new AppError('RATE_LIMITED', message);
	}
	static internal(message = 'Something went wrong', details?: unknown) {
		return new AppError('INTERNAL', message, details);
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}
