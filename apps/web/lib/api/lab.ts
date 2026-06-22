import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface LabResult {
  id: string;
  batchId: string;
  acidityLevel: number;
  waterContent: number;
  impurityLevel: number;
  grade: "A" | "B" | "C";
  notes?: string;
  testedAt: string;
  batch?: {
    id: string;
    status: string;
    collector?: {
      user: {
        fullName: string;
        email: string;
      };
    };
  };
}

export interface CreateLabResultDto {
  ffa: number;
  water: number;
  impurity: number;
  notes?: string;
}

export interface RejectLabDto {
  reason: string;
}

// ==================== API FUNCTIONS ====================

export const labService = {
  create: async (batchId: string, data: CreateLabResultDto): Promise<LabResult> => {
    const response = await api.post(`/lab/${batchId}`, data);
    return response.data;
  },

  getByBatch: async (batchId: string): Promise<LabResult> => {
    const response = await api.get(`/lab/${batchId}`);
    return response.data;
  },

  approve: async (batchId: string): Promise<any> => {
    const response = await api.patch(`/lab/${batchId}/approve`);
    return response.data;
  },

  reject: async (batchId: string, data: RejectLabDto): Promise<any> => {
    const response = await api.patch(`/lab/${batchId}/reject`, data);
    return response.data;
  },
};
