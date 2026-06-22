"use client";

import React from "react";
import "./globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";
import { Toaster } from "sonner";
import { UserProvider } from "@/lib/user-context";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-background text-foreground antialiased">
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            {children}
            <Toaster position="top-right" richColors />
          </UserProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}