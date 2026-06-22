import {
  LayoutDashboard,
  BarChart2,
  MessageSquare,
  Settings,
  User,
  Boxes,
  ClipboardCheck,
  FlaskConical,
  Inbox,
  Layers,
  MapIcon,
  PackageCheck,
  Plus,
  Tags,
  History 
} from "lucide-react";
import { T } from "./design-tokens";

/**
 * ════════════════════════════════════════════════════════
 *  CONFIG — isi sesuai topik hackathon
 *  Ganti semua data di bawah untuk menyesuaikan tema.
 * ════════════════════════════════════════════════════════
 */
export const CONFIG = {
  appName: "Ngepulin",
  appTagline: "Tagline singkat",

  // Tab navigasi sidebar — tambah/hapus sesuai fitur
  navItems: {
    masyarakat: [
      {
        id: "ms-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/masyarakat",
        exact: true
      },
      {
        id: "ms-create-setoran",
        label: "Ajukan Setoran",
        icon: Plus,
        href: "/masyarakat/setoran/new",
      },
      {
        id: "ms-history",
        label: "Riwayat",
        icon: History,
        href: "/masyarakat/setoran",
      },
    ],

    pengepul: [
      {
        id: "pg-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/pengepul",
        exact: true
      },
      {
        id: "pg-requests",
        label: "Permintaan Masuk",
        icon: Inbox,
        href: "/pengepul/requests",
      },
      {
        id: "pg-inventory",
        label: "Inventory",
        icon: Boxes,
        href: "/pengepul/inventory",
      },
      {
        id: "pg-batch-create",
        label: "Buat Batch",
        icon: Layers,
        href: "/pengepul/batches/new",
      },
      {
        id: "pg-batch-history",
        label: "Riwayat Batch",
        icon: PackageCheck,
        href: "/pengepul/batches",
      },
    ],

    stakeholder: [
      {
        id: "st-analytics",
        label: "Analytics",
        icon: BarChart2,
        href: "/stakeholder",
        exact: true
      },
      {
        id: "st-approval",
        label: "Approval Batch",
        icon: ClipboardCheck,
        href: "/stakeholder/approvals",
      },
      {
        id: "st-lab",
        label: "Lab Results",
        icon: FlaskConical,
        href: "/stakeholder/lab",
      },
      {
        id: "st-pricing",
        label: "Pricing",
        icon: Tags,
        href: "/stakeholder/pricing",
      },
      {
        id: "st-map",
        label: "Map",
        icon: MapIcon,
        href: "/stakeholder/map",
      },
      {
        id: "st-prediction",
        label: "Prediction",
        icon: History,
        href: "/stakeholder/prediction",
      },
    ],

    // /**
    //  * optional global menu (kalau butuh)
    //  */
    // global: [
    //   {
    //     id: "profile",
    //     label: "Profile",
    //     icon: User,
    //     href: "/profile",
    //   },
    //   {
    //     id: "settings",
    //     label: "Settings",
    //     icon: Settings,
    //     href: "/settings",
    //   },
    //   {
    //     id: "assistant",
    //     label: "AI Assistant",
    //     icon: MessageSquare,
    //     href: "/ai-assistant",
    //   },
    // ],
  },

  // // Kartu metrik — isi value, label, dan tren
  // metrics: [
  //   {
  //     id: "m1",
  //     label: "Metric 1",
  //     value: "—",
  //     unit: "",
  //     trend: null,
  //     color: T.primary,
  //   },
  //   {
  //     id: "m2",
  //     label: "Metric 2",
  //     value: "—",
  //     unit: "",
  //     trend: null,
  //     color: T.success,
  //   },
  //   {
  //     id: "m3",
  //     label: "Metric 3",
  //     value: "—",
  //     unit: "",
  //     trend: null,
  //     color: T.warning,
  //   },
  //   {
  //     id: "m4",
  //     label: "Metric 4",
  //     value: "—",
  //     unit: "",
  //     trend: null,
  //     color: T.danger,
  //   },
  // ],

  // // Data grafik area — ganti key & data
  // areaChart: {
  //   label: "Tren Utama",
  //   dataKey: "value",
  //   color: T.primary,
  //   data: [
  //     { x: "Jan", value: 40 },
  //     { x: "Feb", value: 55 },
  //     { x: "Mar", value: 48 },
  //     { x: "Apr", value: 70 },
  //     { x: "Mei", value: 63 },
  //     { x: "Jun", value: 82 },
  //     { x: "Jul", value: 75 },
  //   ],
  // },

  // // Data grafik bar — ganti key & data
  // barChart: {
  //   label: "Distribusi Kategori",
  //   dataKey: "value",
  //   color: T.info,
  //   data: [
  //     { x: "A", value: 30 },
  //     { x: "B", value: 55 },
  //     { x: "C", value: 20 },
  //     { x: "D", value: 45 },
  //     { x: "E", value: 60 },
  //     { x: "F", value: 35 },
  //   ],
  // },

  // // Tabel data — ganti kolom dan baris
  // table: {
  //   label: "Data Tabel",
  //   columns: ["Nama", "Kategori", "Nilai", "Status"],
  //   rows: [
  //     { nama: "Item A", kategori: "Tipe 1", nilai: "100", status: "active" },
  //     { nama: "Item B", kategori: "Tipe 2", nilai: "240", status: "warning" },
  //     { nama: "Item C", kategori: "Tipe 1", nilai: "85", status: "active" },
  //     { nama: "Item D", kategori: "Tipe 3", nilai: "310", status: "danger" },
  //     { nama: "Item E", kategori: "Tipe 2", nilai: "175", status: "active" },
  //   ],
  // },

  // // Alert / notifikasi
  // alerts: [
  //   {
  //     id: 1,
  //     level: "danger",
  //     title: "Alert Kritis",
  //     desc: "Deskripsi kondisi yang perlu ditangani segera.",
  //   },
  //   {
  //     id: 2,
  //     level: "warning",
  //     title: "Perlu Perhatian",
  //     desc: "Deskripsi kondisi yang perlu dipantau.",
  //   },
  //   {
  //     id: 3,
  //     level: "success",
  //     title: "Berjalan Normal",
  //     desc: "Deskripsi kondisi yang sudah baik.",
  //   },
  // ],

  // // AI Assistant — greeting & quick prompts
  // assistant: {
  //   name: "AI Assistant",
  //   greeting: "Halo! Saya siap membantu. Apa yang ingin Anda tanyakan?",
  //   quickPrompts: [
  //     "Pertanyaan contoh 1",
  //     "Pertanyaan contoh 2",
  //     "Pertanyaan contoh 3",
  //   ],
  // },
} as const;
