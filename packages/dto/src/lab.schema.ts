import { z } from 'zod';

export const CreateLabResultSchema = z.object({
  ffa: z.number().min(0, 'FFA must be non-negative'),
  water: z.number().min(0, 'Water content must be non-negative'),
  impurity: z.number().min(0, 'Impurity must be non-negative'),
  notes: z.string().optional(),
});

export const RejectLabSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

export type ICreateLabResultDto = z.infer<typeof CreateLabResultSchema>;
export type IRejectLabDto = z.infer<typeof RejectLabSchema>;
