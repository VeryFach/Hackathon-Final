"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios"; // Sesuaikan path ini dengan lokasi axios instance Anda
import { clearAuthSession, storeCurrentUser } from "@/lib/auth-storage";

// Tambahkan properti lain seperti role jika diperlukan
export interface User {
  id: string;
  email: string;
  fullName: string;
  role?: string; 
}

// Fungsi fetcher menggunakan axios
const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get("/auth/me");
  storeCurrentUser(response.data);
  return response.data;
};

export function useUser() {
  const {
    data: user = null, // Default null jika belum ada data
    isLoading: loading,
    refetch,
    isError,
    error,
  } = useQuery<User, Error>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false, // Jangan di-retry berulang kali jika user memang belum login (401)
    staleTime: 5 * 60 * 1000, // Opsional: Data dianggap fresh selama 5 menit
  });

  useEffect(() => {
    if (isError) {
      clearAuthSession();
    }
  }, [isError]);

  return {
    user,
    loading,
    // Kita aliaskan refetch bawaan React Query menjadi fetchUser agar 
    // kompatibel dengan komponen Anda yang mungkin sudah menggunakan nama ini.
    fetchUser: refetch, 
    isError,
    error,
  };
}
