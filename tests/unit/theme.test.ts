import { describe, expect, it } from 'vitest';
import { themeSchema } from '$lib/server/validators/theme';
import { defaultTheme, themePresets, themeStyle, whiteContrast } from '$lib/utils/theme';

describe('theme configuration', () => {
	it('preserves the current design by default', () => {
		expect(themeSchema.parse({})).toEqual(defaultTheme);
	});

	it.each(themePresets)('accepts the $name preset', (preset) => {
		expect(themeSchema.safeParse(preset).success).toBe(true);
	});

	it.each(['#ffffff', '#eeeeee', 'red', '#123', '#123456;display:none'])(
		'rejects unsafe primary color %s',
		(primaryColor) => {
			expect(themeSchema.safeParse({ primaryColor }).success).toBe(false);
		}
	);

	it('rejects invalid accents and unknown fonts', () => {
		expect(themeSchema.safeParse({ accentColor: 'url(https://example.com)' }).success).toBe(false);
		expect(themeSchema.safeParse({ fontFamily: 'unknown' }).success).toBe(false);
	});

	it('generates scoped color and font tokens', () => {
		const style = themeStyle({
			primaryColor: '#16634a',
			accentColor: '#000000',
			fontFamily: 'grotesk'
		});
		expect(style).toContain('--color-primary: #16634a');
		expect(style).toContain('--color-primary-500: #16634a');
		expect(style).toContain('--color-bg-subtle: color-mix(in srgb, #16634a, white 96%)');
		expect(style).toContain('--color-line: color-mix(in srgb, #16634a, white 82%)');
		expect(style).toContain('--color-on-accent: #ffffff');
		expect(style).toContain('Space Grotesk Variable');
	});

	it('keeps generated styles safe even with malformed stored colors', () => {
		const style = themeStyle({ ...defaultTheme, accentColor: '#fff;display:none' });
		expect(style).not.toContain('display:none');
		expect(style).toContain(`--color-accent: ${defaultTheme.accentColor}`);
		expect(whiteContrast('#000000')).toBe(21);
	});

	it('provides readable foregrounds on custom accent and primary backgrounds', () => {
		const darkAccent = themeStyle({ ...defaultTheme, accentColor: '#000000' });
		expect(darkAccent).toContain('--color-accent-on-dark: #ffffff');
		expect(darkAccent).toContain('--color-accent-on-primary: #ffffff');
		const lightAccent = themeStyle({ ...defaultTheme, accentColor: '#ffffff' });
		expect(lightAccent).toContain('--color-on-accent: #000000');
		expect(lightAccent).toContain(`--color-accent-on-light: ${defaultTheme.primaryColor}`);
	});
});
