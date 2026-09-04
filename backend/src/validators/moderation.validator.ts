import { z } from 'zod';
import { AlbumStatus } from '@prisma/client';

export const moderationStatusSchema = z.object({ status: z.enum(AlbumStatus) }).strict();
export type ModerationStatusInput = z.infer<typeof moderationStatusSchema>;
