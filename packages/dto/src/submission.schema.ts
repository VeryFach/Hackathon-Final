import { z } from 'zod';

export const CreateSubmissionSchema = z.object({
  estimatedLiter: z.number().positive('Estimated liter must be greater than 0'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const MarkInBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
});

export const RecordActualLiterSchema = z.object({
  actualLiter: z.number().positive('Actual liter must be greater than 0'),
});

export type ICreateSubmissionDto = z.infer<typeof CreateSubmissionSchema>;
export type IMarkInBatchDto = z.infer<typeof MarkInBatchSchema>;
export type IRecordActualLiterDto = z.infer<typeof RecordActualLiterSchema>;
