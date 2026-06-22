import { z } from 'zod';

export const CreateBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
});

export const AddBatchItemsSchema = z.object({
  submissionIds: z.array(z.string()).min(1, 'At least one submission ID is required'),
});

export const ProcessBatchSchema = z.object({
  rawOil: z.number().positive('Raw oil must be greater than 0'),
  residue: z.number().min(0, 'Residue must be non-negative'),
});

export type ICreateBatchDto = z.infer<typeof CreateBatchSchema>;
export type IAddBatchItemsDto = z.infer<typeof AddBatchItemsSchema>;
export type IProcessBatchDto = z.infer<typeof ProcessBatchSchema>;
