import { z } from 'zod';

export const EditUserSchema = z.object({
    email: z.string().email({ message: "Format email tidak valid" }).optional(),
    name: z.string().min(1, { message: "Nama tidak boleh kosong" }).optional(),
    role: z.enum(['stakeholder', 'masyarakat', 'pengepul']).optional(),
});

export type IEditUserDto = z.infer<typeof EditUserSchema>;