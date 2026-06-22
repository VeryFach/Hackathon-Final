import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface Batch {
  id: string;
  collectorId: string;
  validatedBy: string;
  totalRawOilLiter: number;
  totalCleanOilLiter: number;
  residueLiter: number;
  sedimentRatio: string;
  yieldRatio: string;
  totalLiter: number;
  status: "draft" | "sent" | "approved" | "rejected";
  createdAt: string;
  collector?: {
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  validator?: {
    id: string;
    fullName: string;
    email: string;
  };
  batchItems?: Array<{
    id: string;
    submission: {
      id: string;
      estimatedLiter: number;
      actualLiter: number | null;
    };
  }>;
  labResult?: {
    id: string;
    grade: string;
    acidityLevel: number;
    waterContent: number;
    impurityLevel: number;
  } | null;
  batchPricing?: {
    id: string;
    finalPricePerLiter: number;
    totalValue: number;
  } | null;
}

export interface CreateBatchDto {
  name?: string;
}

export interface AddBatchItemsDto {
  submissionIds: string[];
}

export interface ProcessBatchDto {
  rawOil: number;
  residue: number;
}

// ==================== API FUNCTIONS ====================

export const batchService = {
  create: async (data: CreateBatchDto = {}): Promise<Batch> => {
    const response = await api.post("/batches", data);
    return response.data;
  },

  addItems: async (batchId: string, data: AddBatchItemsDto): Promise<Batch> => {
    const response = await api.post(`/batches/${batchId}/items`, data);
    return response.data;
  },

  process: async (batchId: string, data: ProcessBatchDto): Promise<Batch> => {
    const response = await api.patch(`/batches/${batchId}/process`, data);
    return response.data;
  },

  send: async (batchId: string): Promise<Batch> => {
    const response = await api.patch(`/batches/${batchId}/send`);
    return response.data;
  },

  getById: async (batchId: string): Promise<Batch> => {
    const response = await api.get(`/batches/${batchId}`);
    return response.data;
  },
};
