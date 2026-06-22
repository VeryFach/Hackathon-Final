"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
export default function Home() {
  const router = useRouter();
  const { user, loading, isError } = useUser();

  useEffect(() => { 
    if (loading) return;

    if (isError || !user) {
      router.replace("/login");
      return;
    }

    const role = user.role;

    if (role === "masyarakat") {
      router.replace("/masyarakat");
    } else if (role === "pengepul") {
      router.replace("/pengepul");
    } else if (role === "stakeholder") {
      router.replace("/stakeholder");
    } else {
      router.replace("/overview");
    }
  }, [user, loading, isError, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Mengecek sesi Anda...
        </p>
      </div>
    </div>
  );
}
