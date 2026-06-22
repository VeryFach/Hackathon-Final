import { z } from 'zod';

export const CreateDepositorProfileSchema = z.object({
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a valid decimal'),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a valid decimal'),
    address: z.string().min(1),
});

export const UpdateDepositorProfileSchema = z.object({
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    address: z.string().min(1).optional(),
});

// Collector
export const CreateCollectorProfileSchema = z.object({
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/),
    warehouseAddress: z.string().min(1),
    serviceRadiusKm: z.number().nonnegative(),
    capacityLiter: z.number().nonnegative(),
});

export const UpdateCollectorProfileSchema = z.object({
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    warehouseAddress: z.string().min(1).optional(),
    serviceRadiusKm: z.number().nonnegative().optional(),
    capacityLiter: z.number().nonnegative().optional(),
});

export type ICreateDepositorProfileDto = z.infer<typeof CreateDepositorProfileSchema>;
export type IUpdateDepositorProfileDto = z.infer<typeof UpdateDepositorProfileSchema>;
export type ICreateCollectorProfileDto = z.infer<typeof CreateCollectorProfileSchema>;
export type IUpdateCollectorProfileDto = z.infer<typeof UpdateCollectorProfileSchema>;