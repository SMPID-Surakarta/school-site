import { z } from 'zod';

const agendaBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	description: z.string().trim().max(2000).optional().or(z.literal('')),
	// datetime-local string, e.g. "2026-07-12T10:00".
	startDate: z.string().trim().min(1, 'Tanggal mulai wajib diisi'),
	endDate: z
		.string()
		.trim()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	location: z.string().trim().max(200).optional().or(z.literal(''))
};

export const createAgendaSchema = z.object(agendaBase);
export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;

export const updateAgendaSchema = z.object(agendaBase);
export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;
