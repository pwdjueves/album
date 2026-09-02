import { AlbumPrivacy, AlbumStatus } from '@prisma/client';
import { z } from 'zod';

const titleSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z.string().trim().min(1).max(10_000).nullable();
const categoryIdSchema = z.string().cuid();
const groupIdSchema = z.string().cuid().nullable();

const albumFieldsSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  categoryId: categoryIdSchema,
  privacy: z.enum(AlbumPrivacy).default(AlbumPrivacy.PRIVATE),
  status: z.enum(AlbumStatus).default(AlbumStatus.ACTIVE),
  groupId: groupIdSchema.optional(),
});

export const createAlbumSchema = albumFieldsSchema
  .strict()
  .refine((input) => input.privacy !== AlbumPrivacy.GROUP || input.groupId !== undefined && input.groupId !== null, {
    message: 'A group album requires a groupId',
    path: ['groupId'],
  });

export const updateAlbumSchema = albumFieldsSchema
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one album field must be provided',
  });

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
