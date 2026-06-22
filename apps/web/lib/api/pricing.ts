import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface Pricing {
  id: string;
  createdBy: string;
  active: boolean;
  createdAt: string;
  creator?: {
    id: string;
    fullName: string;
    email: string;
  };
  gradeRules?: GradeRule[];
  volumeRules?: VolumeRule[];
  batchPricings?: BatchPricing[];
}

export interface GradeRule {
  id: string;
  pricingId: string;
  grade: "A" | "B" | "C";
  basePrice: number;
  qualityFactor: number;
}

export interface VolumeRule {
  id: string;
  pricingId: string;
  minVolume: number;
  maxVolume: number | null;
  bonusFactor: number;
}

export interface BatchPricing {
  id: string;
  batchId: string;
  pricingId: string;
  finalPricePerLiter: number;
  totalValue: number;
  calculatedAt: string;
}

export interface CreatePricingDto {
  name?: string;
  basePrice?: number;
}

export interface CreateGradeRuleDto {
  grade: "A" | "B" | "C";
  multiplier: number;
  basePrice?: number;
}

export interface CreateVolumeRuleDto {
  minVolume: number;
  maxVolume?: number | null;
  percentage: number;
}

// ==================== API FUNCTIONS ====================

export const pricingService = {
  create: async (data: CreatePricingDto = {}): Promise<Pricing> => {
    const response = await api.post("/pricing", data);
    return response.data;
  },

  addGradeRule: async (pricingId: string, data: CreateGradeRuleDto): Promise<GradeRule> => {
    const response = await api.post(`/pricing/${pricingId}/grade-rules`, data);
    return response.data;
  },

  addVolumeRule: async (pricingId: string, data: CreateVolumeRuleDto): Promise<VolumeRule> => {
    const response = await api.post(`/pricing/${pricingId}/volume-rules`, data);
    return response.data;
  },

  activate: async (pricingId: string): Promise<Pricing> => {
    const response = await api.patch(`/pricing/${pricingId}/activate`);
    return response.data;
  },

  calculate: async (batchId: string): Promise<BatchPricing> => {
    const response = await api.post(`/pricing/calculate/${batchId}`);
    return response.data;
  },

  getAll: async (): Promise<Pricing[]> => {
    const response = await api.get("/pricing");
    return response.data;
  },

  getById: async (pricingId: string): Promise<Pricing> => {
    const response = await api.get(`/pricing/${pricingId}`);
    return response.data;
  },
};
