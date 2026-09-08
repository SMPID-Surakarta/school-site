export type ThemeConfig = {
	primaryColor: string;
	accentColor: string;
	fontFamily: 'jakarta' | 'grotesk';
};

export const defaultTheme: ThemeConfig = {
	primaryColor: '#1d4e89',
	accentColor: '#f2994a',
	fontFamily: 'jakarta'
};

export const themePresets = [
	{ name: 'Biru Teknik', primaryColor: '#1d4e89', accentColor: '#f2994a' },
	{ name: 'Hijau Akademik', primaryColor: '#16634a', accentColor: '#e9b949' },
	{ name: 'Merah Klasik', primaryColor: '#9f253a', accentColor: '#f2bd50' },
	{ name: 'Grafit Modern', primaryColor: '#303740', accentColor: '#65d6c3' }
] as const;

export const hexColorPattern = /^#[0-9a-f]{6}$/i;

export function whiteContrast(color: string): number {
	if (!hexColorPattern.test(color)) return 0;
	const channels = [1, 3, 5].map((offset) => {
		const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
		return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
	return 1.05 / (luminance + 0.05);
}

export function themeStyle(theme: ThemeConfig): string {
	const primary =
		whiteContrast(theme.primaryColor) >= 4.5 ? theme.primaryColor : defaultTheme.primaryColor;
	const accent = hexColorPattern.test(theme.accentColor)
		? theme.accentColor
		: defaultTheme.accentColor;
	const font =
		theme.fontFamily === 'grotesk' ? 'Space Grotesk Variable' : 'Plus Jakarta Sans Variable';
	const tokens: Record<string, string> = {
		'--color-primary': primary,
		'--color-accent': accent,
		'--color-on-accent': whiteContrast(accent) >= 4.5 ? '#ffffff' : '#000000',
		'--color-accent-on-light': whiteContrast(accent) >= 4.5 ? accent : primary,
		'--color-accent-on-dark':
			whiteContrast('#14212e') / whiteContrast(accent) >= 4.5 ? accent : '#ffffff',
		'--color-accent-on-primary':
			whiteContrast(primary) / whiteContrast(accent) >= 4.5 ? accent : '#ffffff',
		'--font-sans': `'${font}', ui-sans-serif, system-ui, sans-serif`,
		'--base-font-family': 'var(--font-sans)',
		'--color-primary-500': primary,
		'--color-primary-contrast-500': '#ffffff'
	};
	for (const [shade, percentage] of [
		[50, 96],
		[100, 88],
		[200, 72],
		[300, 52],
		[400, 28]
	]) {
		tokens[`--color-primary-${shade}`] = `color-mix(in srgb, ${primary}, white ${percentage}%)`;
	}
	for (const [shade, percentage] of [
		[600, 12],
		[700, 24],
		[800, 40],
		[900, 56],
		[950, 72]
	]) {
		tokens[`--color-primary-${shade}`] = `color-mix(in srgb, ${primary}, black ${percentage}%)`;
	}
	return Object.entries(tokens)
		.map(([name, value]) => `${name}: ${value}`)
		.join('; ');
}
