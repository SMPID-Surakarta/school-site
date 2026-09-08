import sharp from 'sharp';

export type ProcessedImage = {
	buffer: Buffer;
	width: number;
	height: number;
	mime: 'image/webp' | 'image/avif';
	ext: 'webp' | 'avif';
};

/**
 * Squoosh-style compression (PRD §2/§10): resize (bounded), encode to BOTH WebP and
 * AVIF, then keep whichever is smaller. Returns the final buffer and its dimensions so
 * the caller can persist `width`/`height` to `media` (prevents layout shift / CLS).
 */
export async function processImage(input: Buffer, maxDimension = 2000): Promise<ProcessedImage> {
	const pipeline = sharp(input, { failOn: 'error' })
		.rotate() // respect EXIF orientation
		.resize({
			width: maxDimension,
			height: maxDimension,
			fit: 'inside',
			withoutEnlargement: true
		});

	const [webp, avif] = await Promise.all([
		pipeline.clone().webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
		pipeline.clone().avif({ quality: 50 }).toBuffer({ resolveWithObject: true })
	]);

	const format =
		avif.data.byteLength < webp.data.byteLength ? ('avif' as const) : ('webp' as const);
	const { data, info } = format === 'avif' ? avif : webp;

	return {
		buffer: data,
		width: info.width,
		height: info.height,
		mime: `image/${format}`,
		ext: format
	};
}
