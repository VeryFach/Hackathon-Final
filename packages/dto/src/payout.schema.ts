export interface IPayoutResponse {
  id: string;
  submissionId: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  submission?: {
    id: string;
    actualLiter: number | null;
    estimatedLiter: number;
    status: string;
    depositor?: {
      id: string;
      user?: {
        id: string;
        fullName: string;
        email: string;
      };
    };
    batchItems?: Array<{
      id: string;
      batch?: {
        id: string;
        totalRawOilLiter: number;
        totalCleanOilLiter: number;
        status: string;
        batchPricing?: {
          id: string;
          totalValue: number;
          finalPricePerLiter: number;
        } | null;
      };
    }>;
  };
}
