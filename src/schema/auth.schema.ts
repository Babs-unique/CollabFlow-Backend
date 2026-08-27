import { z } from 'zod';

const bodySchema = {
  email: z.string().email(),
  password: z.string().min(8).max(100),
  cloudFlareToken: z.string().min(1).optional(),
};

export const loginSchema = z.object({
  body: z.object({
    ...bodySchema,
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    ...bodySchema,
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>['body'];
export type LoginRequest = z.infer<typeof loginSchema>['body'];