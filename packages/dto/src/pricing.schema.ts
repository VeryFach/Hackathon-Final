import { z } from 'zod';

export const CreatePricingSchema = z.object({
  name: z.string().min(1).optional(),
  basePrice: z.number().min(1).optional(),
});

export type ICreatePricingDto = z.infer<typeof CreatePricingSchema>;

export const CreateGradeRuleSchema = z.object({
  grade: z.string().min(1),
  multiplier: z.number().min(0.1),
  basePrice: z.number().min(1).optional(),
});

export type ICreateGradeRuleDto = z.infer<typeof CreateGradeRuleSchema>;

export const CreateVolumeRuleSchema = z.object({
  minVolume: z.number(),
  maxVolume: z.number().nullable().optional(),
  percentage: z.number(),
});

export type ICreateVolumeRuleDto = z.infer<typeof CreateVolumeRuleSchema>;
