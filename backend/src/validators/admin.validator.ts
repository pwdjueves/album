import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const updateUserSchema = z.object({
  role: z.enum(UserRole).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one user field must be provided',
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
