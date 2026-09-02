import { PhotoSlotStatus } from '@prisma/client';
import { z } from 'zod';

const positionSchema = z.number().int().min(1);
const promptSchema = z.string().trim().min(1).max(10_000);

export const createPageSchema = z.object({}).strict();

export const updatePageSchema = z
  .object({ pageNumber: positionSchema })
  .strict();

export const createSlotSchema = z
  .object({
    prompt: promptSchema,
    position: positionSchema.optional(),
    status: z.enum(PhotoSlotStatus).default(PhotoSlotStatus.EMPTY),
  })
  .strict();

export const updateSlotSchema = z
  .object({
    prompt: promptSchema.optional(),
    position: positionSchema.optional(),
    status: z.enum(PhotoSlotStatus).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one slot field must be provided',
  });

export const reorderSlotsSchema = z
  .object({ slotIds: z.array(z.string().cuid()) })
  .strict()
  .refine((input) => new Set(input.slotIds).size === input.slotIds.length, {
    message: 'slotIds must not contain duplicates',
    path: ['slotIds'],
  });

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type ReorderSlotsInput = z.infer<typeof reorderSlotsSchema>;
