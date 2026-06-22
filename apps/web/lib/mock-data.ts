export type SetoranStatus =
  | "diajukan"
  | "dijemput"
  | "diterima"
  | "diproses"
  | "selesai";

export type Grade = "A" | "B" | "C";

export interface Setoran {
  id: string;
  user: string;
  pengepul: string;
  volumeEstimasi: number;
  volumeAktual?: number;
  hargaPerLiter?: number;
  total?: number;
  status: SetoranStatus;
  grade?: Grade;
  batchId?: string;
  lokasi: string;
  catatan?: string;
  createdAt: string;
  timeline: { status: SetoranStatus; at: string }[];
}

export interface BatchItem {
  id: string;
  pengepul: string;
  totalLiter: number;
  jumlahPenyetor: number;
  estimatedValue: number;
  status: "draft" | "pending" | "approved" | "rejected";
  grade?: Grade;
  ffa?: number;
  moisture?: number;
  impurity?: number;
  createdAt: string;
  setoranIds: string[];
}

export interface PengepulLoc {
  id: string;
  name: string;
  city: string;
  stok: number;
  lat: number;
  lng: number;
}

export const pengepulList: PengepulLoc[] = [
  { id: "p1", name: "Hijau Lestari", city: "Jakarta Selatan", stok: 248, lat: -6.26, lng: 106.81 },
  { id: "p2", name: "Bumi Sehat", city: "Bandung", stok: 412, lat: -6.91, lng: 107.61 },
  { id: "p3", name: "Daur Mandiri", city: "Surabaya", stok: 187, lat: -7.25, lng: 112.75 },
  { id: "p4", name: "Eco Collect", city: "Yogyakarta", stok: 96, lat: -7.79, lng: 110.36 },
];

export const setoranList: Setoran[] = [
  {
    id: "STR-2041",
    user: "Anda",
    pengepul: "Hijau Lestari",
    volumeEstimasi: 5,
    volumeAktual: 4.8,
    hargaPerLiter: 6500,
    total: 31200,
    status: "selesai",
    grade: "A",
    batchId: "BTC-118",
    lokasi: "Jl. Kemang Raya 12",
    createdAt: "2025-06-12",
    timeline: [
      { status: "diajukan", at: "12 Jun 09:10" },
      { status: "dijemput", at: "12 Jun 11:40" },
      { status: "diterima", at: "12 Jun 13:05" },
      { status: "diproses", at: "14 Jun 10:00" },
      { status: "selesai", at: "16 Jun 16:20" },
    ],
  },
  {
    id: "STR-2052",
    user: "Anda",
    pengepul: "Hijau Lestari",
    volumeEstimasi: 3,
    volumeAktual: 3.1,
    hargaPerLiter: 5800,
    total: 17980,
    status: "diproses",
    grade: "B",
    batchId: "BTC-121",
    lokasi: "Jl. Kemang Raya 12",
    createdAt: "2025-06-18",
    timeline: [
      { status: "diajukan", at: "18 Jun 08:20" },
      { status: "dijemput", at: "18 Jun 10:10" },
      { status: "diterima", at: "18 Jun 11:30" },
      { status: "diproses", at: "20 Jun 09:15" },
    ],
  },
  {
    id: "STR-2061",
    user: "Anda",
    pengepul: "Hijau Lestari",
    volumeEstimasi: 4,
    status: "dijemput",
    lokasi: "Jl. Kemang Raya 12",
    createdAt: "2025-06-21",
    timeline: [
      { status: "diajukan", at: "21 Jun 07:55" },
      { status: "dijemput", at: "21 Jun 09:30" },
    ],
  },
  {
    id: "STR-2070",
    user: "Anda",
    pengepul: "Bumi Sehat",
    volumeEstimasi: 6,
    status: "diajukan",
    lokasi: "Kantor — Sudirman",
    catatan: "Tolong jemput sore hari",
    createdAt: "2025-06-22",
    timeline: [{ status: "diajukan", at: "22 Jun 06:40" }],
  },
];

export const incomingRequests = [
  { id: "REQ-301", user: "Rina K.", liter: 4, lokasi: "Kemang", jarak: "1.2 km" },
  { id: "REQ-302", user: "Adi P.", liter: 7, lokasi: "Pondok Indah", jarak: "3.4 km" },
  { id: "REQ-303", user: "Sari M.", liter: 2, lokasi: "Cipete", jarak: "0.8 km" },
  { id: "REQ-304", user: "Joko S.", liter: 5, lokasi: "Blok M", jarak: "2.1 km" },
];

export const inventory = [
  { id: "INV-01", source: "STR-2061", liter: 4, status: "raw" as const, masuk: "21 Jun" },
  { id: "INV-02", source: "STR-2052", liter: 3.1, status: "stored" as const, masuk: "18 Jun" },
  { id: "INV-03", source: "STR-2049", liter: 5.6, status: "stored" as const, masuk: "17 Jun" },
  { id: "INV-04", source: "STR-2041", liter: 4.8, status: "ready" as const, masuk: "12 Jun" },
  { id: "INV-05", source: "STR-2038", liter: 6.2, status: "ready" as const, masuk: "11 Jun" },
];

export const batches: BatchItem[] = [
  {
    id: "BTC-118",
    pengepul: "Hijau Lestari",
    totalLiter: 124,
    jumlahPenyetor: 28,
    estimatedValue: 806000,
    status: "approved",
    grade: "A",
    ffa: 1.8,
    moisture: 0.12,
    impurity: 0.4,
    createdAt: "2025-06-12",
    setoranIds: ["STR-2041"],
  },
  {
    id: "BTC-121",
    pengepul: "Hijau Lestari",
    totalLiter: 96,
    jumlahPenyetor: 22,
    estimatedValue: 556800,
    status: "pending",
    grade: "B",
    ffa: 3.2,
    moisture: 0.18,
    impurity: 0.7,
    createdAt: "2025-06-20",
    setoranIds: ["STR-2052"],
  },
  {
    id: "BTC-124",
    pengepul: "Bumi Sehat",
    totalLiter: 78,
    jumlahPenyetor: 17,
    estimatedValue: 421200,
    status: "pending",
    createdAt: "2025-06-21",
    setoranIds: [],
  },
];

export const supplyTrend = [
  { day: "Sen", supply: 142, demand: 180 },
  { day: "Sel", supply: 168, demand: 175 },
  { day: "Rab", supply: 195, demand: 190 },
  { day: "Kam", supply: 178, demand: 200 },
  { day: "Jum", supply: 220, demand: 210 },
  { day: "Sab", supply: 245, demand: 230 },
  { day: "Min", supply: 198, demand: 215 },
];