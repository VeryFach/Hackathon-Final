import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface StakeholderDashboard {
  totalSupply: {
    raw: number;
    clean: number;
  };
  gradeDistribution: Record<string, number>;
  yieldPerformance: {
    avgYield: number;
    avgSediment: number;
  };
  financialOverview: {
    totalMarketValue: number;
    averagePricePerLiter: number;
  };
  approvedBatches: number;
  rejectedBatches: number;
}

export interface CollectorDashboard {
  totalCollected: number;
  activeBatches: number;
  sentBatches: number;
  yieldPerformance: {
    avgYield: number;
  };
  revenueSummary: {
    totalValue: number;
    averagePricePerLiter: number;
  };
  pendingRequests: number;
  completedSubmissions: number;
}

export interface DepositorDashboard {
  totalSubmissions: number;
  pendingSubmissions: number;
  completedSubmissions: number;
  totalLiter: number;
  totalEarnings: number;
}

// ==================== API FUNCTIONS ====================

export const analyticsService = {
  getStakeholderDashboard: async (): Promise<StakeholderDashboard> => {
    const response = await api.get("/analytics/stakeholder");
    return response.data;
  },

  getCollectorDashboard: async (): Promise<CollectorDashboard> => {
    const response = await api.get("/analytics/collector");
    return response.data;
  },

  getDepositorDashboard: async (): Promise<DepositorDashboard> => {
    const response = await api.get("/analytics/depositor");
    return response.data;
  },
};
