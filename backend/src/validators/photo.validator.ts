import { PhotoSourceType } from '@prisma/client';
import { z } from 'zod';

const httpsImageUrl = z
  .string()
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === 'https:', 'imageUrl must use HTTPS');

export const externalPhotoSchema = z
  .object({
    sourceType: z.literal(PhotoSourceType.URL),
    imageUrl: httpsImageUrl,
  })
  .strict();

export const uploadPhotoSchema = z
  .object({ sourceType: z.literal(PhotoSourceType.UPLOAD).optional() })
  .strict();

export type ExternalPhotoInput = z.infer<typeof externalPhotoSchema>;
