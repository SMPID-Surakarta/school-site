import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { processImage } from '$lib/server/storage/images';

async function makePng(width: number, height: number): Promise<Buffer> {
	return sharp({
		create: { width, height, channels: 3, background: { r: 200, g: 30, b: 30 } }
	})
		.png()
		.toBuffer();
}

describe('processImage', () => {
	it('compresses to WebP or AVIF, whichever is smaller', async () => {
		const input = await makePng(64, 48);
		const result = await processImage(input);

		expect(['image/webp', 'image/avif']).toContain(result.mime);
		expect(['webp', 'avif']).toContain(result.ext);
		expect(result.mime).toBe(`image/${result.ext}`);
		expect(result.width).toBe(64);
		expect(result.height).toBe(48);
		expect(result.buffer.byteLength).toBeGreaterThan(0);
	});

	it('bounds large images to the max dimension without enlarging small ones', async () => {
		const large = await processImage(await makePng(300, 100), 150);
		expect(large.width).toBe(150);
		expect(large.height).toBe(50);

		const small = await processImage(await makePng(40, 40), 150);
		expect(small.width).toBe(40);
		expect(small.height).toBe(40);
	});

	it('rejects data that is not an image', async () => {
		await expect(processImage(Buffer.from('not an image'))).rejects.toThrow();
	});
});
