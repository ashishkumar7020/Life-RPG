import { z } from 'zod';

export const characterClasses = ['Warrior', 'Scholar', 'Creator', 'Balanced'] as const;
export const displayNameSchema = z.string().trim().min(2, 'Use at least 2 characters.').max(40, 'Use no more than 40 characters.')
  .regex(/^[\p{L}\p{N} ._'\-]+$/u, 'Use letters, numbers, spaces, periods, apostrophes, underscores or hyphens.');
const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password.').max(128) });
export const signupSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: z.string().min(12, 'Use at least 12 characters.').max(128, 'Use no more than 128 characters.'),
});
export const characterSchema = z.object({ displayName: displayNameSchema, characterClass: z.enum(characterClasses) });
export type ActionState = { error?: string; message?: string; fields?: Record<string, string[]> };
