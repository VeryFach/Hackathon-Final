import { z } from 'zod';

export const CreateSubmissionSchema = z.object({
  estimatedLiter: z.number().positive('Estimated liter must be greater than 0'),
});

export const MarkInBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
});

export type ICreateSubmissionDto = z.infer<typeof CreateSubmissionSchema>;
export type IMarkInBatchDto = z.infer<typeof MarkInBatchSchema>;
