import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface DepositorProfile {
  id: string;
  userId: string;
  latitude: string;
  longitude: string;
  address: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CollectorProfile {
  id: string;
  userId: string;
  latitude: string;
  longitude: string;
  warehouseAddress: string;
  serviceRadiusKm: number;
  capacityLiter: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateDepositorDto {
  latitude: string;
  longitude: string;
  address: string;
}

export interface CreateCollectorDto {
  latitude: string;
  longitude: string;
  warehouseAddress: string;
  serviceRadiusKm: number;
  capacityLiter: number;
}

// ==================== API FUNCTIONS ====================

export const profileService = {
  // Depositor
  createDepositor: async (data: CreateDepositorDto): Promise<DepositorProfile> => {
    const response = await api.post("/profiles/depositor", data);
    return response.data;
  },

  getDepositor: async (): Promise<DepositorProfile> => {
    const response = await api.get("/profiles/depositor");
    return response.data;
  },

  updateDepositor: async (data: Partial<CreateDepositorDto>): Promise<DepositorProfile> => {
    const response = await api.patch("/profiles/depositor", data);
    return response.data;
  },

  // Collector
  createCollector: async (data: CreateCollectorDto): Promise<CollectorProfile> => {
    const response = await api.post("/profiles/collector", data);
    return response.data;
  },

  getCollector: async (): Promise<CollectorProfile> => {
    const response = await api.get("/profiles/collector");
    return response.data;
  },

  updateCollector: async (data: Partial<CreateCollectorDto>): Promise<CollectorProfile> => {
    const response = await api.patch("/profiles/collector", data);
    return response.data;
  },
};
