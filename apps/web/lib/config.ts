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

export const CONFIG = {
  appName: "Eco-Oil",
  appTagline: "Less Waste, More Value",

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
        id: "st-lab",
        label: "Lab Approval",
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
  },
} as const;
