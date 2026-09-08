import { z } from 'zod';

const faqBase = {
	question: z.string().trim().min(1, 'Pertanyaan wajib diisi').max(300),
	answer: z.string().trim().min(1, 'Jawaban wajib diisi').max(3000),
	order: z.number().int('Urutan harus bilangan bulat').min(0).default(0)
};

export const createFaqSchema = z.object(faqBase);
export type CreateFaqInput = z.infer<typeof createFaqSchema>;

export const updateFaqSchema = z.object(faqBase);
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
