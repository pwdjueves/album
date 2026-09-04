import { AlbumPrivacy, AlbumStatus } from '@prisma/client';
import { z } from 'zod';

const titleSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z.string().trim().min(1).max(10_000).nullable();
const categoryIdSchema = z.string().cuid();
const groupIdSchema = z.string().cuid().nullable();
const pageStructureSchema = z.object({
  id: z.string().cuid().optional(),
  title: titleSchema,
  slots: z.array(z.object({
    id: z.string().cuid().optional(),
    prompt: z.string().trim().min(1).max(10_000),
  })).min(1),
});

const structureSchema = z.object({ pages: z.array(pageStructureSchema).min(1) })
  .refine((input) => {
    const pageIds = input.pages.flatMap((page) => page.id ? [page.id] : []);
    const slotIds = input.pages.flatMap((page) => page.slots.flatMap((slot) => slot.id ? [slot.id] : []));
    return new Set(pageIds).size === pageIds.length && new Set(slotIds).size === slotIds.length;
  }, { message: 'Page and slot ids must be unique' })
  .optional();

const albumFieldsSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  categoryId: categoryIdSchema,
  privacy: z.enum(AlbumPrivacy).default(AlbumPrivacy.PRIVATE),
  status: z.enum(AlbumStatus).default(AlbumStatus.ACTIVE),
  groupId: groupIdSchema.optional(),
  structure: structureSchema,
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

export const moderationSchema = z.object({
  status: z.enum(AlbumStatus),
}).strict();
export type ModerationInput = z.infer<typeof moderationSchema>;
