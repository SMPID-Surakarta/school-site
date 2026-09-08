import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/env', () => ({
	env: {
		WA_API_KEY: 'test-key',
		WA_SENDER: '081234567890',
		WA_RECIPIENT: '089876543210'
	}
}));

import { forwardContactToWhatsApp } from '$lib/server/services/whatsapp.service';

const input = {
	name: 'Wali Murid',
	email: 'wali@example.com',
	phone: '0812 3456 7890',
	message: 'Mohon informasi pendaftaran.'
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('whatsapp.service', () => {
	it('forwards the sender number and message to the gateway', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ status: true }), { status: 200 }));

		await forwardContactToWhatsApp(input);

		expect(fetchMock).toHaveBeenCalledWith(
			'https://wa.faz.my.id/send-message',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"number":"6289876543210"')
			})
		);
		expect(fetchMock.mock.calls[0]?.[1]?.body).toContain(
			'"message":"Pesan masuk dari website sekolah\\nNomor pengirim: 6281234567890'
		);
	});

	it('rejects an unsuccessful gateway response', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ status: false }), { status: 200 })
		);

		await expect(forwardContactToWhatsApp(input)).rejects.toThrow(
			'WhatsApp gateway returned HTTP 200'
		);
	});
});
