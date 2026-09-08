/** Pilihan jenis & tingkat prestasi — shared antara form admin (client) dan validator (server). */
export const ACHIEVEMENT_CATEGORIES = ['Akademik', 'Olahraga', 'Keagamaan', 'Lingkungan'] as const;
export const ACHIEVEMENT_LEVELS = ['Kabupaten/Kota', 'Provinsi', 'Nasional'] as const;

export const LEGACY_ACHIEVEMENT_CATEGORIES = ['Non Akademik'] as const;
export const LEGACY_ACHIEVEMENT_LEVELS = ['Kota'] as const;

export function normalizeAchievementCategory(category: string | null): string | null {
	return category?.toLowerCase() === 'non akademik' ? 'Lainnya' : category;
}

export function normalizeAchievementLevel(level: string | null): string | null {
	return level?.toLowerCase() === 'kota' ? 'Kabupaten/Kota' : level;
}
