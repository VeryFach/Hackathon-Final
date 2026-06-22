import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Ngepulin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className="bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
