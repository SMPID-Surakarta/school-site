import { env } from '$lib/server/env';
import type { ContactMessageInput } from '$lib/server/validators/contacts';

const GATEWAY_URL = 'https://wa.faz.my.id/send-message';

function normalizeWhatsAppNumber(phone: string): string {
	const digits = phone.replace(/\D/g, '');
	if (digits.startsWith('0')) return `62${digits.slice(1)}`;
	if (digits.startsWith('8')) return `62${digits}`;
	return digits;
}

function isSuccessfulResponse(value: unknown): value is { status: true } {
	return typeof value === 'object' && value !== null && 'status' in value && value.status === true;
}

export async function forwardContactToWhatsApp(input: ContactMessageInput): Promise<void> {
	if (!env.WA_API_KEY || !env.WA_SENDER || !env.WA_RECIPIENT) return;

	const message = [
		'Pesan masuk dari website sekolah',
		`Nomor pengirim: ${normalizeWhatsAppNumber(input.phone)}`,
		`Nama: ${input.name}`,
		...(input.email ? [`Email: ${input.email}`] : []),
		'',
		input.message
	].join('\n');

	const response = await fetch(GATEWAY_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			api_key: env.WA_API_KEY,
			sender: normalizeWhatsAppNumber(env.WA_SENDER),
			number: normalizeWhatsAppNumber(env.WA_RECIPIENT),
			message,
			footer: 'Website sekolah'
		}),
		signal: AbortSignal.timeout(10_000)
	});

	const result: unknown = await response.json().catch(() => undefined);
	if (!response.ok || !isSuccessfulResponse(result)) {
		throw new Error(`WhatsApp gateway returned HTTP ${response.status}`);
	}
}
