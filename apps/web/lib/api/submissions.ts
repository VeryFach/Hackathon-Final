import { api } from "@/lib/axios";

// ==================== TYPES ====================

export interface Submission {
  id: string;
  estimatedLiter: number;
  actualLiter: number | null;
  status: "pending" | "accepted" | "picked_up" | "in_batch" | "completed";
  depositorId: string;
  collectorId: string | null;
  createdAt: string;
  depositor?: {
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  collector?: {
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  batchItems?: Array<{
    id: string;
    batchId: string;
    batch?: {
      id: string;
      labResult?: {
        id: string;
        acidityLevel: number;
        impurityLevel: number;
        waterContent: number;
        grade: string;
        notes: string | null;
      } | null;
    } | null;
  }>;
  payout?: {
    id: string;
    amount: number;
    status: string;
  } | null;
}

export interface CreateSubmissionDto {
  estimatedLiter: number;
}

export interface RecordActualLiterDto {
  actualLiter: number;
}

// ==================== API FUNCTIONS ====================

export const submissionService = {
  create: async (data: CreateSubmissionDto): Promise<Submission> => {
    const response = await api.post("/submissions", data);
    return response.data;
  },

  findMine: async (): Promise<Submission[]> => {
    const response = await api.get("/submissions/me");
    return response.data;
  },

  findPending: async (): Promise<Submission[]> => {
    const response = await api.get("/submissions/pending");
    return response.data;
  },

  accept: async (id: string): Promise<Submission> => {
    const response = await api.patch(`/submissions/${id}/accept`);
    return response.data;
  },

  pickup: async (id: string): Promise<Submission> => {
    const response = await api.patch(`/submissions/${id}/pickup`);
    return response.data;
  },

  recordActualLiter: async (
    id: string,
    data: RecordActualLiterDto,
  ): Promise<Submission> => {
    const response = await api.patch(`/submissions/${id}/actual-liter`, data);
    return response.data;
  },

  getById: async (id: string): Promise<Submission> => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },
};
