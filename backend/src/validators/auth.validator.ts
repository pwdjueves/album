import { z } from 'zod';

const emailSchema = z.string().trim().email().max(191).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  birthDate: z.iso.date(),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((input) => input.password === input.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((input) => input.password === input.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
