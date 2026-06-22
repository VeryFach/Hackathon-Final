import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Ngepulin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-background text-foreground antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}