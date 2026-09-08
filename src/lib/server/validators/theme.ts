import { z } from 'zod';
import { defaultTheme, hexColorPattern, whiteContrast } from '$lib/utils/theme';

const hexColor = z
	.string()
	.regex(hexColorPattern, 'Gunakan kode warna HEX 6 digit, misalnya #1d4e89');

export const themeSchema = z.object({
	primaryColor: hexColor
		.refine(
			(value) => whiteContrast(value) >= 4.5,
			'Pilih warna utama lebih gelap agar teks putih terbaca'
		)
		.default(defaultTheme.primaryColor),
	accentColor: hexColor.default(defaultTheme.accentColor),
	fontFamily: z.enum(['jakarta', 'grotesk']).default(defaultTheme.fontFamily)
});

export type ThemeInput = z.infer<typeof themeSchema>;
