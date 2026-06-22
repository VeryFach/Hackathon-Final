import { z } from 'zod';

export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().optional(),
    role: z.enum(['stakeholder', 'masyarakat', 'pengepul']).optional(),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type IRegisterDto = z.infer<typeof RegisterSchema>;
export type ILoginDto = z.infer<typeof LoginSchema>;