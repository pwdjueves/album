import { z } from 'zod';

export const rankingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  title: z.string().trim().max(200).optional(),
  categoryId: z.string().cuid().optional(),
});

export type RankingQuery = z.infer<typeof rankingQuerySchema>;
