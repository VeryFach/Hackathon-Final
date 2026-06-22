import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface Payout {
  id: string;
  submissionId: string;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
  submission?: {
    id: string;
    actualLiter: number | null;
    estimatedLiter: number;
    status: string;
    depositor?: {
      user: {
        fullName: string;
        email: string;
      };
    };
    batchItems?: Array<{
      batch?: {
        id: string;
        totalRawOilLiter: number;
        batchPricing?: {
          totalValue: number;
          finalPricePerLiter: number;
        } | null;
      };
    }>;
  };
}

// ==================== API FUNCTIONS ====================

export const payoutService = {
  create: async (submissionId: string): Promise<Payout> => {
    const response = await api.post(`/payouts/${submissionId}`);
    return response.data;
  },

  pay: async (payoutId: string): Promise<Payout> => {
    const response = await api.patch(`/payouts/${payoutId}/pay`);
    return response.data;
  },

  findMine: async (): Promise<Payout[]> => {
    const response = await api.get("/payouts/me");
    return response.data;
  },

  getAll: async (): Promise<Payout[]> => {
    const response = await api.get("/payouts");
    return response.data;
  },
};
