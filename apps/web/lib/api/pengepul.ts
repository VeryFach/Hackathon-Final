import { batchService } from "./batches";
import { submissionService } from "./submissions";
import type { Batch } from "./batches";
import type { Submission } from "./submissions";

export type PengepulRequest = {
  id: string;
  user: string;
  liter: number;
  lokasi: string;
  jarak: string;
};

export type PengepulInventoryItem = {
  id: string;
  source: string;
  liter: number;
  masuk: string;
  status: "raw" | "stored" | "ready";
  submissionStatus: Submission["status"];
};

export type PengepulBatchItem = {
  id: string;
  createdAt: string;
  totalLiter: number;
  jumlahPenyetor: number;
  grade?: string;
  estimatedValue: number;
  status: "draft" | "pending" | "approved" | "rejected";
};

export type PengepulDashboard = {
  inventory: PengepulInventoryItem[];
  incomingRequests: PengepulRequest[];
  batches: PengepulBatchItem[];
  activeDepositors: number;
};

const shortId = (id: string, prefix: string) =>
  `${prefix}-${id.slice(0, 6).toUpperCase()}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));

const toRequest = (submission: Submission): PengepulRequest => ({
  id: submission.id,
  user: submission.depositor?.user.fullName ?? "Penyetor",
  liter: submission.estimatedLiter,
  lokasi: submission.depositor?.address ?? "-",
  jarak: "-",
});

const toInventoryItem = (submission: Submission): PengepulInventoryItem => ({
  id: submission.id,
  source: shortId(submission.id, "STR"),
  liter: submission.actualLiter ?? submission.estimatedLiter,
  masuk: formatDate(submission.createdAt),
  status:
    submission.status === "accepted"
      ? "raw"
      : submission.actualLiter
        ? "ready"
        : "stored",
  submissionStatus: submission.status,
});

const toBatchItem = (batch: Batch): PengepulBatchItem => ({
  id: shortId(batch.id, "BTC"),
  createdAt: formatDate(batch.createdAt),
  totalLiter: batch.totalLiter || batch.totalRawOilLiter,
  jumlahPenyetor: batch.batchItems?.length ?? 0,
  grade: batch.labResult?.grade,
  estimatedValue: batch.batchPricing?.totalValue ?? 0,
  status: batch.status === "sent" ? "pending" : batch.status,
});

export const pengepulService = {
  getRequests: async (): Promise<PengepulRequest[]> => {
    const submissions = await submissionService.findPending();
    return submissions.map(toRequest);
  },

  acceptRequest: (id: string) => submissionService.accept(id),

  getInventory: async (): Promise<PengepulInventoryItem[]> => {
    const submissions = await submissionService.findForCollector();
    return submissions
      .filter((submission) =>
        ["accepted", "picked_up"].includes(submission.status),
      )
      .map(toInventoryItem);
  },

  getBatches: async (): Promise<PengepulBatchItem[]> => {
    const batches = await batchService.findMine();
    return batches.map(toBatchItem);
  },

  getDashboard: async (): Promise<PengepulDashboard> => {
    const [inventory, incomingRequests, batches] = await Promise.all([
      pengepulService.getInventory(),
      pengepulService.getRequests(),
      pengepulService.getBatches(),
    ]);

    return {
      inventory,
      incomingRequests,
      batches,
      activeDepositors: inventory.length + incomingRequests.length,
    };
  },

  createBatchFromInventory: async (items: PengepulInventoryItem[]) => {
    for (const item of items) {
      if (item.submissionStatus === "accepted") {
        await submissionService.pickup(item.id);
      }

      if (item.status !== "ready") {
        await submissionService.recordActualLiter(item.id, {
          actualLiter: item.liter,
        });
      }
    }

    const batch = await batchService.create();
    const submissionIds = items.map((item) => item.id);
    const totalLiter = items.reduce((sum, item) => sum + item.liter, 0);

    await batchService.addItems(batch.id, { submissionIds });
    await batchService.process(batch.id, {
      rawOil: totalLiter,
      residue: 0,
    });

    return batchService.send(batch.id);
  },
};
